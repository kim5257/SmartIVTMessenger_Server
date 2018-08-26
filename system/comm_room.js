let dbctrl = require('./dbctrl');
let util = require('./util');
var fcm = require('./fcm');

let connList = new Map();
let io = null;

function initSocket (io_) {
    io = io_;
}

function initRoomHandler (sock) {
    sock.on('join_room', (msg) => {
        console.log('join_room: ' + JSON.stringify(msg));

        sock['where'] = 'room';
        sock['where_info'] = {roomNum: msg.room_num};

        let all = msg.room_num + '/all';
        let user = msg.room_num + '/' + sock.request.user.user_id;

        sock.join(all);
        sock.join(user);

        // 상담사일경우 mgr/wmgr 타입도 수신
        if ( sock.request.user.role === 'mgr' )
        {
            let mgr = msg.room_num + '/mgr';
            sock.join(mgr);

            mgr = msg.room_num + '/wmgr';
            sock.join(mgr);
        }

        // 대화방 연결 리스트에 사용자 추가
        let userList = connList.get(msg.room_num);
        if ( userList == null ) {
            connList.set(msg.room_num, new Map());
            userList = connList.get(msg.room_num);
        }

        let userInfo = userList.get(sock.request.user.user_id);
        if ( userInfo == null ) {
            userList.set(sock.request.user.user_id, {refCnt: 0});
            userInfo = userList.get(sock.request.user.user_id);
        }

        ++userInfo.refCnt;

        console.log('connList Size: ' + connList.size);
    });

    sock.on('chat_msg', function(msg){
        let timestamp = util.getTimeString();

        console.log('msg(' + timestamp + '): ' + JSON.stringify(msg));

        msg.pack['timestamp'] = timestamp;

        if ( Array.isArray(msg.pack['to']) === false ) {
            dbctrl.writeMsg(msg, function (result) {
                if (result.result === 'success') {

                    console.log('lastMsgNo: ' + result.lastMsgNo);
                    console.log('user in room: ' + connList.get(msg.room_num).toString());
                    connList.get(msg.room_num).forEach(function(val, key) {
                        console.log('user[' + key + ']: ' + JSON.stringify(val));
                    });

                    let to = msg.room_num + '/' + msg.pack.to;

                    msg.pack.msg_no = result.lastMsgNo;
                    io.to(to).emit('chat_msg', msg.pack);

                    // 만약 전체 전송이 아니라면 나 자신에게도 내용 전달
                    if (msg.pack.to != 'all' && msg.pack.to != 'wmgr') {
                        let me = msg.room_num + '/' + msg.pack.from;
                        io.to(me).emit('chat_msg', msg.pack);
                    }

                    // FCM 전송
                    fcm.sendMessage(msg);

                    // 해당 대화방에 접속 중인 사용자만 last_msg_no 업데이트
                    dbctrl.setLastMsgNo(msg.room_num, connList.get(msg.room_num));
                }
                else {
                    console.log('Error');
                }
            });
        }
        else {
            msg.pack['to'].forEach(function(item) {

                let newMsg = JSON.parse(JSON.stringify(msg));

                newMsg.pack['to'] = item;

                console.log('to2: ' + item);
                dbctrl.writeMsg(newMsg, function (result) {
                    if (result.result === 'success') {

                        console.log('lastMsgNo: ' + result.lastMsgNo);

                        let to = newMsg.room_num + '/' + newMsg.pack.to;

                        newMsg.pack.msg_no = result.lastMsgNo;
                        io.to(to).emit('chat_msg', newMsg.pack);

                        // 만약 전체 전송이 아니라면 나 자신에게도 내용 전달
                        if (newMsg.pack.to != 'all' && newMsg.pack.to != 'wmgr') {
                            let me = newMsg.room_num + '/' + newMsg.pack.from;
                            io.to(me).emit('chat_msg', newMsg.pack);
                        }

                        // FCM 전송
                        fcm.sendMessage(newMsg);

                        // 해당 대화방에 접속 중인 사용자만 last_msg_no 업데이트
                        dbctrl.setLastMsgNo(newMsg.room_num, connList.get(newMsg.room_num));
                    }
                    else {
                        console.log('Error');
                    }
                });
            });
        }
    });

    sock.on('req_msg_log', function(msg) {
        console.log('res_msg_log: ' + JSON.stringify(msg));

        // 마지막 읽은 메시지 ID 가져오기
        dbctrl.getLastMsgNo(msg['room_num'], msg['from'], (result) => {

            console.log('lastMsgNo: ' + JSON.stringify(result));


            if ( 20 < result.nonReadMsgCnt ) {
                msg['limit'] = result.nonReadMsgCnt;
            }

            // 마지막 읽은 메시지부터 마지막 까지 가져오기
            dbctrl.readMsg(msg['room_num'], msg['from'], msg['to'], msg['limit'], msg['offset'], function (result_) {

                result_['last_msg_no'] = result.lastMsgNo;

                console.log('res_msg_log: ' + JSON.stringify(result_));
                sock.emit('res_msg_log', result_);

                dbctrl.setLastMsgNo(msg['room_num'], connList.get(msg['room_num']));
            });
        });
    });

    sock.on('req_msg_log2', function(msg) {
        console.log('res_msg_log2: ' + JSON.stringify(msg));

        // 찾은 메시지 위치까지 메시지 로그 가져오기
        dbctrl.readMsg2(msg['room_num'], msg['from'], msg['to'], msg['msgNo'], msg['offset'], function (result) {

            result.msgNo = msg['msgNo'];

            console.log('res_msg_log2: ' + JSON.stringify(result));
            sock.emit('res_msg_log2', result);
        });
    });

    sock.on('req_search_msg', function(msg) {
        console.log('res_msg_log: ' + JSON.stringify(msg));

        // 마지막 읽은 메시지 ID 가져오기
        dbctrl.searchMsg(msg['room_num'], msg['from'], msg['to'], msg['keyword'], (result) => {
            console.log('result: ' + JSON.stringify(result));

            result['keyword'] = msg['keyword'];

            sock.emit('res_search_msg', result);
        });
    });
}

function deinitRoomHandler (sock) {

    let roomNum = sock['where_info'].roomNum;

    // 대화방 연결 리스트에 사용자 제거
    let userList = connList.get(roomNum);
    let userInfo = userList.get(sock.request.user.user_id);

    --userInfo.refCnt;

    // 해당 사용자 참조수가 0라면 객체 제거
    if ( userInfo.refCnt == 0 ) {
        userList.delete(sock.request.user.user_id);
    }

    // 해당 대화방 접속 사용자수가 0라면 객체 제거
    if ( userList.size == 0 ) {
        connList.delete(roomNum);
    }

    console.log('connList Size: ' + connList.size);
}

exports.initSocket = initSocket;
exports.initRoomHandler = initRoomHandler;
exports.deinitRoomHandler = deinitRoomHandler;