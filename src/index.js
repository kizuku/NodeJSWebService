import "babel-polyfill";

const express = require('express');
const app = express();
const sql = require('mssql');
require('dotenv').config();

import Verify from './modules/Verify'
import Utilities from './modules/Utilities'

const port = process.env.PORT || 443;

app.use((req, res, next) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });

    req.on('end', () => {
        req.body = JSON.parse(body)
        req.rawBody = body;
        next()
    });
})

app.post('/', async (req, res) => {
    function sendResult(statusCode, message, titleText, contentText, shouldEnd) {
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
    }

    const config = {
        user: process.env.user,
        password: process.env.password,
        server: process.env.server,
        database: process.env.database
    };

    try {
        Verify.certificateURL(req.headers.signaturecertchainurl)
        Verify.timestamp(req.body.request.timestamp)
        await Verify.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody)
    } catch (e) {
        console.log(e)
        return false
    }

    var statusCode, message, shouldEnd, titleText, contentText, instructions
    statusCode = 200;
    shouldEnd = false;
    instructions = "Welcome to <skill name>. You can fetch information with the following commands: get records, get records in AREA, get critical records. " +
        "For more information, say help."

    // set response parameters
    res.setHeader('Content-Type', 'application/json');
    if (req.body.request.type === 'LaunchRequest') {
        message = instructions
        titleText = "Skill Launch"
        contentText = "Launch the skill for use by saying 'Alexa, launch <skill name>.'"
        sendResult(200, message, titleText, contentText, shouldEnd)
        return true
    } else if (req.body.request.type === 'SessionEndedRequest') {
        return true
    }
    
    switch (req.body.request.intent.name) {
        case 'GetRecordIntent':
            message = "Test get record"
            titleText = "TEST"
            contentText = message
            break;
        case 'AMAZON.HelpIntent':
            message = "To get general records, say 'Get records'. To get records from a specific area, say 'Get records in AREA', substituting in the specific area. " +
                "To get records with critical status, say 'Get critical records'. To exit, say 'Stop'. To cancel operation without exiting, say 'Cancel'."
            titleText = "Skill Help Information"
            contentText = message
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.StopIntent':
            shouldEnd = true;
            message = "Skill stopped. Shutting down."
            titleText = "Skill Operation Stopped"
            contentText = "Skill operation stopped. Please relaunch to continue."
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.CancelIntent':
            message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit."
            titleText = "Skill Operation Cancelled"
            contentText = message
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.FallbackIntent':
            message = "I'm not sure I understand. Please say a valid command or repeat yourself."
            titleText = "Skill Fallback"
            contentText = "Unknown command. Please say a valid command or repeat if valid."
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        default:
            statusCode = 500;
            shouldEnd = true;
            res.status(500)
            return false;
    }

    try {
        const pool = new sql.ConnectionPool(config)
        await pool.connect()
        //await pool.connect()
        const result = await pool.request().query('select TOP 2 * from ##TempTable')
        console.log(result)
        sendResult(200, result.recordset[0].description, 'Some result', 'Some content');
    } catch (err) {
        console.log(err)
        res.status(500)
        return false
    }
    return true

})

const server = app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
