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
    // send json response to Alexa
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

    // prompt user for slot value
    function elicitSlot(intentName, slotName) {
        var textMsg = "Default value"
        if (intentName = "NumRecordsIntent") {
            textMsg = "What level or category are you interested in?"
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
                directives: [
                    {
                        type: "Dialog.ElicitSlot",
                        slotToElicit: slotName
                    }
                ]
            }
        })
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
    instructions = "Welcome to <skill name>. You can fetch information with the following commands: get record, get number of records, and get most recent record. " +
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
    
    var query = ""
    shouldEnd = false
    message = "I'm not sure I understand. Please say a valid command or repeat yourself."
    titleText = "Skill Fallback"
    contentText = "Unknown command. Please say a valid command or repeat if valid."

    switch (req.body.request.intent.name) {
        case 'GetRecordIntent':
            query = "select top 1 * from ##TempTable"
            break;
        case 'NumRecordsIntent':
            var slotType = req.body.request.intent.slots.Type.value
            if (slotType == null) {
                query = "select top 1 * from ##TempTable"
            }
            // handle level types
            else if (slotType.toLowerCase() == "warning" || slotType.toLowerCase() == "critical" || slotType.toLowerCase() == "15-critical" || slotType.toLowerCase() == "11-warning"){
                if (slotType.toLowerCase() == "warning") {
                    slotType = "11-warning"
                }
                else if (slotType.toLowerCase() == "critical") {
                    slotType = "15-critical"
                }
                query = "select * from ##TempTable where level='" + slotType + "'"
            }
            // handle category types
            else if (slotType.toLowerCase() == "process" || slotType.toLowerCase() == "instrument") {
                query = "select * from ##TempTable where category='" + slotType + "'"
            }
            else if (slotType.toLowerCase() == "all") {
                query = "select * from ##TempTable"
            }
            else {
                sendResult(200, "Error. Invalid type received. Please relaunch the skill.", "Title Text", "Content Text", true)
                return false;
            }
            break;
        case 'GetMostRecentRecordIntent':
            query = "select top 1 * from ##TempTable Order By occurDate Desc, occurTime Desc"
            break;
        case 'AMAZON.HelpIntent':
            query = ""
            shouldEnd = false
            message = instructions
            titleText = "Skill Help Information"
            contentText = message
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.StopIntent':
            query = ""
            shouldEnd = true;
            message = "Skill stopped. Shutting down."
            titleText = "Skill Operation Stopped"
            contentText = "Skill operation stopped. Please relaunch if you want to continue."
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.CancelIntent':
            query = ""
            shouldEnd = false;
            message = "Skill operation cancelled. Please say another command to continue or 'stop' to exit."
            titleText = "Skill Operation Cancelled"
            contentText = message
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        case 'AMAZON.FallbackIntent':
            query = ""
            shouldEnd = false
            message = "I'm not sure I understand. Please say a valid command or repeat yourself."
            titleText = "Skill Fallback"
            contentText = "Unknown command. Please say a valid command or repeat if valid."
            sendResult(200, message, titleText, contentText, shouldEnd)
            return true
        default:
            query = ""
            statusCode = 500;
            shouldEnd = true;
            res.status(500)
            return false;
    }

    try {
        var msg
        shouldEnd = false
        const pool = new sql.ConnectionPool(config)
        await pool.connect()
        const result = await pool.request().query(query)
        switch (req.body.request.intent.name) {
            case 'GetRecordIntent':
                msg = "The top alarm occurred on " + result.recordset[0].occurDate + " at " + result.recordset[0].occurTime + " and has a description of " + result.recordset[0].description 
                        + " and a level of " + result.recordset[0].level
                sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);
                break;
            case 'NumRecordsIntent':
                var slotType = req.body.request.intent.slots.Type.value
                if (slotType == null) {
                    elicitSlot("NumRecordsIntent", "Type")
                }
                else {
                    if (slotType.toLowerCase() == "warning" || slotType.toLowerCase() == "11-warning" || slotType.toLowerCase() == "critical" || slotType.toLowerCase() == "15-critical") {
                        msg = "There are " + result.recordset.length + " records with a level of " + slotType
                    }
                    else if (slotType.toLowerCase() == "process" || slotType.toLowerCase() == "instrument") {
                        msg = "There are " + result.recordset.length + " records with a category of " + slotType
                    }
                    else if (slotType.toLowerCase() == "all") {
                        msg = "There are currently " + result.recordset.length + " total active and unacknowledged records"
                    }
                    sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);
                }
                break;
            case 'GetMostRecentRecordIntent':
                msg = "The most recent alarm was a " + result.recordset[0].Category + " alarm with level " + result.recordset[0].level + " and occurred on " + result.recordset[0].occurDate 
                + " at " + result.recordset[0].occurTime + " with description " + result.recordset[0].description 
                sendResult(200, msg, 'Title Text', 'Content Text', shouldEnd);        
            default:
                msg = "I'm not sure I understand. Please say a valid command or repeat yourself."
                throw "Invalid query"
        }
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
