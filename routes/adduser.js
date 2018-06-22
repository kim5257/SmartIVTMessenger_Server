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

    // 대화방에 초대를 위해 사용자 목록 가져오기
    dbctrl.getFreeUserList(req.user['user_id'], function (result) {
        if (result.result === 'success') {
            req['data'] = {};
            req['data']['user_list'] = result.userList;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res) {
    req['data']['user_info'] = req.user;

    console.log(JSON.stringify(req.data));

    res.render('adduser', { title: '회원 추가', data: req.data });
});

router.post('/', function(req, res, next){
    console.log('submit: ' + JSON.stringify(req.body));

    // 사용자 목록이 비었으면 처리하지 않음
    if (req.body['user_list'] == null ) {
        next ();
    }
    else {
        dbctrl.addUser(req.user['user_id'], req.body['user_list'], function (result) {
            if (result.result === 'success') {
                next();
            }
            else {
                // TODO: 에러 처리 필요
            }
        });
    }
}, function(req, res) {
    res.redirect('/userlist');
});

module.exports = router;