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
		case "guest":
			var username = req.body.username;
			var code = req.body.code;
			mongo.connect(url, function(err, db) {
				db.collection("codes").findOne({ "value": code }, function (err, docs) {
					if (!docs) {
						console.log("%s error: invalid_grant", Date.now());
						res.status(400);
						res.setHeader("Cache-Control", "no-store");
						res.setHeader("Pragma", "no-cache");
						res.json({ "error": "invalid_grant", "error_description": "Code incorrect" });
						return;
					}
					db.collection("users").findOne({ "username": username }, { "isGuest": 1, "isOnline": 1}, function (err, docs) {
						if (!docs) {
							var token = uuidv4();
							var user = { "isGuest": true, "isDeleted": false, "isOnline": false, "username": username, "tokens": [ token ] };
							db.collection("users").insertOne( user, function(err, r) {
								res.setHeader("Cache-Control", "no-store");
								res.setHeader("Pragma", "no-cache");
								res.json({ "access_token": token, "token_type": "bearer" });
							});
						} else {
							if (docs.isOnline) {
								console.log("%s error: invalid_grant", Date.now());
								res.status(400);
								res.setHeader("Cache-Control", "no-store");
								res.setHeader("Pragma", "no-cache");
								res.json({ "error": "invalid_grant", "error_description": "Username is already in use" });
								return;
							}
							var token = uuidv4();
							db.collection("users").updateOne({ "username": username }, { $set: { "tokens" : [ token ] } }, function (err, r) {
								res.setHeader("Cache-Control", "no-store");
								res.setHeader("Pragma", "no-cache");
								res.json({ "access_token": token, "token_type": "bearer" });
							});
						}
					});
				});
			});
			break;
		case "password":
			var username = req.body.username;
			var password = req.body.password;
			mongo.connect(url, function(err, db) {
				if (err) {
					console.error("%s %s: %s", Date.now(), err.name, err.message);
					res.status(400);
					res.setHeader("Cache-Control", "no-store");
					res.setHeader("Pragma", "no-cache");
					res.json({ "error": err.message });
					return;
				}
				db.collection("users").findOne({ "username": username }, { "password": 1 }, function (err, user) {
					if (err) {
						console.error("%s %s: %s", Date.now(), err.name, err.message);
						res.status(400);
						res.setHeader("Cache-Control", "no-store");
						res.setHeader("Pragma", "no-cache");
						res.json({ "error": err.message });
						return;
					}
					if (!user) {
						console.log("%s error: invalid_grant", Date.now());
						res.status(400);
						res.setHeader("Cache-Control", "no-store");
						res.setHeader("Pragma", "no-cache");
						res.json({ "error": "invalid_grant", "error_description": "Username or password incorrect" });
						return;
					}
					bcrypt.compare(password, user.password, function(err, auth) {
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
							res.json({ "error": "invalid_grant", "error_description": "Username or password incorrect" });
							return;
						}
						var token = uuidv4();
						db.collection("users").updateOne({ "username": username }, { $push: { "tokens" : token } }, function (err, r) {
							if (err) {
								console.error("%s %s: %s", Date.now(), err.name, err.message);
								res.status(400);
								res.setHeader("Cache-Control", "no-store");
								res.setHeader("Pragma", "no-cache");
								res.json({ "error": err.message });
								return;
							}
							res.setHeader("Cache-Control", "no-store");
							res.setHeader("Pragma", "no-cache");
							res.json({ "access_token": token, "token_type": "bearer" });
						});
					});
				})
			});
			break;
		default: console.log("%s error: unsupported_grant_type", Date.now());
			res.status(400);
			res.setHeader("Cache-Control", "no-store");
			res.setHeader("Pragma", "no-cache");
			res.json({ "error": "unsupported_grant_type" });
			break;
	}
});

const server = http.createServer(app);

server.listen(port, function listening() {
  console.log('%s Listening on %d', Date.now(), server.address().port);
});
