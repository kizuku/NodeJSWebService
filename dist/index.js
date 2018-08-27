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
        var sendResult, config, statusCode, message, shouldEnd, titleText, contentText, instructions, pool, result;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        sendResult = function sendResult(statusCode, message, titleText, contentText) {
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
                        _context.prev = 2;

                        _Verify2.default.certificateURL(req.headers.signaturecertchainurl);
                        _Verify2.default.timestamp(req.body.request.timestamp);
                        _context.next = 7;
                        return _Verify2.default.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody);

                    case 7:
                        _context.next = 13;
                        break;

                    case 9:
                        _context.prev = 9;
                        _context.t0 = _context['catch'](2);

                        console.log(_context.t0);
                        return _context.abrupt('return', false);

                    case 13:
                        statusCode = 200;
                        shouldEnd = false;
                        instructions = "Welcome to <skill name>. You can fetch information with the following commands: get records, get records in AREA, get critical records. " + "For more information, say help.";

                        // set response parameters
                        res.setHeader('Content-Type', 'application/json');

                        if (!(req.body.request.type === 'LaunchRequest')) {
                            _context.next = 25;
                            break;
                        }

                        message = instructions;
                        titleText = "Skill Launch";
                        contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'";
                        sendResult(200, "launch", "Title Text", "Content Text");
                        return _context.abrupt('return', true);

                    case 25:
                        if (!(req.body.request.type === 'SessionEndedRequest')) {
                            _context.next = 27;
                            break;
                        }

                        return _context.abrupt('return', true);

                    case 27:
                        _context.t1 = req.body.request.intent.name;
                        _context.next = _context.t1 === 'GetRecordIntent' ? 30 : _context.t1 === 'AMAZON.HelpIntent' ? 34 : _context.t1 === 'AMAZON.StopIntent' ? 38 : _context.t1 === 'AMAZON.CancelIntent' ? 43 : _context.t1 === 'AMAZON.FallbackIntent' ? 47 : 51;
                        break;

                    case 30:
                        message = "Test get record";
                        titleText = "TEST";
                        contentText = message;
                        return _context.abrupt('break', 55);

                    case 34:
                        message = "To get general records, say 'Get records'. To get records from a specific area, say 'Get records in AREA', substituting in the specific area. " + "To get records with critical status, say 'Get critical records'. To exit, say 'Stop'. To cancel operation without exiting, say 'Cancel'.";
                        titleText = "Skill Help Information";
                        contentText = message;
                        return _context.abrupt('break', 55);

                    case 38:
                        shouldEnd = true;
                        message = "Skill stopped. Shutting down.";
                        titleText = "Skill Operation Stopped";
                        contentText = "Skill operation stopped. Please relaunch to continue.";
                        return _context.abrupt('break', 55);

                    case 43:
                        message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit.";
                        titleText = "Skill Operation Cancelled";
                        contentText = message;
                        return _context.abrupt('break', 55);

                    case 47:
                        message = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                        titleText = "Skill Fallback";
                        contentText = "Unknown command. Please say a valid command or repeat if valid.";
                        return _context.abrupt('break', 55);

                    case 51:
                        statusCode = 500;
                        shouldEnd = true;
                        res.status(500);
                        return _context.abrupt('return', false);

                    case 55:
                        _context.prev = 55;
                        pool = new sql.ConnectionPool(config);
                        _context.next = 59;
                        return pool.connect();

                    case 59:
                        _context.next = 61;
                        return pool.request().query('select TOP 2 * from ##TempTable');

                    case 61:
                        result = _context.sent;

                        console.log(result);
                        sendResult(200, result.recordset[0].description, 'Some result', 'Some content');
                        _context.next = 71;
                        break;

                    case 66:
                        _context.prev = 66;
                        _context.t2 = _context['catch'](55);

                        console.log(_context.t2);
                        res.status(500);
                        return _context.abrupt('return', false);

                    case 71:
                        return _context.abrupt('return', true);

                    case 72:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[2, 9], [55, 66]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var server = app.listen(port, function () {
    console.log('Server is running on port ' + port);
});