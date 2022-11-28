const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));


const EE = require("events").EventEmitter;
const messageEmitter = new EE();


var server = http.createServer(app);
var wss = new WebSocket.Server({ server });
let count  = 0;

server.listen(8181, function listening() {
    console.log('Listening on %d', server.address().port);
});

wss.on('connection', function connection(ws, req) {
    var location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    console.log("new client connected");

    let instance = count++;
    const callback = (message) => {
        console.log("in callback: message="+message.data);
        ws.send(message.data);
        console.log("sending to client....%s", instance);
    }

    messageEmitter.on('newmessage',callback);


    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        messageEmitter.emit('newmessage',{data: JSON.parse(message).message});
    });

    ws.on('close', function close() {
        console.log('socket closed for client %s', instance);
        messageEmitter.off('newmessage',callback);
    })


});

app.listen(3000);