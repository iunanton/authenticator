const uuidv4 = require('uuid/v4');
// uuidv4();

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
//const url = require('url');
const app = express();
const bcrypt = require('bcrypt');
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://mongo:27017/chat';

var port = process.env.PORT || 80;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.route('/')
.get(function(req, res) {
  res.sendFile(__dirname + '/index.html');
})

app.post('/', function(req, res) {
    console.log("%s %s", Date.now(), JSON.stringify(req.body));
    res.json({ "uuid": uuidv4() });
});

// app.use(express.static(__dirname + '/public'));

const server = http.createServer(app);

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});
