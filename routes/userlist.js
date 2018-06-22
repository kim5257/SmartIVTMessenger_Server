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

    dbctrl.getUserList(req.user['user_id'], function (result) {
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

    res.render('userlist', { title: '회원 목록', data: req.data });
});

module.exports = router;
