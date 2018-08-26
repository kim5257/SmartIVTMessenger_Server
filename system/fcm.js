var jsonfile = require('jsonfile');
var path = require('path');

var dbctrl = require('./dbctrl');

var fcmData = jsonfile.readFileSync(path.join(__dirname, '../data', 'fcm.json'));
var FCM = require('fcm-push');
var fcm = new FCM(fcmData['server_key']);

function sendMessage_ (tokens, roomName, name, msg) {
    var pack = {
        registration_ids: tokens,
        priority: 'high',
        notification: {
            title: roomName,
            body: name + ': ' + msg,
            icon: 'ic_stat_notification',
            sound: 'default',
            android_channel_id: 'DEFAULT_CHANNEL'
        }
    };

    console.log('sendMessage: ' + JSON.stringify(tokens));

    fcm.send(pack, function(err, response) {
        if (err) {
            console.log("Error: " + JSON.stringify(err));
        }
        else {
            console.log("Success: " + JSON.stringify(response));
            var resp = JSON.parse(response);

            var delIds = [];

            // 여기서 결과를 확인하여 "NotRegistered" 에러인 메시지 토큰은 DB에서 제거
            resp.results.forEach((item, idx) => {
                if ( item.error === 'NotRegistered' ) {
                    delIds.push(tokens[idx]);
                }
            });

            // 등록해제된 토큰이 있다면 제거 요청
            if ( 0 < delIds.length ) {
                dbctrl.unregisterToken(delIds, (result) => {
                    // 아무것도 하지 않음.
                });
            }
        }
    });
}

function sendMessage (msg) {

    console.log('sendMessage: ' + JSON.stringify(msg));

    // 대화방 이름 가져오기
    dbctrl.getRoomInfo(msg.room_num, (result) => {
        if (result.result === 'success') {

            // 토큰 가져오기
            if ( msg.pack.to === 'all' ) {
                // 방 전체 사용자의 토큰 가져오기 (본인 빼고)
                dbctrl.getTokenByRoomId(msg.room_num, msg.pack.from, (result2) => {
                    if (result2.result === 'success') {
                        sendMessage_(result2.tokenList, result.roomInfo['room_name'], msg.pack.from_name, msg.pack.val);
                    }
                });
            }
            else if ( msg.pack.to === 'mgr' ) {
                // 상담사 토큰 가져오기 (본인 빼고)
                dbctrl.getTokenByRoomIdOnlyMgr(msg.room_num, msg.pack.from, (result2) => {
                    if (result2.result === 'success') {
                        sendMessage_(result2.tokenList, result.roomInfo['room_name'], msg.pack.from_name, msg.pack.val);
                    }
                });
            }
            else {
                // 한 사용자의 토큰 가져오기
                dbctrl.getTokenByUserId(msg.pack.to, (result2) => {
                    if (result2.result === 'success') {
                        sendMessage_(result2.tokenList, result.roomInfo['room_name'], msg.pack.from_name, msg.pack.val);
                    }
                })
            }
        }
    });
}

exports.sendMessage = sendMessage;