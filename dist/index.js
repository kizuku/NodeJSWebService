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
        var config, statusCode, message, shouldEnd, titleText, contentText, instructions, pool;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        config = {
                            user: process.env.user,
                            password: process.env.password,
                            server: process.env.server,
                            database: process.env.database
                            //user: 'autoalexa',
                            //password: '@1exa',
                            //server: '10.35.149.190',
                            //database: 'tempdb'
                        };
                        _context.prev = 1;

                        _Verify2.default.certificateURL(req.headers.signaturecertchainurl);
                        _Verify2.default.timestamp(req.body.request.timestamp);
                        _context.next = 6;
                        return _Verify2.default.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody);

                    case 6:
                        _context.next = 11;
                        break;

                    case 8:
                        _context.prev = 8;
                        _context.t0 = _context['catch'](1);

                        console.log(_context.t0);

                    case 11:
                        statusCode = 200;
                        shouldEnd = false;
                        instructions = "Welcome to <skill name>. You can fetch information with the following commands: get records, get records in AREA, get critical records. " + "For more information, say help.";

                        // set response parameters
                        res.setHeader('Content-Type', 'application/json');
                        if (req.body.request.type === 'LaunchRequest') {
                            message = instructions;
                            titleText = "Skill Launch";
                            contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'";
                        } else if (req.body.request.type === 'SessionEndedRequest') {
                            // Don't send any response
                        } else {
                            pool = new sql.ConnectionPool(config, function (err) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                pool.request().query('select TOP 2 * from ##TempTable', function (error, recordset) {
                                    if (error) console.log(error);else {
                                        // recordset.recordset to get relevant data
                                        console.log(recordset.recordset);
                                        //res.send(recordset)
                                        switch (req.body.request.intent.name) {
                                            case 'GetRecordIntent':
                                                message = "Test get record";
                                                titleText = "TEST";
                                                contentText = message;
                                                break;
                                            case 'AMAZON.HelpIntent':
                                                message = "To get general records, say 'Get records'. To get records from a specific area, say 'Get records in AREA', substituting in the specific area. " + "To get records with critical status, say 'Get critical records'. To exit, say 'Stop'. To cancel operation without exiting, say 'Cancel'.";
                                                titleText = "Skill Help Information";
                                                contentText = message;
                                                break;
                                            case 'AMAZON.StopIntent':
                                                shouldEnd = true;
                                                message = "Skill stopped. Shutting down.";
                                                titleText = "Skill Operation Stopped";
                                                contentText = "Skill operation stopped. Please relaunch to continue.";
                                                break;
                                            case 'AMAZON.CancelIntent':
                                                message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit.";
                                                titleText = "Skill Operation Cancelled";
                                                contentText = message;
                                                break;
                                            case 'AMAZON.FallbackIntent':
                                                message = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                                                titleText = "Skill Fallback";
                                                contentText = "Unknown command. Please say a valid command or repeat if valid.";
                                                break;
                                            default:
                                                statusCode = 500;
                                                shouldEnd = true;
                                                break;
                                        }
                                    }
                                });
                            });
                        }

                        // send response
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

                    case 17:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[1, 8]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var server = app.listen(port, function () {
    console.log('Server is running on port ' + port);
});