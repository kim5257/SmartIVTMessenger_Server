var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// 추가 모듈
var favicon = require('serve-favicon');
var session = require('express-session');
var passport = require('passport');
var redis = require('redis');
var redisStore = require('connect-redis')(session);
var flash = require('express-flash');
var auth = require('./system/auth');
var sock = require('./system/comm');

// URL 라우터
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var registerRouter = require('./routes/register');
var userlistRouter = require('./routes/userlist');
var roomlistRouter = require('./routes/roomlist');
var adduserRouter = require('./routes/adduser');
var addroomRouter = require('./routes/addroom');
var roomRouter = require('./routes/room');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// passport 설정
var redisClient = redis.createClient();
var sessionStore = new redisStore({host:'localhost', port: 6379, client: redisClient});

app.use(session({   secret: 'secret',
                    store: sessionStore,
                    saveUninitialized: false,
                    resave: false,
                    unset: 'destroy'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

auth.initAuth();


// Route 설정
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/register', registerRouter);
app.use('/userlist', userlistRouter);
app.use('/roomlist', roomlistRouter);
app.use('/adduser', adduserRouter);
app.use('/addroom', addroomRouter);
app.use('/room', roomRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app['initSock'] = function (server)
{
    sock.initSock(server, cookieParser, sessionStore);
}

module.exports = app;
