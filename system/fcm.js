var jsonfile = require('jsonfile');
var path = require('path');

var dbctrl = require('./dbctrl');

var fcmData = jsonfile.readFileSync(path.join(__dirname, '../data', 'fcm.json'));
var FCM = require('fcm-push');
var fcm = new FCM(fcmData['server_key']);

function sendMessage_ (tokens, roomName, msg) {
    var pack = {
        registration_ids: tokens,
        notification: {
            title: roomName,
            body: msg,
            icon: 'ic_stat_notification'
        }
    };

    console.log('sendMessage: ' + JSON.stringify(tokens));

    fcm.send(pack, function(err, response) {
        if (err) {
            console.log("Error: " + JSON.stringify(err));
        }
        else {
            console.log("Success: " + JSON.stringify(response));
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
                        sendMessage_(result2.tokenList, result.roomInfo['room_name'], msg.pack.val);
                    }
                });
            }
            else {
                // 한 사용자의 토큰 가져오기
                dbctrl.getTokenByUserId(msg.pack.to, (result2) => {
                    if (result2.result === 'success') {
                        sendMessage_(result2.tokenList, result.roomInfo['room_name'], msg.pack.val);
                    }
                })
            }
        }
    });
}

exports.sendMessage = sendMessage;