var express = require('express');
var router = express.Router();
var dbctrl = require('../system/dbctrl');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function(req, res, next) {

    req['data'] = {};

    // 대화방에 초대를 위해 사용자 목록 가져오기
    dbctrl.getUserList(req.user['user_id'], function (result) {
        if (result.result === 'success') {
            req['data']['user_list'] = result.userList;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function (req, res, next) {
    // 대화방에 초대를 위해 상담사 목록 가져오기
    dbctrl.getMgrList(req.user['user_id'], function (result) {
        if (result.result === 'success') {
            req['data']['mgr_list'] = result.mgrList;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res) {
    req['data']['user_info'] = req.user;

    console.log(JSON.stringify(req.data));

    res.render('addroom', { title: '대화방 생성', data: req.data });
});

router.post('/', function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function(req, res, next){
    console.log('submit: ' + JSON.stringify(req.body));

    // 방생성
    dbctrl.addRoom(req.user['user_id'], req.body['room_name'], function(result) {
        if (result.result === 'success') {
            req.data = {room_num: result.roomNum};
            next();
        }
        else {
            // TODO: 에러 처리 필요
        }
    });
}, function(req, res, next) {
    if (req.body['user_list'] == null) {
        req.body['user_list'] = [req.user['user_id']];
    }
    else if ( !Array.isArray(req.body['user_list']) ) {
        req.body['user_list'] = [req.body['user_list']];
        req.body['user_list'].push(req.user['user_id']);
    }
    else {
        req.body['user_list'].push(req.user['user_id']);
    }

    dbctrl.addRoomUser(req.data['room_num'], req.body['user_list'], function(result) {
        if (result.result === 'success') {
            next();
        }
        else {
            // TODO: 에러 처리 필요
        }
    });
}, function(req, res) {
    res.redirect('/room/' + req.data['room_num']);
});

module.exports = router;