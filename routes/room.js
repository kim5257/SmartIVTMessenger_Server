var express = require('express');
var router = express.Router();
var dbctrl = require('../system/dbctrl');
var formidable = require('formidable');
var readChunk = require('read-chunk');
var fileType = require('file-type');
var path = require('path');
var fs = require('fs');

router.get('/:room_id', function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function(req, res, next) {

    // 방 정보 가져오기
    dbctrl.getRoomInfo(req.params['room_id'], function (result) {
        if (result.result === 'success') {
            req['data'] = {};
            req['data']['room_info'] = result.roomInfo;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res, next) {
    // 방의 회원 리스트 가져오기
    dbctrl.getRoomUserList(req.params['room_id'], function (result) {
        if (result.result === 'success') {
            req['data']['user_list'] = result.userList;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res) {
    req['data']['user_info'] = req.user;

    res.render('room', { title: req.data['room_info']['room_name'], data: req.data });
});

router.get('/:room_num/invite', function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function(req, res, next) {
    // 초대 가능한 회원 리스트 가져오기
    dbctrl.getInviteUserList(req.params['room_num'], req.user['user_id'],
    function (result) {
        if (result.result === 'success') {
            req['data'] = {};
            req['data']['user_list'] = result.userList;
            next ();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res) {
    req['data']['room_num'] = req.params['room_num'];
    req['data']['user_info'] = req.user;
    res.render('inviteroom', { title: '회원 추가', data: req.data });
});

router.post('/:room_num/invite', function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function(req, res, next) {
    console.log('user_list: ' + JSON.stringify(req.body['user_list']));

    if (req.body['user_list'] == null) {
        next ();
    }
    else{
        if ( !Array.isArray(req.body['user_list']) ) {
            req.body['user_list'] = [req.body['user_list']];
        }

        dbctrl.addRoomUser(req.params['room_num'], req.body['user_list'], function(result) {
            if (result.result === 'success') {
                next();
            }
            else {
                // TODO: 에러 처리 필요
            }
        });
    }
}, function(req, res) {
    res.redirect('/room/' + req.params['room_num']);
});

router.post('/:room_num/upload', function(req, res, next) {
    //TODO: 인증된 상태에서 업로드 하는지 확인

    console.log('POST upload');

    next();
}, function(req, res) {
    var photos = [];
    var form = new formidable.IncomingForm();

    console.log('TEST1');

    console.log('dir: ' + JSON.stringify(__dirname));

    form.multiples = true;
    form.uploadDir = path.join(__dirname, '..', 'tmp_uploads');

    console.log('dir: ' + JSON.stringify(form.uploadDir));

    form.on('file', function(name, file) {

        console.log('length: ' + photos.length);

        // 파일 1개로 제한
        if ( photos.length === 2 ) {
            fs.unlink(file.path);
            return true;
        }

        var buffer = null;
        var type = null;
        var fileName = '';

        buffer = readChunk.sync(file.path, 0, 262);
        type = fileType(buffer);

        if ( type != null &&
            (type.ext === 'png' || type.ext === 'jpg' || type.ext === 'jpeg' ) ) {
            fileName = Date.now() + '_' + file.name;


            console.log('file: ' + file.path + ', new: ' + path.join(__dirname, '..', 'uploads', fileName));
            fs.rename(file.path, path.join(__dirname, '..', 'uploads', fileName), function(err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
            });

            photos.push({
                status: true,
                fileName: fileName,
                type: type.ext,
                publicPath: 'uploads/' + fileName
            });
        }
        else {
            photos.push({
                status: false,
                fileName: file.name,
                message: 'Invalid file type'
            });

            fs.unlink(file.path);
        }
    });

    form.on('error', function(err) {
        console.log('Error occurred during processing: ' + err);
    });

    form.on('end', function() {
        console.log('All the request fields have been processed.');
    });

    console.log('TEST2');

    form.parse(req, function(err, fields, files) {
        res.status(200).json(photos);
    });
});

module.exports = router;
