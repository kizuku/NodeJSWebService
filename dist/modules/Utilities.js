"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var convertMilitaryTimeToStandard = function convertMilitaryTimeToStandard(time) {
    time = time.split(':');

    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);

    var timeValue;

    if (hours > 0 && hours <= 12) {
        timeValue = "" + hours;
    } else if (hours > 12) {
        timeValue = "" + (hours - 12);
    } else if (hours == 0) {
        timeValue = "12";
    }

    timeValue += minutes < 10 ? ":0" + minutes : ":" + minutes;
    timeValue += seconds < 10 ? ":0" + seconds : ":" + seconds;
    timeValue += hours >= 12 ? " P.M." : " A.M.";

    return timeValue;
};

var Utilities = {
    convertMilitaryTimeToStandard: convertMilitaryTimeToStandard
};

exports.default = Utilities;