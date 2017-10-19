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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/')
.get(function(req, res) {
	res.sendFile(__dirname + '/index.html');
})
.post(function(req, res) {
	var grant_type = req.body.grant_type;
	console.log("%s grant_type: %s", Date.now(), grant_type);
	switch(grant_type) {
		case "temporary":
			var username = req.body.username.trim();
			var code = req.body.code.trim();
			if (username.length < 4) {
				sendError(res, "invalid_grant", "This username is too short");
				return;
			}
			mongo.connect(url, function(err, db) {
				db.collection("codes").findOne({ "value": code }, function (err, docs) {
					if (!docs) {
						sendError(res, "invalid_grant", "This code is incorrect");
						return;
					}
					db.collection("users").findOne({ "username": username }, { "isGuest": 1, "isOnline": 1}, function (err, user) {
						if (!user) {
							var token = uuidv4();
							var user = { "isGuest": true, "isDeleted": false, "isOnline": false, "username": username, "tokens": [ token ] };
							db.collection("users").insertOne( user, function(err, r) {
								sendToken(res, token);
							});
							return;
						}
						if (user.isGuest && !user.isOnline) {
							var token = uuidv4();
							db.collection("users").updateOne({ "username": username }, { $set: { "tokens" : [ token ] } }, function (err, r) {
								sendToken(res, token);
							});
							return;
						}
						sendError(res, "invalid_grant", "Username is already in use");
					});
				});
			});
			break;
		case "password":
			var username = req.body.username.trim();
			var password = req.body.password.trim();
			if (username.length < 4) {
				sendError(res, "invalid_grant", "This username is too short");
				return;
			}
			if (password.length < 4) {
				sendError(res, "invalid_grant", "This password is too short");
				return;
			}
			mongo.connect(url, function(err, db) {
				db.collection("users").findOne({ "username": username }, { "password": 1 }, function (err, user) {
					if (!user) {
						sendError(res, "invalid_grant", "Username or password incorrect");
						return;
					}
					bcrypt.compare(password, user.password, function(err, auth) {
						if (!auth) {
							sendError(res, "invalid_grant", "Username or password incorrect");
							return;
						}
							var token = uuidv4();
						db.collection("users").updateOne({ "username": username }, { $push: { "tokens" : token } }, function (err, r) {
							sendToken(res, token);
						});
					});
				});
			});
			break;
		case "permanent":
			var username = req.body.username.trim();
			var code = req.body.code.trim();
			var password = req.body.password.trim();
			if (username.length < 4) {
				sendError(res, "invalid_grant", "This username is too short");
				return;
			}
			if (password.length < 4) {
				sendError(res, "invalid_grant", "This password is too short");
				return;
			}
			mongo.connect(url, function(err, db) {
				db.collection("codes").findOne({ "value": code }, function (err, docs) {
					if (!docs) {
						sendError(res, "invalid_grant", "This code is incorrect");
						return;
					}
					db.collection("users").findOne({ "username": username }, function (err, user) {
						if (!user) {
							bcrypt.hash(password, 12, function(err, hash) {
								var token = uuidv4();
								var user = { "isGuest": false, "isDeleted": false, "isOnline": false, "username": username, "tokens": [ token ], "password": hash };
								db.collection("users").insertOne( user, function(err, r) {
									sendToken(res, token);
								});
							});
							return;
						}
						sendError(res, "invalid_grant", "Username is already in use");
					});
				});
			});
			break;
		default: sendError(res, "unsupported_grant_type");
			break;
	}
});

function sendToken(response, token) {
	response.setHeader("Cache-Control", "no-store");
	response.setHeader("Pragma", "no-cache");
	response.json({ "access_token": token, "token_type": "bearer" });
}

function sendError(response, error, description) {
	console.log("%s error: %s", Date.now(), error);
	response.status(400);
	response.setHeader("Cache-Control", "no-store");
	response.setHeader("Pragma", "no-cache");
	response.json({ "error": error, "error_description" : description });
}

const server = http.createServer(app);

server.listen(port, function listening() {
  console.log('%s Listening on %d', Date.now(), server.address().port);
});
