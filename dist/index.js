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
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.prev = 0;

                        _Verify2.default.certificateURL(req.headers.signaturecertchainurl);
                        _context.next = 4;
                        return _Verify2.default.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody);

                    case 4:
                        _context.next = 9;
                        break;

                    case 6:
                        _context.prev = 6;
                        _context.t0 = _context['catch'](0);

                        console.log(_context.t0);

                    case 9:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[0, 6]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var server = app.listen(port, function () {
    console.log('Server is running on port ' + port);
});