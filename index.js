require('dotenv').config();
const express = require('express');
const app = express();
const sql = require('mssql');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const x509 = require('x509.js');
const getPem = require('rsa-pem-from-mod-exp');
const verifier = require ('alexa-verifier')
//const SimpleCrypto = require('simple-crypto-js').default;
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const Base64 = require('js-base64').Base64;
const getRawBody = require('raw-body');
const contentType = require('content-type')
//const fs = require('fs');
const port = process.env.PORT || 443;

/* TESTS FOR verifySigCertURL | ALL PASSED 
console.log(verifySigCertURL('https://s3.amazonaws.com/echo.api/echo-api-cert.pem'))
console.log(verifySigCertURL('https://s3.amazonaws.com:443/echo.api/echo-api-cert.pem'))
console.log(verifySigCertURL('https://s3.amazonaws.com/echo.api/../echo.api/echo-api-cert.pem'))
console.log(verifySigCertURL('http://s3.amazonaws.com/echo.api/echo-api-cert.pem'))
console.log(verifySigCertURL('https://notamazon.com/echo.api/echo-api-cert.pem'))
console.log(verifySigCertURL('https://s3.amazonaws.com/EcHo.aPi/echo-api-cert.pem'))
console.log(verifySigCertURL('https://s3.amazonaws.com/invalid.path/echo-api-cert.pem'))
console.log(verifySigCertURL('https://s3.amazonaws.com:563/echo.api/echo-api-cert.pem'))
*/

// verifyTimestamp test | NEED TO CHECK TIMESTAMP FORMAT OF REQUESTS
//console.log(verifyTimestamp(new Date("2018-08-13T18:30:56Z")))
//return;

//var secretKey = SimpleCrypto.generateRandom();
//var simpleCrypto = new SimpleCrypto(secretKey);

/*
app.use(function (req, res, next) {
    getRawBody(req, {
      length: req.headers['content-length'],
      limit: '1mb',
      encoding: contentType.parse(req).parameters.charset
    }, function (err, string) {
      if (err) return next(err)
      req.text = string
      next()
    })
})
*/

app.use(function(req, res, next) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
        console.log("body: " + body);
        next()
    });
})

app.use(bodyParser.json());

/*
app.use(bodyParser.urlencoded({
    verify: function(req, res, body) {
        req.rawBody = body.toString();
    }
}));
*/

//app.get('/', function (req, res) {
app.post('/', function (req, res) {
    //req.body = JSON.parse(req.body)
    console.log(req.rawBody)
    console.log(req.body)
    //console.log(req)
    //console.log(req.headers)
    //console.log(req.body);
    
    // verify signature and cert
    
    if (!verifySigCertURL(req.headers.signaturecertchainurl)) {
        res.send('Error: invalid signature certificate url');
        // return;
    }
    else {
        // Check request signature
        if (!verifySig(req.headers.signaturecertchainurl, req.headers.signature, JSON.stringify(req.body))) { 
            console.log('error: signature issue');
            // return; 
        } 
        else {
            console.log('valid signature');
        }

        if (!verifyTimestamp(req.body.request.timestamp)) { 
            console.log('error: invalid timestamp'); 
            // return;
        } 
        else {
            console.log('valid timestamp');
        }
    }

    // verify request
    //verifier(req.headers.signaturecertchainurl, req.headers.signature, JSON.stringify(req.body), function callback(er) { 
    //    console.log('error: ' + er);  // Results in error: undefined
    //});

    //handle request
    console.log("Reached config")
    const config = {
        user: process.env.user,
        password: process.env.password,
        server: process.env.server,
        database: process.env.database
    };

    const pool = new sql.ConnectionPool(config, err => {
        if (err) console.log(err);

        console.log("Pool request reached \n")
        pool.request().query('select * from ##TempTable', function (err, recordset) {
            if (err) console.log(err)
            // NOTES ==========================================================================
            // recordset to see entire response object
            // recordset.recordset to access actual response attribute
            // recordset.recordsets[0][n] to access nth table row, 0-based 
            // recordset.recordsets[0][n].<ColumnName> to access specific attributes
            //var arraySize = recordset.recordsets[0].length;
            //recordset.recordsets[0][0].Category = 'Test'

            //var i = 1;
            // comment out the following line to keep time in military format
            //recordset.recordsets[0][i].occurTime = convertMilitaryTimeToStandard(recordset.recordsets[0][i].occurTime)

            //res.send(recordset.recordsets[0][i])

            // declare and init vars
            var statusCode, message, shouldEnd, titleText, contentText, instructions
            statusCode = 200;
            shouldEnd = false;
            instructions = "Welcome to <skill name>. You can fetch information with the following commands: get records, get records in AREA, get critical records. " 
                            + "For more information, say help."

            // set response parameters
            res.setHeader('Content-Type', 'application/json');
            if (req.body.request.type === 'LaunchRequest') {
                message = instructions
                titleText = "Skill Launch"
                contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'"
            } else if (req.body.request.type === 'SessionEndedRequest') {
                // Don't send any response
            } else {
                switch (req.body.request.intent.name) {
                    case 'GetRecordIntent':
                        message = "Test: Get Record"
                        titleText = "Get Record"
                        contentText = "Test"
                        break;
                    case 'AMAZON.HelpIntent': 
                        message = "To get general records, say 'Get records'. To get records from a specific area, say 'Get records in AREA', substituting in the specific area. "
                                    + "To get records with critical status, say 'Get critical records'. To exit, say 'Stop'. To cancel operation without exiting, say 'Cancel'."
                        titleText = "Skill Help Information"
                        contentText = message
                        break;
                    case 'AMAZON.StopIntent':
                        shouldEnd = true;
                        message = "Skill stopped. Shutting down."
                        titleText = "Skill Operation Stopped"
                        contentText = "Skill operation stopped. Please relaunch to continue."
                        break;
                    case 'AMAZON.CancelIntent':
                        message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit."
                        titleText = "Skill Operation Cancelled"
                        contentText = message
                        break;
                    case 'AMAZON.FallbackIntent':
                        message = "I'm not sure I understand. Please say a valid command or repeat yourself."
                        titleText = "Skill Fallback"
                        contentText = "Unknown command. Please say a valid command or repeat if valid."
                        break;
                    default:
                        statusCode = 500;
                        shouldEnd = true;
                        break;
                }
            }
            // send response
            res.status(statusCode).json({
                version: "1.0",
                response: {
                    outputSpeech: {
                        type: "SSML",
                        ssml: "<speak>" + message + "</speak>"
                    },
                    card: {
                        type: "Simple",
                        title: titleText,
                        content: contentText
                    },
                    reprompt: {
                        outputSpeech: {
                            type: "SSML",
                            ssml: "<speak>" + message + "</speak>"
                        }
                    },
                    shouldEndSession: shouldEnd
                }
            });
        });
    });

    pool.on('error', err => {
        console.log(err)
    });
    
});

var server = app.listen(port, function() {
    console.log('Server is running on port ' + port);
});

function convertMilitaryTimeToStandard(time) {
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

    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;
    timeValue += (seconds < 10) ? ":0" + seconds : ":" + seconds;
    timeValue += (hours >= 12) ? " P.M." : " A.M.";

    return timeValue;
}

function verifySigCertURL(url) {
    var protocol = url.substring(0, 8).toLowerCase();
    if (protocol !== 'https://') {
        console.log('error: invalid protocol')
        return false
    }
    var body = url.substring(8)
    body = path.normalize(body)
    body = body.replace(new RegExp(/\\/g), '/')
    var array = body.split('/')

    if (array.length !== 3) {
        console.log('error: url does not have 3 elements')
        return false
    }

    // check hostname
    // has port
    if (array[0].length == 20) {
        if (array[0].toLowerCase().substring(0, 16) !== 's3.amazonaws.com') {
            console.log('error: invalid hostname')
            return false
        }
        if (array[0].substring(16) !== ':443') {
            console.log('error: invalid port')
            return false
        }
    }
    // doesn't have port
    else if (array[0].length == 16) {
        if (array[0].toLowerCase() !== 's3.amazonaws.com') {
            console.log('error: invalid hostname')
            return false;
        }
    }
    else {
        console.log('error: invalid hostname')
        return false;
    }

    // check path
    if (array[1] !== 'echo.api') {
        console.log('error: invalid path')
        return false;
    }

    return true;
}

function verifyTimestamp(timestamp) {
    var time = new Date(timestamp);
    //console.log(time)
    var currTime = new Date();
    //console.log(currTime)

    var diff = currTime.getTime() - time.getTime();
    diff = diff / 1000;
    //console.log(diff)

    if (diff <= 150 && diff >= -150) {
        return true;
    } else {
        return false;
    }
}

function verifySig(url, signature, body) {
    //axios.get(req.headers.signaturecertchainurl).then(result => {
    axios.get(url).then(result => {
        // Grabs cert data
        var certs = result.data;
        certs = certs.split('-----END CERTIFICATE-----\n');            
        var arrSize = certs.length
        for (var i = 0; i < arrSize - 1; i++) {
            certs[i] = certs[i] + '-----END CERTIFICATE-----\n';

            // Shows parsed certs
            //console.log(x509.parseCert(certs[i]))
            var parsedCert = x509.parseCert(certs[i])
            
            // check dates
            var beforeDate = parsedCert.notBefore
            var afterDate = parsedCert.notAfter
            var currentDate = new Date();
            if (currentDate < beforeDate || currentDate > afterDate) {
                console.log('error: certificate has invalid dates')
                return false;
            }
        }
        //console.log(x509.parseCert(certs[0]))

        //console.log('current date: ' + currentDate)
        
        // check SAN
        var SAN = x509.parseCert(certs[0]).subject.commonName
        if (SAN !== 'echo-api.amazon.com') {
            console.log('error: certificate has invalid domain')
            return false;
        }

        // check for root CA cert
        var rootCert = x509.parseCert(certs[arrSize-2]).issuer.organizationalUnitName;
        // "Class 3 Public Primary Certification Authority"
        if (rootCert.substring(rootCert.length - 23, rootCert.length) !== 'Certification Authority') {
            console.log('error: trusted root CA certificate not found')
            return false;
        }
        

        // extract public key
        var modulus = x509.parseCert(certs[0]).publicModulus
        var exp = x509.parseCert(certs[0]).publicExponent

        modulus = new Buffer.from(modulus, 'hex').toString('base64')
        exp = new Buffer.from(exp, 'hex').toString('base64')

        var publicKey = getPem(modulus, exp)

        console.log("mod: " + modulus)
        console.log("exp: " + exp)
        //console.log(publicKey)

        // Compare assertHash from signature header to derivedHash from request body
        
        //var encSig = Base64.decode(req.headers.signature);
        //console.log("signature: " + req.headers.signature + '\n') // is in base64 encoding
        
        //var encSig = CryptoJS.enc.Base64.parse(req.headers.signature)
        var encSig2 = CryptoJS.enc.Base64.parse(signature)
        var encSig = new Buffer(signature, 'base64').toString();

        //var encSig = CryptoJS.enc.Base64.stringify(req.headers.signature);  // doesn't work
        console.log("encSig: " + encSig + '\n')
        console.log("encSig2: " + encSig2 + '\n')
        //simpleCrypto.setSecret(publicKey);
        //var assertedHash = simpleCrypto.decrypt(encSig);  // Avoid for now
       
        /*
        console.log("Hello world");
        var test = CryptoJS.AES.encrypt("Hello world", publicKey)
        console.log(test + '\n')
        var test2 = CryptoJS.AES.decrypt(test, publicKey).toString(CryptoJS.enc.Utf8)
        console.log(test2)
        */

        //var assertedHash = CryptoJS.enc.Hex.stringify(encSig)
        //var assertedHash = CryptoJS.enc.Base64.parse(encSig)
        var assertedHash = CryptoJS.SHA256(encSig, publicKey)  // Maybe?
        //var assertedHash = CryptoJS.enc.Utf8.parse(encSig)  // Bad test
        console.log("assertedHash: " + assertedHash)

        //var derivedHash = CryptoJS.SHA1(JSON.stringify(req.body))
        var derivedHash = CryptoJS.SHA1(body)
        console.log("derivedHash: " + derivedHash)

        if (assertedHash !== derivedHash) {
            console.log('error: hashes do not match')
            return false;
        } 
    });
    return true;
}