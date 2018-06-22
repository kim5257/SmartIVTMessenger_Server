var express = require('express');
var router = express.Router();
var dbctrl = require('../system/dbctrl');

router.get('/', function(req, res, next) {
    // 인증된 사용자인지 확인
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
}, function (req, res, next) {
    // 등록된 사용자인지 확인
    if ( req.user['role'] != null ) {
        res.redirect('/roomlist');
    }
    else {
        next ();
    }
}, function(req, res) {
    res.render('register', { title: '사용자 등록', data: req.user });
});

router.post('/', function(req, res) {
    console.log('register: ' + JSON.stringify(req.body));

    // DB에 내용 등록
    dbctrl.registerUser (
        req.user.user_id,
        req.body['user_name'],
        req.user.email,
        req.body['role'],
    function(result) {
        if (result.result === 'success') {
            // 등록 성공하면 roomlist 페이지로 이동
            res.redirect('/roomlist');
        }
        else
        {
            // TODO: 실패하면 에러처리
        }
    });
});

module.exports = router;