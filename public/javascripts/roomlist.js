$(function (){
    var sock = io();

    // 처음 실행하면 방에 들어감
    var pktJoin = {
        user_id: data.user_info['user_id']
    };

    sock.on('reconnect', function(){
        console.log('reconnect');

        // 다시 방 들어가기 처리 수행
        sock.emit('join_roomlist', pktJoin);
    });

    sock.on('error', function(msg){
        console.log('error: ' + msg);

        window.location.href = "/login";
    });

    sock.on('req_del_room', function(msg) {
        console.log('deleted ' + msg['room_num']);

        var userItemId = '#roomItem-' + msg['room_num'];

        // 사용자 제거
        $(userItemId).remove();
    });

    sock.emit('join_roomlist', pktJoin);

    $('.del-room').click(function() {
        console.log('clicked ' + $(this).val());

        var msg = {
            room_num: $(this).val()
        }

        sock.emit('req_del_room', msg);
    });
});


