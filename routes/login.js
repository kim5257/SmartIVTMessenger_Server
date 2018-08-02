var express = require('express');
var router = express.Router();
var passport = require('passport');
var dbctrl = require('../system/dbctrl');

/* GET home page. */
router.get('/', function(req, res, next) {
    if ( req.isAuthenticated() )
    {
        res.redirect('/');
    }
    else
    {
        next();
    }
}, function(req, res) {
    res.render('login', { title: 'Login' });
});

router.get('/auth/naver',
    passport.authenticate('naver', {
        failureRedirect: '/login',
        scope: ['name']
    })
);

router.get('/auth/naver/callback',
    passport.authenticate('naver', {
        failureRedirect: '/login',
        scope: ['name']
    }),
    function(req, res){

        req['data'] = {};
        req['data']['user_info'] = req.user;

        res.render('auth/navercallback', { data: req['data'] });

        //res.redirect('/');
    }
);

router.post('/auth/naver/callback', function(req, res, next) {
    console.log('naver callback: ' + req.body.fcm_token);

    dbctrl.registerToken(req.body.user_id, req.body.fcm_token, (result) => {
        if ( result.result === 'success' ) {
            next ();
        }
        else {
            res.json({result: 'failed'});
        }
    });
}, function(req, res) {
    res.json({result: 'success'});
});

router.get('/auth/google',
    passport.authenticate('google', {
        failureRedirect: '/login',
        scope: ['email']
    })
);

router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        scope: ['email']
    }),
    function(req, res){
        req['data'] = {};
        req['data']['user_info'] = req.user;

        res.render('auth/googlecallback', { data: req['data'] });
    }
);

router.post('/auth/google/callback', function(req, res, next) {
    console.log('google callback: ' + req.body.fcm_token);

    dbctrl.registerToken(req.body.user_id, req.body.fcm_token, (result) => {
        if ( result.result === 'success' ) {
            next ();
        }
        else {
            res.json({result: 'failed'});
        }
    });
}, function(req, res) {
    res.json({result: 'success'});
});


router.get('/auth/kakao',
    passport.authenticate('kakao', {
        failureRedirect: '/login',
        scope: ['profile', 'account_email']
    })
);

router.get('/auth/kakao/callback',
    passport.authenticate('kakao', {
        failureRedirect: '/login',
        scope: ['profile', 'account_email']
    }),
    function(req, res){

        req['data'] = {};
        req['data']['user_info'] = req.user;

        res.render('auth/kakaocallback', { data: req['data'] });

        //res.redirect('/');
    }
);

router.post('/auth/kakao/callback', function(req, res, next) {
    console.log('kakao callback: ' + req.body.fcm_token);

    dbctrl.registerToken(req.body.user_id, req.body.fcm_token, (result) => {
        if ( result.result === 'success' ) {
            next ();
        }
        else {
            res.json({result: 'failed'});
        }
    });
}, function(req, res) {
    res.json({result: 'success'});
});


module.exports = router;
