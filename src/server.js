'use strict';

const net = require('net');
const mongodb = require('mongodb').MongoClient;
const configDb = require('../config/db');
const configServer = require('../config/server');

const createHash = require('./cipher/cipher');

const online = [];

mongodb.connect(configDb.url, (err, client) => {
  if (err) throw err;

  const db = client.db('chat');

  const generateError = (err, user) => user.write(JSON.stringify({ err }));

  const buildMsg = data => {
    const date = data.time;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `\n${data.sender}: ${data.msg}\n(${hours}:${minutes}:${seconds})\n`;
  };

  const sendAllMsg = user => {
    db.collection('messages')
      .find({})
      .toArray((err, res) => {
        if (err) throw err;
        if (res.length) {
          let msg;
          res.forEach((data) => {
            msg += buildMsg(data);
          });
          user.write(JSON.stringify(msg));
        } else {
          user.write(JSON.stringify('no messages yet'));
        }
      });
  };

  const addUser = (user, login, password) => {
    password = createHash(password);
    db.collection('users').insertOne({ login, password });
    sendAllMsg(user);
    console.log('Added new user', user.login);
  };

  const sendMsg = (user, msg) => {
    msg.time = new Date();
    msg.sender = user.login;
    db.collection('messages').insertOne(msg);
    for (const userOnline of online) {
      if (userOnline === user) continue;
      userOnline.write(JSON.stringify(buildMsg(msg)));
    }
  };

  const verifyPassword = (correctPassword, password, user) => {
    if (correctPassword === createHash(password)) sendAllMsg(user);
    else generateError('Invalid password', user);
  };

  const authorization = (user, login, password) => {
    if (online.find(x => x.login === login)) {
      generateError('User already online', user);
      return;
    }
    user.login = login;
    db.collection('users').findOne({ login: user.login }, (err, res) => {
      if (res) verifyPassword(res.password, password, user);
      else addUser(user, login, password);
    });
  };

  const server = net.createServer((user) => {
    online.push(user);
    console.log('New connection');

    user.on('data', (data) => {
      const msg = JSON.parse(data);
      if (msg.password) authorization(user, msg.login, msg.password);
      else sendMsg(user, msg);
    });

    user.on('close', () => {
      console.log(user.login, 'disconnected');
      online.splice(online.indexOf(user), 1);
    });

  });

  server.listen(configServer.port, () => {
    console.log('Listening start...');
  });

});
