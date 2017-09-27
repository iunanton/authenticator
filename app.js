"use strict";
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
	// show authorization form
  res.sendFile(__dirname + '/index.html');
})

app.post('/', function(req, res) {
	// receive credentials from user
	console.log("%s Got query for new UUID", Date.now());
	// connect to db
	mongo.connect(url, function(err, db) {
		if (err) {
			console.error("%s %s: %s",Date.now(), err.name, err.message);
			return;
		}
		db.collection("users").findOne({ "username": req.body.username }, { "password": 1 }, function (err, r) {
			if (err) {
				console.error("%s %s: %s",Date.now(), err.name, err.message);
				return;
			}
			if (!r) {
				console.log("%s Username or password incorrect", Date.now());
				return;
			}
			bcrypt.compare(req.body.password, r.password, function(err, auth) {
				if (err) {
					console.error("%s %s: %s",Date.now(), err.name, err.message);
					return;
				}
				if (!auth) {
					console.log("%s Username or password incorrect", Date.now());
					return;
				}
				// create user's uuid
				var uuid = uuidv4();
				console.log("%s Created UUID: %s", Date.now(), uuid);
				// update token into db
				//db.collection("users").findOne({ "username": req.body.username }, { "password": 1 }, function (err, r) {
				//});
				res.json({ "uuid": uuid });
			});
		})
	});
});

// app.use(express.static(__dirname + '/public'));

const server = http.createServer(app);

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});
