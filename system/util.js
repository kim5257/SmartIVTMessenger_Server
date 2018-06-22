function getTimeString (){
    var time = new Date();
    var timeString = time.getFullYear().toString().padStart(4, "0") + '-' +
        (time.getMonth()+1).toString().padStart(2, "0") + '-' +
        time.getDate().toString().padStart(2, "0") + ' ' +
        time.getHours().toString().padStart(2, "0") + ':' +
        time.getMinutes().toString().padStart(2, "0") + ':' +
        time.getSeconds().toString().padStart(2, "0");

    return timeString;
}


exports.getTimeString = getTimeString;