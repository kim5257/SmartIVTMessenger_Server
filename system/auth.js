var passport = require('passport');
var NaverStrategy = require('passport-naver').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var jsonfile = require('jsonfile');
var path = require('path');
var dbctrl = require('./dbctrl');

exports.initAuth = function initAuth() {
    console.log('Auth init');

    passport.serializeUser((user, done) => {
        console.log('serializeUser: ' + JSON.stringify(user));

        // DB에서 사용자 데이터 가져오기
        dbctrl.getUserInfo(user.user_id, (result) => {
            console.log(JSON.stringify(result));

            if ( result.result === 'success' )
            {
                user['user_name'] = result.info['user_name'];
                user['role'] = result.info['role'];
            }

            done(null, user);
        });
    });

    passport.deserializeUser((user, done) => {
        console.log('deserializeUser: ' + JSON.stringify(user));

        // DB에서 사용자 데이터 가져오기
        dbctrl.getUserInfo(user.user_id, (result) => {
            console.log(JSON.stringify(result));

            if ( result.result === 'success' )
            {
                user['user_name'] = result.info['user_name'];
                user['role'] = result.info['role'];
            }

            done(null, user);
        });
    });

    var naverAuthSetting = jsonfile.readFileSync(path.join(__dirname, '../data', 'naver_oauth_data.json'));
    passport.use ( new NaverStrategy(naverAuthSetting,
        function(accessToken, refreshToken, profile, done) {
            console.log('passReq on naver: ' + JSON.stringify(profile));
            var user_id = profile.provider + '-' + profile.id;

            dbctrl.getUserInfo(user_id, (result) => {

                var user = {
                    user_id: user_id,
                    email: profile._json.email
                };

                console.log(JSON.stringify(result));

                if ( result.result === 'success' )
                {
                    user['user_name'] = result.info['user_name'];
                    user['role'] = result.info['role'];
                }

                done(null, user);
            });
        }
    ));

    var googleAuthSetting = jsonfile.readFileSync(path.join(__dirname, '../data', 'google_oauth_data.json'));

    console.log(JSON.stringify(googleAuthSetting.web));

    passport.use ( new GoogleStrategy({
            clientID: googleAuthSetting.web.client_id,
            clientSecret: googleAuthSetting.web.client_secret,
            callbackURL: googleAuthSetting.web.redirect_uris[0]
        },
        function(accessToken, refreshToken, profile, done) {
            console.log('passReq on google: ' + JSON.stringify(profile));
            var user_id = profile.provider + '-' + profile.id;

            dbctrl.getUserInfo(user_id, (result) => {

                var user = {
                    user_id: user_id,
                    email: profile.emails[0].value
                };

                console.log(JSON.stringify(result));

                if ( result.result === 'success' )
                {
                    user['user_name'] = result.info['user_name'];
                    user['role'] = result.info['role'];
                }

                done(null, user);
            });
        }
    ));
}

exports.isAuthed = function (req, res, next) {
    // 인증된 사용자인지 확인
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/login');
    }
};

exports.isRegisted = function (req, res, next)
{
    console.log('isRegisted: ' + JSON.stringify(req.user));
    if ( req.user['role'] == null ) {
        // 역할이 정해지지 않으면 등록 페이지로 이동
        res.redirect('/register');
    }
    else {
        next ();
    }
};