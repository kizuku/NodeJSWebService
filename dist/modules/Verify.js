'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

require('babel-polyfill');

var _nodeRsa = require('node-rsa');

var _nodeRsa2 = _interopRequireDefault(_nodeRsa);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var axios = require('axios');

var x509 = require('x509.js');
var getPem = require('rsa-pem-from-mod-exp');
var CryptoJS = require('crypto-js');
var path = require('path');

var timestamp = function timestamp(_timestamp) {
    var time = new Date(_timestamp);
    var currTime = new Date();

    var diff = (currTime.getTime() - time.getTime()) / 1000;

    if (diff <= 150 && diff >= -150) {
        return true;
    } else {
        return false;
    }
};

var signature = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(url, _signature, body) {
        var result, certs, arrSize, i, parsedCert, beforeDate, afterDate, currentDate, SAN, rootCert, cert, modulus, exp, modulus2, exp2, key2, publicKey, derivedHash, key, dec;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return axios.get(url);

                    case 2:
                        result = _context.sent;


                        // Grabs cert data
                        certs = result.data;

                        certs = certs.split('-----END CERTIFICATE-----\n');

                        arrSize = certs.length;
                        i = 0;

                    case 7:
                        if (!(i < arrSize - 1)) {
                            _context.next = 16;
                            break;
                        }

                        certs[i] = certs[i] + '-----END CERTIFICATE-----\n';

                        parsedCert = x509.parseCert(certs[i]);
                        beforeDate = parsedCert.notBefore, afterDate = parsedCert.notAfter, currentDate = new Date();

                        if (!(currentDate < beforeDate || currentDate > afterDate)) {
                            _context.next = 13;
                            break;
                        }

                        throw new Error('error: certificate has invalid dates');

                    case 13:
                        i++;
                        _context.next = 7;
                        break;

                    case 16:
                        SAN = x509.parseCert(certs[0]).subject.commonName;

                        if (!(SAN !== 'echo-api.amazon.com')) {
                            _context.next = 19;
                            break;
                        }

                        throw new Error('error: certificate has invalid domain');

                    case 19:

                        // check for root CA cert
                        rootCert = x509.parseCert(certs[arrSize - 2]).issuer.organizationalUnitName;

                        // "Class 3 Public Primary Certification Authority"

                        if (!(rootCert.substring(rootCert.length - 23, rootCert.length) !== 'Certification Authority')) {
                            _context.next = 22;
                            break;
                        }

                        throw new Error('error: trusted root CA certificate not found');

                    case 22:

                        // extract public key
                        cert = x509.parseCert(certs[0]);

                        console.log("Begin Cert:\n\n" + JSON.stringify(cert) + "\n\nEnd Cert");
                        modulus = x509.parseCert(certs[0]).publicModulus;
                        exp = x509.parseCert(certs[0]).publicExponent;
                        modulus2 = new Buffer(modulus, 'hex');
                        exp2 = new Buffer(exp);

                        exp2.writeInt32BE(65537, 0);

                        key2 = new _nodeRsa2.default();

                        key2.generateKeyPair();

                        modulus = new Buffer.from(modulus, 'hex').toString('base64');
                        exp = new Buffer.from(exp, 'hex').toString('base64');

                        publicKey = getPem(modulus, exp);
                        derivedHash = CryptoJS.SHA1(body);
                        key = new _nodeRsa2.default(publicKey, 'pkcs1-public-pem', { signingScheme: 'pkcs1-sha1' });
                        dec = key2.decryptPublic(_signature, 'base64');

                        console.log("Decrypted: " + dec);

                        //console.log("assertedHash: " + assertedHash)
                        //console.log("derivedHash: " + derivedHash)

                        if (!(assertedHash !== derivedHash)) {
                            _context.next = 40;
                            break;
                        }

                        throw new Error('error: hashes do not match');

                    case 40:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function signature(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var certificateURL = function certificateURL(url) {
    var protocol = url.substring(0, 8).toLowerCase();
    if (protocol !== 'https://') throw new Error('error: invalid protocol');

    var body = url.substring(8);
    body = path.normalize(body);
    body = body.replace(new RegExp(/\\/g), '/');

    var array = body.split('/');
    if (array.length !== 3) throw new Error('error: url does not have 3 elements');

    switch (array[0].length) {
        case 20:
            if (array[0].toLowerCase().substring(0, 16) !== 's3.amazonaws.com') throw new Error('error: invalid hostname');
            if (array[0].substring(16) !== ':443') throw new Error('error: invalid port');
            break;
        case 16:
            if (array[0].toLowerCase() !== 's3.amazonaws.com') throw new Error('error: invalid hostname');
            break;
        default:
            throw new Error('error: invalid hostname');
    }

    if (array[1] !== 'echo.api') throw new Error('error: invalid path');
};

var Verify = {
    timestamp: timestamp,
    signature: signature,
    certificateURL: certificateURL
};
exports.default = Verify;