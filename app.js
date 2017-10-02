"use strict";
const uuidv4 = require('uuid/v4');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const app = express();
const bcrypt = require('bcrypt');
var mongo = require('mongodb').MongoClient;
var url = 'mongodb://mongo:27017/chat';

var port = process.env.PORT || 80;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.route('/')
.get(function(req, res) {
	// show authorization form
  res.sendFile(__dirname + '/index.html');
})
.post(function(req, res) {
	// receive credentials from user
	console.log("%s Got request for new UUID", Date.now());
	// check grant_type
	if (req.body.grant_type !== "password") {
		console.log("%s error: unsupported_grant_type", Date.now());
		res.status(400);
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("Pragma", "no-cache");
		res.json({ "error": "unsupported_grant_type" });
		return;
	}
	var username = req.body.username;
	var password = req.body.password;
	// console.log("%s %s %s", Date.now(), req.body.username, req.body.password);
	// connect to db
	mongo.connect(url, function(err, db) {
		if (err) {
			console.error("%s %s: %s", Date.now(), err.name, err.message);
			res.status(400);
			res.setHeader("Cache-Control", "no-store");
			res.setHeader("Pragma", "no-cache");
			res.json({ "error": err.message });
			return;
		}
		db.collection("users").findOne({ "username": username }, { "password": 1 }, function (err, r) {
			if (err) {
				console.error("%s %s: %s", Date.now(), err.name, err.message);
				res.status(400);
				res.setHeader("Cache-Control", "no-store");
				res.setHeader("Pragma", "no-cache");
				res.json({ "error": err.message });
				return;
			}
			if (!r) {
				console.log("%s error: invalid_grant", Date.now());
				res.status(400);
				res.setHeader("Cache-Control", "no-store");
				res.setHeader("Pragma", "no-cache");
				res.json({ "error": "invalid_grant" });
				return;
			}
			bcrypt.compare(password, r.password, function(err, auth) {
				if (err) {
					console.error("%s %s: %s", Date.now(), err.name, err.message);
					res.status(400);
					res.setHeader("Cache-Control", "no-store");
					res.setHeader("Pragma", "no-cache");
					res.json({ "error": err.message });
					return;
				}
				if (!auth) {
					console.log("%s error: invalid_grant", Date.now());
					res.status(400);
					res.setHeader("Cache-Control", "no-store");
					res.setHeader("Pragma", "no-cache");
					res.json({ "error": "invalid_grant" });
					return;
				}
				// create user's uuid
				var uuid = uuidv4();
				console.log("%s Created UUID: %s", Date.now(), uuid);
				// update token into db
				db.collection("users").updateOne({ "username": req.body.username }, { $set: { "userUuid" : uuid } }, function (err, r) {
					if (err) {
						console.error("%s %s: %s", Date.now(), err.name, err.message);
						res.status(400);
						res.setHeader("Cache-Control", "no-store");
						res.setHeader("Pragma", "no-cache");
						res.json({ "error": err.message });
						return;
					}
					// send token back
					res.setHeader("Cache-Control", "no-store");
					res.setHeader("Pragma", "no-cache");
					res.json({ "access_token": uuid, "token_type": "bearer", "expires_in": 3600 });
				});
			});
		})
	});
});

const server = http.createServer(app);

server.listen(port, function listening() {
  console.log('$s Listening on %d', Date.now(), server.address().port);
});
