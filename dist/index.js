'use strict';

require('babel-polyfill');

var _Verify = require('./modules/Verify');

var _Verify2 = _interopRequireDefault(_Verify);

var _Utilities = require('./modules/Utilities');

var _Utilities2 = _interopRequireDefault(_Utilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var express = require('express');
var app = express();
var sql = require('mssql');
require('dotenv').config();

var port = process.env.PORT || 443;

app.use(function (req, res, next) {
    var body = '';

    req.on('data', function (chunk) {
        body += chunk.toString(); // convert Buffer to string
    });

    req.on('end', function () {
        req.body = JSON.parse(body);
        req.rawBody = body;
        next();
    });
});

app.post('/', function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
        var sendResult, sendDialog, config, statusCode, message, shouldEnd, titleText, contentText, instructions, query, slotType, msg, pool, result;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        sendDialog = function sendDialog(intentName, slotName) {
                            //console.log("Trying to send dialog")
                            var textMsg = "Default value";
                            if (intentName = "NumRecordsIntent") {
                                textMsg = "What level or category are you interested in?";
                            }
                            res.status(200).json({
                                version: "1.0",
                                sessionAttributes: {},
                                response: {
                                    outputSpeech: {
                                        type: "PlainText",
                                        text: textMsg
                                    },
                                    shouldEndSession: false,
                                    directives: [{
                                        type: "Dialog.ElicitSlot",
                                        slotToElicit: slotName
                                    }]
                                }
                            });
                        };

                        sendResult = function sendResult(statusCode, message, titleText, contentText, shouldEnd) {
                            res.status(statusCode).json({
                                version: "1.0",
                                response: {
                                    outputSpeech: {
                                        //type: "SSML",
                                        //ssml: "<speak>" + message + "</speak>"
                                        type: "PlainText",
                                        text: message
                                    },
                                    card: {
                                        type: "Simple",
                                        title: titleText,
                                        content: contentText
                                    },
                                    reprompt: {
                                        outputSpeech: {
                                            //type: "SSML",
                                            //ssml: "<speak>" + message + "</speak>"
                                            type: "PlainText",
                                            text: message
                                        }
                                    },
                                    shouldEndSession: shouldEnd
                                }
                            });
                        };

                        config = {
                            user: process.env.user,
                            password: process.env.password,
                            server: process.env.server,
                            database: process.env.database
                        };
                        _context.prev = 3;

                        _Verify2.default.certificateURL(req.headers.signaturecertchainurl);
                        _Verify2.default.timestamp(req.body.request.timestamp);
                        _context.next = 8;
                        return _Verify2.default.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody);

                    case 8:
                        _context.next = 14;
                        break;

                    case 10:
                        _context.prev = 10;
                        _context.t0 = _context['catch'](3);

                        console.log(_context.t0);
                        return _context.abrupt('return', false);

                    case 14:
                        statusCode = 200;
                        shouldEnd = false;
                        instructions = "Welcome to <skill name>. You can fetch information with the following commands: get record, get number of records, and get most recent record. " + "For more information, say help.";

                        // set response parameters
                        res.setHeader('Content-Type', 'application/json');

                        if (!(req.body.request.type === 'LaunchRequest')) {
                            _context.next = 26;
                            break;
                        }

                        message = instructions;
                        titleText = "Skill Launch";
                        contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'";
                        sendResult(200, message, titleText, contentText, shouldEnd);
                        return _context.abrupt('return', true);

                    case 26:
                        if (!(req.body.request.type === 'SessionEndedRequest')) {
                            _context.next = 28;
                            break;
                        }

                        return _context.abrupt('return', true);

                    case 28:
                        query = "";

                        shouldEnd = false;
                        message = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                        titleText = "Skill Fallback";
                        contentText = "Unknown command. Please say a valid command or repeat if valid.";

                        _context.t1 = req.body.request.intent.name;
                        _context.next = _context.t1 === 'GetRecordIntent' ? 36 : _context.t1 === 'NumRecordsIntent' ? 38 : _context.t1 === 'GetMostRecentRecordIntent' ? 59 : _context.t1 === 'AMAZON.HelpIntent' ? 61 : _context.t1 === 'AMAZON.StopIntent' ? 68 : _context.t1 === 'AMAZON.CancelIntent' ? 75 : _context.t1 === 'AMAZON.FallbackIntent' ? 82 : 89;
                        break;

                    case 36:
                        query = "select top 1 * from ##TempTable";
                        return _context.abrupt('break', 94);

                    case 38:
                        slotType = req.body.request.intent.slots.Type.value;

                        if (!(slotType == null)) {
                            _context.next = 43;
                            break;
                        }

                        query = "select top 1 * from ##TempTable";
                        _context.next = 58;
                        break;

                    case 43:
                        if (!(slotType.toLowerCase() == "warning" || slotType.toLowerCase() == "critical" || slotType.toLowerCase() == "15-critical" || slotType.toLowerCase() == "11-warning")) {
                            _context.next = 48;
                            break;
                        }

                        if (slotType.toLowerCase() == "warning") {
                            slotType = "11-warning";
                        } else if (slotType.toLowerCase() == "critical") {
                            slotType = "15-critical";
                        }
                        query = "select * from ##TempTable where level='" + slotType + "'";
                        _context.next = 58;
                        break;

                    case 48:
                        if (!(slotType.toLowerCase() == "process" || slotType.toLowerCase() == "instrument")) {
                            _context.next = 52;
                            break;
                        }

                        query = "select * from ##TempTable where category='" + slotType + "'";
                        _context.next = 58;
                        break;

                    case 52:
                        if (!(slotType.toLowerCase() == "all")) {
                            _context.next = 56;
                            break;
                        }

                        query = "select * from ##TempTable";
                        _context.next = 58;
                        break;

                    case 56:
                        sendResult(200, "Error. Invalid type received. Please relaunch the skill.", "Title Text", "Content Text", true);
                        return _context.abrupt('return', false);

                    case 58:
                        return _context.abrupt('break', 94);

                    case 59:
                        query = "select top 1 * from ##TempTable Order By occurDate Desc, occurTime Desc";
                        return _context.abrupt('break', 94);

                    case 61:
                        query = "";
                        shouldEnd = false;
                        message = instructions;
                        titleText = "Skill Help Information";
                        contentText = message;
                        sendResult(200, message, titleText, contentText, shouldEnd);
                        return _context.abrupt('return', true);

                    case 68:
                        query = "";
                        shouldEnd = true;
                        message = "Skill stopped. Shutting down.";
                        titleText = "Skill Operation Stopped";
                        contentText = "Skill operation stopped. Please relaunch if you want to continue.";
                        sendResult(200, message, titleText, contentText, shouldEnd);
                        return _context.abrupt('return', true);

                    case 75:
                        query = "";
                        shouldEnd = false;
                        message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit.";
                        titleText = "Skill Operation Cancelled";
                        contentText = message;
                        sendResult(200, message, titleText, contentText, shouldEnd);
                        return _context.abrupt('return', true);

                    case 82:
                        query = "";
                        shouldEnd = false;
                        message = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                        titleText = "Skill Fallback";
                        contentText = "Unknown command. Please say a valid command or repeat if valid.";
                        sendResult(200, message, titleText, contentText, shouldEnd);
                        return _context.abrupt('return', true);

                    case 89:
                        query = "";
                        statusCode = 500;
                        shouldEnd = true;
                        res.status(500);
                        return _context.abrupt('return', false);

                    case 94:
                        _context.prev = 94;

                        shouldEnd = false;
                        pool = new sql.ConnectionPool(config);
                        _context.next = 99;
                        return pool.connect();

                    case 99:
                        _context.next = 101;
                        return pool.request().query(query);

                    case 101:
                        result = _context.sent;
                        _context.t2 = req.body.request.intent.name;
                        _context.next = _context.t2 === 'GetRecordIntent' ? 105 : _context.t2 === 'NumRecordsIntent' ? 108 : _context.t2 === 'GetMostRecentRecordIntent' ? 111 : 113;
                        break;

                    case 105:
                        msg = "The top alarm occurred on " + result.recordset[0].occurDate + " at " + result.recordset[0].occurTime + " with a description of " + result.recordset[0].description + " and a level of " + result.recordset[0].level;
                        sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);
                        return _context.abrupt('break', 115);

                    case 108:
                        slotType = req.body.request.intent.slots.Type.value;

                        if (slotType == null) {
                            //console.log("slotType is null")
                            sendDialog("NumRecordsIntent", "Type");
                        } else {
                            //console.log("slotType is not null")
                            if (slotType.toLowerCase() == "warning" || slotType.toLowerCase() == "11-warning" || slotType.toLowerCase() == "critical" || slotType.toLowerCase() == "15-critical") {
                                msg = "There are " + result.recordset.length + " records with a level of " + slotType;
                            } else if (slotType.toLowerCase() == "process" || slotType.toLowerCase() == "instrument") {
                                msg = "There are " + result.recordset.length + " records with a category of " + slotType;
                            } else if (slotType.toLowerCase() == "all") {
                                msg = "There are currently " + result.recordset.length + " total active and unacknowledged records";
                            }
                            sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);
                        }
                        return _context.abrupt('break', 115);

                    case 111:
                        msg = "The most recent alarm was a " + result.recordset[0].Category + " alarm with level " + result.recordset[0].level + " and occurred on " + result.recordset[0].occurDate + " at " + result.recordset[0].occurTime + " with description " + result.recordset[0].description;
                        sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);

                    case 113:
                        msg = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                        throw "Invalid query";

                    case 115:
                        _context.next = 122;
                        break;

                    case 117:
                        _context.prev = 117;
                        _context.t3 = _context['catch'](94);

                        console.log(_context.t3);
                        res.status(500);
                        return _context.abrupt('return', false);

                    case 122:
                        return _context.abrupt('return', true);

                    case 123:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[3, 10], [94, 117]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var server = app.listen(port, function () {
    console.log('Server is running on port ' + port);
});