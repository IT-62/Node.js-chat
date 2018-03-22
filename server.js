'use strict';

const net = require('net');
const mongodb = require('mongodb').MongoClient;
const config = require('./config/db');

const createHash = require('./cipher/cipher');

const online = [];

mongodb.connect(config.url, (err, client) => {
  if (err) throw err;

  const db = client.db('chat');

  const sendAllMsg = user => {
    db.collection('messages')
      .find({})
      .toArray((err, res) => {
        if (err) throw err;
        if (res.length) {
          let msg;
          res.forEach((data) => {
            const date = data.time;
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            msg += `\n${data.sender}: ${data.msg}\n(${hours}:${minutes}:${seconds})\n`;
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
    for (const usero of online) {
      if (usero === user) continue;
      const date = msg.time;
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      usero.write(JSON.stringify(
        `${msg.sender}: ${msg.msg}\n(${hours}:${minutes}:${seconds})`
      ));
    }
  };

  const authorization = (user, msg) => {
    user.login = msg.login;
    db.collection('users').findOne({ login: user.login }, (err, res) => {
      if (res) sendAllMsg(user);
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
      online.splice(online.indexOf(user), 1);
    });

  });

  server.listen(2020, () => {
    console.log('Listening start...');
  });

  // client.close();
});
