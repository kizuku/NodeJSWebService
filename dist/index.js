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
        var statusCode, message, shouldEnd, titleText, contentText, instructions;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.prev = 0;

                        _Verify2.default.certificateURL(req.headers.signaturecertchainurl);
                        _Verify2.default.timestamp(req.body.request.timestamp);
                        _context.next = 5;
                        return _Verify2.default.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody);

                    case 5:
                        _context.next = 10;
                        break;

                    case 7:
                        _context.prev = 7;
                        _context.t0 = _context['catch'](0);

                        console.log(_context.t0);

                    case 10:
                        statusCode = 200;
                        shouldEnd = false;
                        instructions = "Welcome to <skill name>. You can fetch information with the following commands: get records, get records in AREA, get critical records. " + "For more information, say help.";

                        //console.log("Body: \n\n" + JSON.stringify(req.body) + "\n\n")
                        //return

                        // set response parameters
                        res.setHeader('Content-Type', 'application/json');

                        if (!(req.body.request.type === 'LaunchRequest')) {
                            _context.next = 20;
                            break;
                        }

                        message = instructions;
                        titleText = "Skill Launch";
                        contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'";
                        _context.next = 47;
                        break;

                    case 20:
                        if (!(req.body.request.type === 'SessionEndedRequest')) {
                            _context.next = 23;
                            break;
                        }

                        _context.next = 47;
                        break;

                    case 23:
                        _context.t1 = req.body.request.intent.name;
                        _context.next = _context.t1 === 'GetRecord' ? 26 : _context.t1 === 'AMAZON.HelpIntent' ? 27 : _context.t1 === 'AMAZON.StopIntent' ? 31 : _context.t1 === 'AMAZON.CancelIntent' ? 36 : _context.t1 === 'AMAZON.FallbackIntent' ? 40 : 44;
                        break;

                    case 26:
                        return _context.abrupt('break', 47);

                    case 27:
                        message = "To get general records, say 'Get records'. To get records from a specific area, say 'Get records in AREA', substituting in the specific area. " + "To get records with critical status, say 'Get critical records'. To exit, say 'Stop'. To cancel operation without exiting, say 'Cancel'.";
                        titleText = "Skill Help Information";
                        contentText = message;
                        return _context.abrupt('break', 47);

                    case 31:
                        shouldEnd = true;
                        message = "Skill stopped. Shutting down.";
                        titleText = "Skill Operation Stopped";
                        contentText = "Skill operation stopped. Please relaunch to continue.";
                        return _context.abrupt('break', 47);

                    case 36:
                        message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit.";
                        titleText = "Skill Operation Cancelled";
                        contentText = message;
                        return _context.abrupt('break', 47);

                    case 40:
                        message = "I'm not sure I understand. Please say a valid command or repeat yourself.";
                        titleText = "Skill Fallback";
                        contentText = "Unknown command. Please say a valid command or repeat if valid.";
                        return _context.abrupt('break', 47);

                    case 44:
                        statusCode = 500;
                        shouldEnd = true;
                        return _context.abrupt('break', 47);

                    case 47:
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

                    case 48:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[0, 7]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var server = app.listen(port, function () {
    console.log('Server is running on port ' + port);
});