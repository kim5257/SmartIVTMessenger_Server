var express = require('express');
var router = express.Router();
var dbctrl = require('../system/dbctrl');

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

module.exports = router;
