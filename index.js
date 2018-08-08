/*

// dependencies
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 443;

app.use(bodyParser.json());

// receive POST request at /
app.post('/', function(request, response) {
    // verify signature and cert

    // handle request
    if (request.body.request.type === "LaunchRequest") {
        
    }
    else if (request.body.request.type === "SessionEndedRequest") {

    }
    // Intent Request
    else {
        switch (request.body.request.intent.name) {
            case "AMAZON.HelpIntent":
                break;
            case "AMAZON.StopIntent":
                break;
            case "AMAZON.CancelIntent":
                break;
            case "AMAZON.FallbackIntent":
                break;
            
        }
    }
} )

// set the server to listen on port
app.listen(port, () => console.log('Listening on port ' + port));

*/

require('dotenv').config();
var express = require('express');
var app = express();
var sql = require('mssql');

app.get('/', function (req, res) {

    const config = {
        user: process.env.user,
        password: process.env.password,
        server: process.env.server,
        database: process.env.database
    };

    const pool = new sql.ConnectionPool(config, err => {
        if (err) console.log(err);

        pool.request()
        .query('select * from ##TempTable', function (err, recordset) {
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

            res.send(recordset)
        })
    })

    pool.on('error', err => {
        console.log(err)
    })
    
});

var server = app.listen(5000, function() {
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
