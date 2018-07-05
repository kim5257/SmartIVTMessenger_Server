var mariasql = require('mariasql');
var sha3_512 = require('js-sha3').sha3_512;
var jsonfile = require('jsonfile');
var path = require('path');

var dbClient = new mariasql();
var dbSetting = jsonfile.readFileSync(path.join(__dirname, '../data', 'db.json'));


dbClient.connect(dbSetting);

dbClient.on('ready', function (){
    console.log('connected DB');
}).on('error', function (err){
    console.log('DB error: ' + err);
}).on('close', function (){
    console.log('DB closed');
});

function toHash (pw) {
    return sha3_512(pw);
}

function chkValidUser (id, pw, callback) {
    var query = 'SELECT ' +
        '(SELECT count(*) FROM chat_server.users WHERE user_id=:id) as exist,' +
        '(SELECT count(*) FROM chat_server.users WHERE user_id=:id and user_pw=:pw) as valid';

    var queryFmt = dbClient.prepare(query);

    dbClient.query(queryFmt({id: id, pw: pw})).on('result', function (result){
        result.on('data', function (row){
            var exist = parseInt(row['exist'], 10);
            var valid = parseInt(row['valid'], 10);

            if ( 0 < valid )
            {
                callback({result: 'success', msg: null});
            }
            else if ( 0 < exist )
            {
                callback({result: 'error', msg: '올바르지 않은 비밀번호입니다.'});
            }
            else
            {
                callback({result: 'error', msg: '등록되지 않은 사용자입니다.'});
            }
        });
    });
}

function registerUser (id, name, email, role, callback) {
    /*
    INSERT INTO chat_server.users(user_id, user_name, role)
    VALUES('naver', '26042906', '김재구', 'mgr')
    ON DUPLICATE KEY UPDATE user_name='김재구', role='mgr';
    */

    var query = 'INSERT INTO chat_server.users(user_id, user_name, email, role)\n' +
        'VALUES(:id, :name, :email, :role)\n' +
        'ON DUPLICATE KEY UPDATE user_name=:name, role=:role;';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        id: id,
        name: name,
        email: email,
        role: role
    };

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function updateUser (userId, profileImg, callback) {
    var query = 'UPDATE chat_server.users\n' +
        'SET profile_img=:profileImg\n' +
        'WHERE user_id=:userId';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        userId: userId,
        profileImg: profileImg
    };

    console.log('query: ' + queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function getUserInfo (id, callback) {
    var query = 'SELECT user_id, user_name, role, profile_img FROM chat_server.users ' +
        'WHERE user_id=:id';

    var queryFmt = dbClient.prepare(query);
    var rowCnt = 0;

    console.log('query: ' + queryFmt({id: id}));

    dbClient.query(queryFmt({id: id})).on('result', function (result){
        result.on('data', function (row){
            ++rowCnt;
            callback({result: 'success', info: row});
        });
    }).on('end', function (){
        if ( rowCnt == 0 )
        {
            callback({result: 'error', msg: '등록되지 않은 사용자입니다.'});
        }
    });
}

function getUserList (id, callback)
{
    var query = 'SELECT users.user_id, users.user_name, users.email, users.profile_img FROM chat_server.user_map ' +
        'INNER JOIN chat_server.users ON users.user_id=user_map.user_id ' +
        'WHERE user_map.mgr_id=:id';

    var queryFmt = dbClient.prepare(query);
    var userList = [];

    dbClient.query(queryFmt({id: id})).on('result', function (result){
        result.on('data', function (row){
            userList.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', userList: userList});
    });
}

// 등록되지 않은 사용자 리스트 가져오기
function getFreeUserList (id, callback)
{
    /*
    SELECT users.user_id, users.user_name, users.email FROM chat_server.users
    LEFT JOIN
        (SELECT user_id from chat_server.user_map
         WHERE mgr_id='admin@naver.com') as user_map
    ON
        chat_server.users.user_id=user_map.user_id
    WHERE (user_map.user_id IS NULL) and (users.role='usr')
     */

    var query = 'SELECT users.user_id, users.user_name, users.email FROM chat_server.users\n' +
        'LEFT JOIN\n' +
        '    (SELECT user_id from chat_server.user_map\n' +
        '     WHERE mgr_id=:id) as user_map\n' +
        'ON\n' +
        '    chat_server.users.user_id=user_map.user_id\n' +
        'WHERE (user_map.user_id IS NULL) and (users.role=\'usr\')'

    var queryFmt = dbClient.prepare(query);
    var userList = [];

    dbClient.query(queryFmt({id: id})).on('result', function (result){
        result.on('data', function (row){
            userList.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', userList: userList});
    });
}

function getRoomList (id, callback)
{
    /*
    SELECT rooms.room_name FROM chat_server.room_user_map
    INNER JOIN chat_server.rooms ON room_user_map.room_num=rooms.room_num
    WHERE user_id='naver:000000';
    */

    var query = 'SELECT rooms.room_num, rooms.room_name FROM chat_server.room_user_map ' +
        'INNER JOIN chat_server.rooms ON room_user_map.room_num=rooms.room_num ' +
        'WHERE user_id=:id';

    var queryFmt = dbClient.prepare(query);
    var roomList = [];

    dbClient.query(queryFmt({id: id})).on('result', function (result){
        result.on('data', function (row){
            roomList.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', roomList: roomList});
    });
}

function getRoomInfo (roomNum, callback) {
    /*
    SELECT mgr_id, room_name FROM chat_server.rooms
    WHERE room_num=1;
    */

    var query = 'SELECT mgr_id, room_num, room_name FROM chat_server.rooms ' +
        'WHERE room_num=:roomNum';

    var queryFmt = dbClient.prepare(query);
    var roomInfo = {};

    console.log('getRoomInfo: ' + queryFmt({roomNum: roomNum}));

    dbClient.query(queryFmt({roomNum: roomNum})).on('result', function (result){
        result.on('data', function (row){
            roomInfo = row;
        });
    }).on('end', function (){
        callback({result: 'success', roomInfo: roomInfo});
    });
}

function getRoomUserList (roomNum, callback) {
    /*
    SELECT users.user_id, users.user_name, users.email FROM chat_server.users
    INNER JOIN chat_server.room_user_map ON users.user_id=room_user_map.user_id
    WHERE room_user_map.room_num=1528611997920;
    */

    var query =
        'SELECT users.user_id, users.user_name, users.email FROM chat_server.users\n' +
        'INNER JOIN chat_server.room_user_map ON users.user_id=room_user_map.user_id\n' +
        'WHERE room_user_map.room_num=:roomNum';
    var queryFmt = dbClient.prepare(query);
    var userList = [];

    dbClient.query(queryFmt({roomNum: roomNum})).on('result', function (result){
        result.on('data', function (row){
            userList.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', userList: userList});
    });
}

function getInviteUserList (roomNum, mgrId, callback) {
    /*
    SELECT users.user_id, users.user_name, users.email FROM chat_server.users
    LEFT JOIN
        chat_server.user_map
    ON
        users.user_id=user_map.user_id
    LEFT JOIN
        (SELECT user_id from chat_server.room_user_map
         WHERE room_num='1528733223156') as room_user_map
    ON
        chat_server.users.user_id=room_user_map.user_id
    WHERE (room_user_map.user_id IS NULL) and (users.role='usr') and user_map.mgr_id='naver:26042906';
     */

    var query =
        'SELECT users.user_id, users.user_name, users.email FROM chat_server.users\n' +
        'LEFT JOIN\n' +
        '\tchat_server.user_map\n' +
        'ON\n' +
        '\tusers.user_id=user_map.user_id\n' +
        'LEFT JOIN\n' +
        '\t(SELECT user_id from chat_server.room_user_map\n' +
        '\t WHERE room_num=:roomNum) as room_user_map\n' +
        'ON\n' +
        '\tchat_server.users.user_id=room_user_map.user_id\n' +
        'WHERE (room_user_map.user_id IS NULL) and (users.role=\'usr\') and user_map.mgr_id=:mgrId;';

    var queryFmt = dbClient.prepare(query);
    var userList = [];

    console.log('query: ' + queryFmt({roomNum: roomNum, mgrId: mgrId}));

    dbClient.query(queryFmt({roomNum: roomNum, mgrId: mgrId})).on('result', function (result){
        result.on('data', function (row){
            userList.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', userList: userList});
    });
}

function addUser (mgrId, users, callback)
{
    /*
    INSERT INTO chat_server.user_map(mgr_id, user_id)
    VALUES ('admin@naver.com', 'user11@mail.com');
    */

    var queryHdr = 'INSERT INTO chat_server.user_map(mgr_id, user_id)\n' +
        'VALUES ';

    var queryBody = '';

    if ( Array.isArray(users) ) {
        queryBody += '(\'' + mgrId + '\',\'' + users[0] + '\')';
        for (var idx = 1; idx < users.length; ++idx) {
            queryBody += ', (\'' + mgrId + '\',\'' + users[idx] + '\')';
        }
    }
    else {
        queryBody += '(\'' + mgrId + '\',\'' + users + '\')';
    }

    var query = queryHdr + queryBody;

    console.log(query);

    dbClient.query(query).on('end', function (){
        callback({result: 'success'});
    });
}

function delUser (mgrId, userId, callback)
{
    /*
    DELETE FROM chat_server.user_map
    WHERE (mgr_id='naver-26042906') and (user_id='local-1');
    */
    var query =
        'DELETE FROM chat_server.user_map\n' +
        'WHERE (mgr_id=:mgrId) and (user_id=:' +
        'userId);'

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        mgrId: mgrId,
        userId: userId
    };

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function addRoom (mgrId, roomName, callback) {
    /*
    INSERT INTO chat_server.rooms(mgr_id, room_num, room_name)
    VALUES ('admin@naver.com', 3, '테스트룸3');
    */

    var time = new Date().getTime();
    var query = 'INSERT INTO chat_server.rooms(mgr_id, room_num, room_name) ' +
        'VALUES (:mgrId, :roomNum, :roomName)';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        mgrId: mgrId,
        roomNum: time,
        roomName: roomName
    };

    console.log(queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success', roomNum: time});
    });
}

function delRoom (mgrId, roomNum, callback) {
    /*
    DELETE FROM chat_server.rooms
    WHERE mgr_id='naver-26042906' and room_num='1528733223156';
    */
    var query =
        'DELETE FROM chat_server.rooms\n' +
        'WHERE mgr_id=:mgrId and room_num=:roomNum;';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        mgrId: mgrId,
        roomNum: roomNum
    };

    console.log(queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });

}

function addRoomUser (roomNum, users, callback) {
    /*
    INSERT INTO chat_server.room_user_map(room_num, user_id, msg_offset)
    VALUES (1528611597595,'naver:000000', IFNULL((select MAX(msg_no) from chat_server.messages), 0));
    */

    console.log('users: ' + JSON.stringify(users));

    var queryHdr = 'INSERT INTO chat_server.room_user_map(room_num, user_id, msg_offset) ' +
        'VALUES ';

    var queryBody = '';

    queryBody += '(' + roomNum + ',\'' + users[0] + '\', IFNULL((select MAX(msg_no) from chat_server.messages), 0))';
    for(var idx=1;idx<users.length;++idx)
    {
        queryBody += ', (' + roomNum + ',\'' + users[idx] + '\', IFNULL((select MAX(msg_no) from chat_server.messages), 0))';
    }

    var query = queryHdr + queryBody;

    console.log(query);

    dbClient.query(query).on('end', function (){
        callback({result: 'success'});
    });
}

function delRoomUser (roomNum, userId, callback) {
    /*
    DELETE FROM chat_server.room_user_map
    WHERE (room_num='1528733223156') and (user_id='local-1');
    */

    var query =
        'DELETE FROM chat_server.room_user_map\n' +
        'WHERE (room_num=:roomNum) and (user_id=:userId);';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        roomNum: roomNum,
        userId: userId
    };

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function writeMsg (msg, callback)
{
    /*
    INSERT INTO chat_server.messages(`room_num`, `from`, `to`, `message`, `timestamp`)
    VALUES(1, 'admin@naver.com', 'all', 'Hello', '2018-06-03 15:00:00');
    */

    var query =
        'INSERT INTO chat_server.messages' +
        '(`room_num`, `from`, `to`, `message`, `timestamp`) ' +
        'VALUES(:roomNum, :from, :to, :val, :timestamp)';

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        roomNum: msg['room_num'],
        from: msg.pack['from'],
        to: msg.pack['to'],
        val: msg.pack['val'],
        timestamp: msg.pack['timestamp']
    };

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function readMsg (roomNum, from, to, limit, offset, callback) {

    /*
    SELECT `msg_no`, `from`, `user_name` as `from_name`, `to`, `message`, `timestamp` FROM
        (SELECT `msg_no`, `from`, `to`, `message`, `timestamp`
        FROM chat_server.messages
        WHERE room_num='1529241814317' and (`from`='naver-26042906'  or `to`='all' or `to`='naver-26042906')) as msg_list
    LEFT JOIN chat_server.users ON msg_list.from=users.user_id
    ORDER BY msg_no desc limit 20;
    */
    var startOffset = ' and ((SELECT msg_offset FROM chat_server.room_user_map where user_id=\'' + from + '\' and room_num=\'' + roomNum + '\') < msg_no)';

    var notFirstTry = (offset==0)?(''):(' and (msg_no < ' + offset + ' )');

    var toCondition = ' and (`from`=\'' + from + '\' ';

    to.forEach((item) => {
        toCondition += ' or `to`=\'' + item + '\'';
    });

    toCondition += ')';

    var query =
        'SELECT `msg_no`, `from`, `user_name` as `from_name`, `to`, `message`, `timestamp` FROM\n' +
        '    (SELECT `msg_no`, `from`, `to`, `message`, `timestamp` FROM chat_server.messages\n' +
        '    WHERE room_num=:roomNum' + startOffset + notFirstTry + toCondition + ') as msg_list\n' +
        'LEFT JOIN chat_server.users ON msg_list.from=users.user_id\n' +
        'ORDER BY msg_no desc limit ' + limit;

    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        roomNum: roomNum,
        limit: limit,
        offset: offset
    };

    var messages = [];

    console.log(queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('result', function (result){
        result.on('data', function (row){
            messages.push(row);
        });
    }).on('end', function (){
        callback({result: 'success', messages: messages});
    }).on('error', function (error) {
        console.log('error: ' + JSON.stringify(error));
        callback({result: 'failed', msg: error});
    });
}

function registerToken (userId, token, callback) {
    /*
    INSERT INTO chat_server.tokens(token, user_id)
    VALUES ('xxxxxxxxxxx', 'naver-26042906');
    */

    var tokenHash = toHash(token);
    var query =
        'INSERT INTO chat_server.tokens(token_hash, token, user_id)\n' +
        'VALUES (:tokenHash, :token, :userId)\n' +
        'ON DUPLICATE KEY UPDATE user_id=:userId;';


    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        tokenHash: tokenHash,
        token: token,
        userId: userId
    };

    console.log('registerToken: ' + queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('end', function (){
        callback({result: 'success'});
    });
}

function unregisterToken (tokens, callback) {
    /*
    DELETE FROM `chat_server`.`tokens`
    WHERE token IN (xxxx, xxxxx);
    */

    var query =
        'DELETE FROM `chat_server`.`tokens`\n' +
        'WHERE token IN (\'' + tokens.join('\', \'') + '\')';

    console.log('registerToken: ' + query);

    dbClient.query(query).on('end', function (){
        callback({result: 'success'});
    });
}

function getTokenByRoomId (roomNum, fromId, callback) {
    /*
    SELECT tokens.user_id, tokens.token FROM
    (SELECT user_id FROM chat_server.room_user_map WHERE room_num='1529212854206' and user_id!='naver-26042906') as user_list
    INNER JOIN chat_server.tokens ON user_list.user_id=tokens.user_id
    */

    var query =
        'SELECT tokens.token FROM\n' +
        '    (SELECT user_id FROM chat_server.room_user_map WHERE room_num=:roomNum and user_id!=:fromId) as user_list\n' +
        'INNER JOIN chat_server.tokens ON user_list.user_id=tokens.user_id';


    var queryFmt = dbClient.prepare(query);
    var queryArgs = {
        roomNum: roomNum,
        fromId: fromId
    };
    var tokenList = [];

    console.log('getTokenByRoomId: ' + queryFmt(queryArgs));

    dbClient.query(queryFmt(queryArgs)).on('result', function (result){
        result.on('data', function (row){
            tokenList.push(row.token);
        });
    }).on('end', function (){
        callback({result: 'success', tokenList: tokenList});
    });
}

function getTokenByUserId (userId, callback) {
    /*
    SELECT token FROM chat_server.tokens
    WHERE user_id='naver-26042906'
    */

    var query =
        'SELECT token FROM chat_server.tokens\n' +
        'WHERE user_id=:userId';

    var queryFmt = dbClient.prepare(query);
    var tokenList = [];

    dbClient.query(queryFmt({userId: userId})).on('result', function (result){
        result.on('data', function (row){
            tokenList.push(row.token);
        });
    }).on('end', function (){
        callback({result: 'success', tokenList: tokenList});
    });
}

function showDatabases () {
    console.log('showDatabases');

    dbClient.query('SHOW DATABASES').on('result', function (result){

        result.on('data', function (row){
            console.log('Result: ' + JSON.stringify(row));
        }).on('error', function (err){
            console.log('Error: ' + err);
        }).on('end', function (){
            console.log('Done');
        })
    }).on('end', function (){
        console.log('End');
    });
}

exports.chkValidUser = chkValidUser;
exports.registerUser = registerUser;
exports.updateUser = updateUser;
exports.getUserInfo = getUserInfo;
exports.getUserList = getUserList;
exports.getFreeUserList = getFreeUserList;
exports.getRoomList = getRoomList;
exports.getRoomInfo = getRoomInfo;
exports.getRoomUserList = getRoomUserList;
exports.getInviteUserList = getInviteUserList;
exports.addUser = addUser;
exports.delUser = delUser;
exports.addRoom = addRoom;
exports.delRoom = delRoom;
exports.addRoomUser = addRoomUser;
exports.delRoomUser = delRoomUser;
exports.writeMsg = writeMsg;
exports.readMsg = readMsg;
exports.registerToken = registerToken;
exports.unregisterToken = unregisterToken;
exports.getTokenByRoomId = getTokenByRoomId;
exports.getTokenByUserId = getTokenByUserId;

exports.showDatabases = showDatabases;