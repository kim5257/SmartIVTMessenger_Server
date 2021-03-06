var dbctrl = require('./dbctrl');
var util = require('./util');
var passportSocketio = require('passport.socketio');
var fcm = require('./fcm');
var commRoom = require('./comm_room');

var io = null;

function initSock (server, cookieParser, sessionStore) {
    console.log('initSock');

    io = require('socket.io')(server);

    commRoom.initSocket(io);

    io.set('authorization', passportSocketio.authorize({
        cokieParser: cookieParser,
        secret: 'secret',
        store: sessionStore,
        success: onAuthSuccess,
        fail: onAuthFail
    }));

    io.on('connection', function(sock){
        console.log('New user connected');

        commRoom.initRoomHandler(sock);

        sock.on('join_userlist', function(msg) {
            console.log('msg: ' + JSON.stringify(msg));

            var user = 'userlist/' + sock.request.user.user_id;

            sock.join(user);
        });

        sock.on('join_roomlist', function(msg) {
            console.log('msg: ' + JSON.stringify(msg));

            var user = 'roomlist/' + sock.request.user.user_id;

            console.log('join: ' + user);

            sock.join(user);
        });

        sock.on('req_except_user', function(msg) {

            // DB 에서 회원을 방에서 제외하도록 처리
            console.log('req except: ' + JSON.stringify(msg));
            console.log('user: ' + JSON.stringify(sock.request.user));

            // 사용자가 상담사인지 확인
            if ( sock.request.user['role'] === 'mgr' ) {
                dbctrl.delRoomUser(msg['room_num'], msg['user_id'], (result) => {
                    if ( result.result === 'success' ) {
                        // 처리하면 방에 속하는 모든 회원들에게 메시지 전달
                        var to = msg.room_num + '/all';

                        io.to(to).emit('req_except_user', msg);
                    }
                });
            }
        });

        sock.on('req_del_user', (msg) => {
            // DB 에서 회원을 방에서 제외하도록 처리
            console.log('req del user: ' + JSON.stringify(msg));
            console.log('user: ' + JSON.stringify(sock.request.user));

            // 사용자가 상담사인지 확인
            if ( sock.request.user['role'] === 'mgr' ) {
                dbctrl.delUser(sock.request.user['user_id'], msg['user_id'], (result) => {
                    if ( result.result === 'success' ) {
                        // 처리하면 자기 이름으로 로그인된 모든 장치에게 전달
                        var to = 'userlist/' + sock.request.user['user_id'];

                        io.to(to).emit('req_del_user', msg);
                    }
                });
            }
        });

        sock.on('req_del_room', (msg) => {
            // DB 에서 회원을 방에서 제외하도록 처리
            console.log('req del room: ' + JSON.stringify(msg));
            console.log('user: ' + JSON.stringify(sock.request.user));

            // 사용자가 상담사인지 확인
            if ( sock.request.user['role'] === 'mgr' ) {
                dbctrl.delRoom(sock.request.user['user_id'], msg['room_num'], (result) => {
                    if ( result.result === 'success' ) {
                        // 처리하면 자기 이름으로 로그인된 모든 장치에게 전달
                        var to = 'roomlist/' + sock.request.user['user_id'];

                        console.log('to: ' + to);

                        io.to(to).emit('req_del_room', msg);
                    }
                });
            }
        });

        sock.on('disconnect', (data) => {
            console.log('sock disconnected: ' + JSON.stringify(data));

            if ( sock['where'] === 'room' ) {
                commRoom.deinitRoomHandler(sock);
            }
        })
    });

    io.on('disconnect', function() {
        console.log('disconnected');
    });
}

function sendMsg (msg) {
    var timestamp = util.getTimeString();

    console.log('msg(' + timestamp + '): ' + JSON.stringify(msg));

    msg.pack['timestamp'] = timestamp;

    dbctrl.writeMsg(msg, function(result) {
        if (result.result==='success') {
            var to = msg.room_num + '/' + msg.pack.to;

            io.to(to).emit('chat_msg', msg.pack);

            // 만약 전체 전송이 아니라면 나 자신에게도 내용 전달
            if ( msg.pack.to != 'all' ) {
                var me = msg.room_num + '/' + msg.pack.from;
                io.to(me).emit('chat_msg', msg.pack);
            }

            // FCM 전송
            fcm.sendMessage(msg);
        }
        else
        {
            console.log('Error');
        }
    });
}

function onAuthSuccess (data, accept) {
    accept(null, true);
}

function onAuthFail (data, msg, error, accept) {
    console.log('onAuthFail');
    accept(null, false);
}


exports.initSock = initSock;
exports.sendMsg = sendMsg;