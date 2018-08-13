require('dotenv').config();
const express = require('express');
const app = express();
const sql = require('mssql');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const x509 = require('x509.js');
const getPem = require('rsa-pem-from-mod-exp');
const SimpleCrypto = require('simple-crypto-js');
const crypto = require('crypto');
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

app.use(bodyParser.json());

app.get('/', function (req, res) {
//app.post('/', function (req, res) {
    
    // verify signature and cert
    if (!verifySigCertURL(req.headers.SignatureCertChainUrl)) {
        //res.send('Error: invalid signature certificate url');
    }
    // all contents currently commented out in this else statement
    else {
        /*
        // Check request signature
        //axios.get(url).then(result => {
        axios.get('https://s3.amazonaws.com/echo.api/echo-api-cert.pem').then(result => {

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
                    return;
                }
            }

            //console.log('current date: ' + currentDate)
            
            // check SAN
            var SAN = x509.parseCert(certs[0]).subject.commonName
            if (SAN !== 'echo-api.amazon.com') {
                console.log('error: certificate has invalid domain')
                return;
            }

            // check for root CA cert
            if (x509.parseCert(certs[arrSize-2]).issuer.organizationalUnitName !== 'Class 3 Public Primary Certification Authority') {
                console.log('error: trusted root CA certificate not found')
                return;
            }
            

            // extract public key
            var modulus = x509.parseCert(certs[0]).publicModulus
            var exp = x509.parseCert(certs[0]).publicExponent
            var publicKey = getPem(modulus, exp)

            console.log(publicKey)

            // Compare assertHash from signature header to derivedHash from request body
            
            var encSig = atob(req.headers.Signature);
            var simpleCrypto = new SimpleCrypto(publicKey);
            var assertedHash = simpleCrypto.decrypt(encSig);

            var shasum = crypto.createHash('sha1');
            shasum.update(JSON.parse(req.body))
            var derivedHash = shasum.digest('base64')

            if (assertedHash !== derivedHash) {
                console.log('error: hashes do not match')
                return;
            }
            
        });
        */

        // if (!verifyTimestamp(req.body.request.timestamp)) { console.log('error: invalid timestamp'); return; }
    }

    //handle request
    const config = {
        user: process.env.user,
        password: process.env.password,
        server: process.env.server,
        database: process.env.database
    };

    const pool = new sql.ConnectionPool(config, err => {
        if (err) console.log(err);

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
            if (req.body.req.type === 'LaunchRequest') {
                message = instructions
                titleText = "Skill Launch"
                contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'"
            } else if (req.body.req.type === 'SessionEndedRequest') {
                // Don't send any response
            } else {
                switch (req.body.req.intent.name) {
                    case 'GetRecord':
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
    console.log('Server is running..');
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
    console.log(time)
    var currTime = new Date();
    console.log(currTime)

    var diff = currTime.getTime() - time.getTime();
    diff = diff / 1000;
    console.log(diff)

    if (diff <= 150 && diff >= -150) {
        return true;
    } else {
        return false;
    }
}
