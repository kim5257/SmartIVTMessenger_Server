if ( window.android != null ) {
    console.log('Return: ' + window.android.testMethod ('JSP interface test'));

    // 사용자 이름과 FCM 토큰을 서버에 전달
    var xhr = new XMLHttpRequest();
    var data = {
        user_id: data.user_info.user_id,
        fcm_token: window.android.getToken()
    };

    xhr.open('POST', '/login/auth/google/callback');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(data));
}

window.location.replace('/');