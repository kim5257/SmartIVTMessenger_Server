var express = require('express');
var router = express.Router();
var dbctrl = require('../system/dbctrl');
var auth = require('../system/auth');

/* GET home page. */
router.get('/', auth.isAuthed, auth.isRegisted,
function(req, res, next) {
    dbctrl.getRoomList(req.user.user_id, function (result) {
        if (result.result === 'success') {
            req['data'] = {};
            req['data']['room_list'] = result.roomList;
            next();
        }
        else {
            res.status(500).send(JSON.stringify({result: 'error', msg: result.msg}));
        }
    });
}, function(req, res){
    req['data']['user_info'] = req.user;

    console.log(JSON.stringify(req.data));

    res.render('roomlist', { title: '대화방 목록', data: req.data });
});

module.exports = router;
