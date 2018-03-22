'use strict';

const net = require('net');
const mongodb = require('mongodb').MongoClient;
const config = require('../config/db');

const createHash = require('./cipher/cipher');

const online = [];

mongodb.connect(config.url, (err, client) => {
  if (err) throw err;

  const db = client.db('chat');

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

  const addUser = (user, msg) => {
    msg.password = createHash(msg.password);
    db.collection('users').insertOne(msg);
    sendAllMsg(user);
    console.log('Added new user', user.login);
  };

  const sendMsg = (user, msg) => {
    msg.time = new Date();
    msg.sender = user.login;
    db.collection('messages').insertOne(msg);
    for (const usr of online) {
      if (usr === user) continue;
      usr.write(JSON.stringify(buildMsg(msg)));
    }
  };

  const verifyPassword = (correctPassword, password, user) => {
    if (correctPassword === createHash(password)) {
      sendAllMsg(user);
    } else {
      const err = {
        invalidPassword: '\nInvalid password\n'
      };
      user.write(JSON.stringify({ err }));
    }
  };

  const authorization = (user, msg) => {
    user.login = msg.login;
    db.collection('users').findOne({ login: user.login }, (err, res) => {
      if (res) verifyPassword(res.password, msg.password, user);
      else addUser(user, msg);
    });
  };

  const server = net.createServer((user) => {
    online.push(user);
    console.log('New connection');

    user.on('data', (data) => {
      console.log('Received data');
      const msg = JSON.parse(data);
      if (msg.password) authorization(user, msg);
      else sendMsg(user, msg);
    });

    user.on('close', () => {
      console.log(user.login, 'disconnected');
      online.splice(online.indexOf(user), 1);
    });

  });

  server.listen(2020, () => {
    console.log('Listening start...');
  });

  // client.close();
});
