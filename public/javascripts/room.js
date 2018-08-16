$(function (){

    function adjustLastMsgNo (messages, lastMsgNo) {

        let adjustedLastMsgNo = lastMsgNo;

        for (let idx=messages.length-1;0<=idx;--idx) {
            if ( messages[idx].msg_no <= lastMsgNo ) {
                adjustedLastMsgNo = messages[idx].msg_no;
            }
        }

        return adjustedLastMsgNo;
    }

    function cvtUTC2Local (date) {
        var now = new Date();
        date.setUTCMinutes(-now.getTimezoneOffset() + date.getMinutes());
        return date;
    }

    function makeLocalTime (timestamp) {
        // 시간대 변환
        var utcDate = new Date(timestamp);
        var localDate = cvtUTC2Local(utcDate);
        var dateString = moment(localDate).format('YYYY-MM-DD HH:mm');

        return dateString;
    }

    function makeSepForm (date) {
        return "<li id=\"read-msg-tag\" class=\"media chat-msg-item\">" +
            "<div class=\"media-body\">" +
            "<div class=\"text-center\"><b>" +
            date +
            "</b></div>" +
            "</div>" +
            "</li>";
    }

    function makeReadTagForm () {
        return "<li class=\"media room-read-msg-tag\">" +
            "<div class=\"media-body\">" +
            "<div class=\"text-center\"><b>" +
            "여기까지 읽었습니다." +
            "<hr></gr></b></div>" +
            "</div>" +
            "</li>";
    }

    function makeMsgForm (owner, role, fromId, fromEmail, fromName, to, toName, val, msgNo, timestamp) {
        var id = (msgNo==null)?(''):(' id="msgno_' + msgNo + '"');

        var time = timestamp.slice(11,16);

        if ( owner == false ) {
            var whisperTag = '';
            if ( toName != null || to == 'wmgr' ) {
                whisperTag =
                    '<small class="chat-msg-box-time-self">' + fromName + '로부터:' + '</small>'
            }

            return "<li class=\"media chat-msg-item\"" + id + ">" +
                ((role==='mgr')?('<div class="whisper-select" value="' + fromId + '" name="' + fromName + '" style="width: 44px !important;">'):('')) +
                "<i class=\"align-self-start mr-3 fa fa-user fa-2x\" data-fa-transform=\"flip-h\" style=\"width: 44px !important;\"></i>" +
                ((role==='mgr')?('</div>'):('')) +
                "<div class=\"media-body\">" +
                "<div class=\"d-flex justify-content-between\">" +
                "<h8 class=\"mt-0\"><strong>" + fromName + "  <small>(" + fromEmail + ")</small></strong></h8>" +
                "</div>" +
                "<div class=\"chat-msg-box\">" +
                whisperTag +
                "<p class=\"chat-msg-body\">" + val + "</p>" +
                "<small class=\"chat-msg-box-time\">" + time + "</small>" +
                "</div>" +
                "</div>" +
                "</li>";
        }
        else {
            var whisperTag = '';
            if ( toName != null || to == 'wmgr' ) {
                whisperTag =
                    '<small class="chat-msg-box-time-self">' + toName + '에게:' + '</small>'
            }

            return "<li class=\"media chat-msg-item-owner align-bottom\"" + id + ">" +
                "<div class=\"media-body align-bottom\">" +
                "<div class=\"m-1\" style=\"float: right;\">" +
                "<div class=\"chat-msg-box-myself align-bottom\">" +
                whisperTag +
                "<p class=\"chat-msg-body\">" + val + "</p>" +
                "<small class=\"chat-msg-box-time-self\">" + time + "</small>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</li>";
        }
    }

    function makeImgMsgFormProto (time, file, to, toName) {
        var msgBody = 'msg-body-' + time;
        var imgId = 'img-body-' + time;
        var timeId = 'img-time-' + time;
        var progressId = 'img-progress-' + time;
        var fileUrl = URL.createObjectURL(file);

        var whisperTag = '';
        if ( toName != null || to == 'wmgr' ) {
            whisperTag =
                '<small class="chat-msg-box-time-self">' + toName + '에게:' + '</small><br>'
        }

        return "<li class=\"media chat-msg-item-owner align-bottom\" id=\"" + msgBody + "\">" +
            "<div class=\"media-body align-bottom\">" +
            "<div class=\"m-1\" style=\"float: right;\">" +
            "<div class=\"chat-msg-box-myself align-bottom\">" +
            whisperTag +
            "<img class=\"chat-msg-img img-modal-btn\" src=\"" + fileUrl + "\" alt=\"Image\" id=\"" + imgId + "\">" +
            "<div class=\"progress\" id=\"" + progressId + "\">" +
            "<div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"0\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 0%;\">" +
            "<span class=\"sr-only\"></span>" +
            "</div>" +
            "</div>" +
            "<br><small class=\"chat-msg-box-time-self\" id=\"" + timeId + "\"></small>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</li>";
    }

    function makeImgMsgForm (owner, role, fromId, fromEmail, fromName, to, toName, val, msgNo, timestamp) {
        var id = (msgNo==null)?(''):(' id="msgno_' + msgNo + '"');

        var time = timestamp.slice(11,16);

        if ( owner == false ) {
            var whisperTag = '';
            if ( toName != null || to == 'wmgr' ) {
                whisperTag =
                    '<small class="chat-msg-box-time-self">' + fromName + '로부터:' + '</small><br>'
            }

            return "<li class=\"media chat-msg-item\"" + id + ">" +
                ((role==='mgr')?('<div class="whisper-select" value="' + fromId + '" name="' + fromName + '">'):('')) +
                "<i class=\"align-self-start mr-3 fa fa-user fa-2x\" data-fa-transform=\"flip-h\"></i>" +
                ((role==='mgr')?('</div>'):('')) +
                "<div class=\"media-body\">" +
                "<div class=\"d-flex justify-content-between\">" +
                "<h8 class=\"mt-0\"><strong>" + fromName + "  <small>(" + fromEmail + ")</small></strong></h8>" +
                "</div>" +
                "<div class=\"chat-msg-box\">" +
                whisperTag +
                "<img class=\"chat-msg-img img-modal-btn\" src=\"" + val + "\" alt=\"Image\">" +
                "<br><small class=\"chat-msg-box-time\">" + time + "</small>" +
                "</div>" +
                "</div>" +
                "</li>";
        }
        else {
            var whisperTag = '';
            if ( toName != null || to == 'wmgr' ) {
                whisperTag =
                    '<small class="chat-msg-box-time-self">' + toName + '에게:' + '</small><br>'
            }

            return "<li class=\"media chat-msg-item-owner align-bottom\"" + id + ">" +
                "<div class=\"media-body align-bottom\">" +
                "<div class=\"m-1\" style=\"float: right;\">" +
                "<div class=\"chat-msg-box-myself align-bottom\">" +
                whisperTag +
                "<img class=\"chat-msg-img img-modal-btn\" src=\"" + val + "\" alt=\"Image\">" +
                "<br><small class=\"chat-msg-box-time-self\">" + time + "</small>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</li>";
        }
    }

    function makeWhisperForm () {
        $(".whisper-select").click(function() {
            console.log('click: ' + $(this).attr('value'));

            if ( $('.whisper-target-block').length ) {
                $('.whisper-target').attr('value', $(this).attr('value'));
                $('.whisper-target').attr('name', $(this).attr('name'));
                $('.whisper-target').text($(this).attr('name') + ': ');
            }
            else {
                // value로 하단에 대상 표시
                var tags =
                    '<div class="ml-1 mr-2 align-self-center whisper-target-block">' +
                    '<button class="btn btn-secondary btn-sm whisper-target" value="' + $(this).attr('value') + '" name="' + $(this).attr('name') + '">' +
                    $(this).attr('name') + ': ' +
                    '</button>' +
                    '</div>';

                $('#input-form').prepend(tags);
                $('#input-img-form').prepend(tags);

                $('.whisper-target').click(function() {
                    $('.whisper-target-block').remove();
                    console.log('click: ' + $('.whisper-target').val());
                });
            }
        });
    }

    function makeImgModalForm () {
        $('.img-modal-btn').click(function() {
            console.log('click image');

            $('#img-modal').css('display', 'block');
            $('#img-modal-content').attr('src', this.src);
            $('#img-modal-down-link').attr('href', this.src);
        });

        $('.img-modal-close').click(function() {
            $('#img-modal').css('display', 'none');
        });
    }

    var sock = io();

    // 처음 실행하면 방에 들어감
    var pktJoin = {
        room_num: data.room_info['room_num']
    };

    var pktReqLog = {
        room_num: data.room_info['room_num'],
        from: data.user_info['user_id'],
        to: ['all', data.user_info['user_id']],
        limit: 20,
        offset: 0,
    };

    if ( data.user_info['role'] === 'mgr' ) {
        pktReqLog.to.push('mgr');
    }

    sock.on('reconnect', function(){
        console.log('reconnect');

        // 다시 방 들어가기 처리 수행
        sock.emit('join_room', pktJoin);
    });

    sock.on('error', function(msg){
        console.log('error: ' + msg);

        window.location.href = "/login";
    });

    var firstDate = null;
    var lastestDate = null;

    sock.on('chat_msg', function(msg){
        console.log(JSON.stringify(msg));
        msg.val = msg.val.replace(/\n/g, '<br>');

        //var timeString = msg.timestamp.substring(0, msg.timestamp.length-3);

        // 자신이 보낸 귓말이면 건너뜀
        console.log('from: ' + msg.from + ', to: ' + msg.to);
        if ( (msg.from === data.user_info['user_id']) &&
            (msg.to === 'wmgr') ) {
            return;
        }

        if ( msg['type'] === 'img' ) {
             // ID가 일치하는 폼이 이미 있으면 속성만 변경
            console.log('ID: ' + msg.obj_id);

            var msgId = '#msg-body-' + msg.obj_id;
            var imgId = '#img-body-' + msg.obj_id;
            var timeId = '#img-time-' + msg.obj_id;

            var localTime = makeLocalTime(msg.timestamp);
            var date = localTime.slice(0, 10);

            if ( lastestDate != null )
            {
                if ( lastestDate != date )
                {
                    // 날짜가 다르면 구분자 추가
                    $(msgId).before(makeSepForm(date));
                }
            }
            lastestDate = date;

            console.log('length: ' + $(imgId).length);

            if ( $(imgId).length === 0 ) {
                if (data.user_info['user_id'] != msg.from) {

                    var isBottom = false;

                    // 스크롤이 맨 아래였는지 확인
                    if ( (window.pageYOffset + window.innerHeight) >= document.documentElement.scrollHeight ) {
                        isBottom = true;
                    }

                    var appenedElement = $('#msg_list').append(makeImgMsgForm(false, data.user_info['role'], msg.from, msg.from_email, msg.from_name, msg.to, msg.to_name, msg.val, msg.msg_no, localTime));

                    // 스크롤이 맨 아래에 있었을 때만 적용
                    if ( isBottom == true ) {
                        appenedElement.find('img').on('load', function () {
                            window.scrollTo(0, document.body.scrollHeight);
                        });
                    }
                    else {
                        //TODO: 추가된 메시지 내용을 보여줘보자
                    }

                    makeWhisperForm();
                }
                else {
                    var appenedElement = $('#msg_list').append(makeImgMsgForm(true, data.user_info['role'], msg.from, msg.from_email, msg.from_name, msg.to, msg.to_name, msg.val, msg.msg_no, localTime));

                    appenedElement.find('img').on('load', function() {
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                }

                makeImgModalForm();
            }
            else {
                var time = localTime.slice(11,16);

                console.log('img appended2');

                // 기존에 추가했던 폼을 수정
                $(imgId).attr('src', msg.val);
                $(timeId).text(time);
            }
        }
        else {
            var localTime = makeLocalTime(msg.timestamp);
            var date = localTime.slice(0, 10);

            if ( lastestDate != null )
            {
                if ( lastestDate != date )
                {
                    // 날짜가 다르면 구분자 추가
                    $('#msg_list').append(makeSepForm(date));
                }
            }
            lastestDate = date;


            console.log('text appended');
            if (data.user_info['user_id'] != msg.from) {

                var isBottom = false;

                // 스크롤이 맨 아래였는지 확인
                console.log('pageYOffset: ' + window.pageYOffset + ', ' + document.body.scrollHeight);
                console.log('innerHeight: ' + window.innerHeight + ', ' + window.outerHeight);
                console.log('clientHeight: ' + document.documentElement.scrollHeight);
                if ( (window.pageYOffset + window.innerHeight) >= document.documentElement.scrollHeight ) {
                    isBottom = true;
                }

                $('#msg_list').append(makeMsgForm(false, data.user_info['role'], msg.from, msg.from_email, msg.from_name, msg.to, msg.to_name, msg.val, msg.msg_no, localTime));

                // 스크롤이 맨 아래에 있었을 때만 적용
                if ( isBottom == true ) {
                    window.scrollTo(0, document.body.scrollHeight);
                }
                else {
                    //TODO: 추가된 메시지 내용을 보여줘보자
                }

                makeWhisperForm();
            }
            else {
                $('#msg_list').append(makeMsgForm(true, data.user_info['role'], msg.from, msg.from_email, msg.from_name, msg.to, msg.to_name, msg.val, msg.msg_no, localTime));
                window.scrollTo(0, document.body.scrollHeight);
            }
        }
    });

    sock.on('res_msg_log', function(res){
        console.log('res_msg_log: ' + JSON.stringify(res));

        if ( res.result==='success' && res.messages.length != 0 )
        {
            var extraMsgForm = '';

            res.messages.forEach((item) => {
                //var timeString = item.timestamp.substring(0, item.timestamp.length-3);
                item.message = item.message.replace(/\n/g, '<br>');

                var localTime = makeLocalTime(item.timestamp);
                var date = localTime.slice(0, 10);

                // 최초 불러오는거면 최근 날짜 저장
                if ( lastestDate == null )
                {
                    lastestDate = date;
                }

                if ( firstDate != null )
                {
                    if ( firstDate != date )
                    {
                        // 날짜가 다르면 구분자 추가
                        extraMsgForm = makeSepForm(firstDate) + extraMsgForm;
                    }
                }
                firstDate = date;

                // last_msg_no랑 같으면 여기까지 읽었음 메시지 추가
                let adjustedLastMsgNo = adjustLastMsgNo(res.messages, res['last_msg_no']);

                console.log('adjustLastMsgNo: ' + adjustedLastMsgNo);
                if ( (adjustedLastMsgNo == item.msg_no) &&
                    (res.messages[0].msg_no != adjustedLastMsgNo) ) {
                    extraMsgForm = makeReadTagForm() + extraMsgForm;
                }


                if ( item['type'] === 'img' ) {
                    if (data.user_info['user_id'] != item['from']) {
                        extraMsgForm = makeImgMsgForm(false, data.user_info['role'], item.from, item.email, item.from_name, item.to, item.to_name, item.message, item['msg_no'], localTime) + extraMsgForm;
                    }
                    else {
                        extraMsgForm = makeImgMsgForm(true, data.user_info['role'], item.from, item.email, item.from_name, item.to, item.to_name, item.message, item['msg_no'], localTime) + extraMsgForm;
                    }
                }
                else {
                    if (data.user_info['user_id'] != item['from']) {
                        extraMsgForm = makeMsgForm(false, data.user_info['role'], item.from, item.email, item.from_name, item.to, item.to_name, item.message, item['msg_no'], localTime) + extraMsgForm;
                    }
                    else {
                        extraMsgForm = makeMsgForm(true, data.user_info['role'], item.from, item.email, item.from_name, item.to, item.to_name, item.message, item['msg_no'], localTime) + extraMsgForm;
                    }
                }
            });

            var preImgCnt = $('#msg_list').find('img').length;
            var imgCnt = preImgCnt;
            var imgs = $('#msg_list').prepend(extraMsgForm).find('img');

            console.log('imgs: ' + imgs.length);
            imgs.on('load', function() {
                ++imgCnt;

                if ( imgs.length === imgCnt ) {
                    if ( pktReqLog.offset == 0 ) {

                        // 못 읽은 메시지가 있으면 마지막이 아닌 그 메시지 위치로 스크롤
                        if (res.messages[0].msg_no > res['last_msg_no']) {
                            //let adjustedLastMsgNo = adjustLastMsgNo(res.messages, res['last_msg_no']);

                            //let offset = $('#msgno_' + adjustedLastMsgNo).offset();
                            let offset = $('#read-msg-tag').offset();
                            window.scrollTo(0, offset.top - 50);
                        }
                        else {
                            window.scrollTo(0, document.body.scrollHeight);
                        }
                    }
                    else
                    {
                        let offset = $('#msgno_' + pktReqLog.offset).offset();
                        console.log(offset.top - 50);
                        window.scrollTo(0, offset.top - 50);
                    }

                    // 마지막 읽은 위치 갱신
                    pktReqLog.offset = res.messages[res.messages.length-1]['msg_no'];
                    console.log('Height: ' + document.body.scrollHeight);
                }
            });

            console.log('imgs: ' + imgs.length + ', ' + preImgCnt);
            if (imgs.length === preImgCnt) {
                if (pktReqLog.offset == 0) {

                    console.log('Height: ' + document.body.scrollHeight);
                    // 못 읽은 메시지가 있으면 마지막이 아닌 그 메시지 위치로 스크롤
                    if (res.messages[0].msg_no > res['last_msg_no']) {
                        //let adjustedLastMsgNo = adjustLastMsgNo(res.messages, res['last_msg_no']);

                        //let offset = $('#msgno_' + adjustedLastMsgNo).offset();
                        let offset = $('#read-msg-tag').offset();
                        window.scrollTo(0, offset.top - 50);
                    }
                    else {
                        window.scrollTo(0, document.body.scrollHeight);
                    }
                }
                else {
                    var offset = $('#msgno_' + pktReqLog.offset).offset();
                    console.log(offset.top - 50);
                    window.scrollTo(0, offset.top - 50);
                }

                // 마지막 읽은 위치 갱신
                pktReqLog.offset = res.messages[res.messages.length - 1]['msg_no'];
            }

            makeWhisperForm();
            makeImgModalForm();
        }
    });

    sock.on('req_except_user', function(msg) {
        console.log('excepted ' + msg['user_id']);

        var userItemId = '#userItem-' + msg['user_id'];

        // 사용자 제거
        $(userItemId).remove();
    });

    sock.emit('join_room', pktJoin);
    sock.emit('req_msg_log', pktReqLog);

    $('#send-msg').keydown(function(event) {
        if ( (event.ctrlKey === true) &&
            (event.keyCode === 13) ) {
            // Ctrl+Enter
            $(this).trigger('submit');
        }
    });

    $('#send-msg').submit(function(){
        console.log(data.user_info.role);

        console.log($('#msg').val());

        var msg = filterXSS($('#msg').val(), {
            whiteList: [],
            stripIgnoreTag: false
        });
        var trimedMsg = msg.trim();

        if ( trimedMsg != '' ) {
            var msg = {
                room_num: data.room_info['room_num'],
                pack: {
                    from: data.user_info['user_id'],
                    from_name: data.user_info['user_name'],
                    from_email: data.user_info['email'],
                    to: (data.user_info['role'] === 'mgr') ? ('all') : ('mgr'),
                    type: 'text',
                    val: msg
                }
            };

            console.log('msg!: ' + JSON.stringify(msg));

            if ( $('.whisper-target').length ) {
                msg.pack.to = [$('.whisper-target').attr('value'), 'wmgr'];
                msg.pack.to_name = $('.whisper-target').attr('name');

                $('.whisper-target-block').remove();
            }

            sock.emit('chat_msg', msg);
            $('#msg').val('');
        }

        return false;
    });

    $('#sel-img').click(function() {
        $('#input-file').click();
    });

    $('#back-msg-form').click(function() {
        $('#input-file').val('');
        $('#send-img').hide();
        $('#send-msg').show();
    });

    function uploadFile(formData) {

        var url = '/room/' + data.room_info['room_num'] + '/upload';

        console.log(url);
        console.log('formData: ' + JSON.stringify(formData));

        $.ajax({
            url: url,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                var xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', function(event) {
                    var progress = $('.progress');
                    var progressBar = $('.progress-bar');

                    if ( event.lengthComputable ) {

                        console.log('event: ' + JSON.stringify(event));

                        var percent = (event.loaded / event.total) * 100;
                        progressBar.width(percent + '%');

                        if ( percent === 100 )
                        {
                            //progressBar.removeClass('active');
                            progress.remove();
                        }
                    }
                });

                return xhr;
            }
        }).done(handleSuccess).fail(function(xhr, status) {
            alert(status);
        });
    }

    function handleSuccess(data) {
        // Do nothing at now
        if ( data.length === 0 ) {
            alert('No uploaded');
        }
    }

    $('#send-img').submit(function(event){

        event.preventDefault();

        var time = Date.now();
        var file = $('#input-file').get(0).files[0];
        var formData = new FormData();

        var msg = {
            room_num: data.room_info['room_num'],
            pack: {
                from: data.user_info['user_id'],
                from_name: data.user_info['user_name'],
                from_email: data.user_info['email'],
                to: (data.user_info['role'] === 'mgr') ? ('all') : ('mgr'),
                type: 'img',
                val: '',
                obj_id: time
            }
        };

        console.log('user_info: ' + JSON.stringify(data.user_info));
        console.log('msg!: ' + JSON.stringify(msg));

        if ( $('.whisper-target').length ) {
            msg.pack.to = $('.whisper-target').attr('value');
            msg.pack.to_name = $('.whisper-target').attr('name');

            $('.whisper-target-block').remove();
        }

        formData.append('time', time);
        formData.append('msg', JSON.stringify(msg));

        $('#msg_list').append(makeImgMsgFormProto(time, file, msg.pack.to, msg.pack.to_name)).find('img').on('load', function() {
            window.scrollTo(0, document.body.scrollHeight);
        });

        formData.append('photos[]', file, file.name);

        uploadFile(formData);

        $('#input-file').val('');
        $('#send-img').hide();
        $('#send-msg').show();

        makeImgModalForm();
    });

    $(window).scroll(function() {
        if ( (document.documentElement.scrollTop == 0) &&
            (document.body.scrollTop == 0) ) {
            console.log('Request Message Log');
            // 추가 기록 요청
            sock.emit('req_msg_log', pktReqLog);
        }
    });

    $(window).resize(function() {
        console.log('resize: ' + window.outerHeight);
        window.scrollTo(0, document.body.scrollHeight);
    });

    $('.del-user').click(function() {
        console.log('clicked ' + $(this).val());

        var msg = {
            room_num: data.room_info['room_num'],
            user_id: $(this).val()
        }

        sock.emit('req_except_user', msg);
    });

    $('#input-file').change(function(event) {

        var filePath = URL.createObjectURL(event.target.files[0]);

        $('#img').attr('src', filePath);

        $('#send-img').show();
        $('#send-msg').hide();
    });
});


