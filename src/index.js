import "babel-polyfill";

const express = require('express');
const app = express();

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
    try {
        Verify.certificateURL(req.headers.signaturecertchainurl)
        Verify.timestamp(req.body.request.timestamp)
        Verify.signature(req.headers.signaturecertchainurl, req.headers.signature, req.rawBody)
    } catch (e) {
        console.log(e)
    }
})

const server = app.listen(port, () => {
    console.log('Server is running on port ' + port);
});


