'use strict';

//messageUser: {nameUserFrom, text}
//message: {type:'', text:'', destinationName='', idUser:''};
//types: ['register', 'private', 'room', 'broadcast', 'history'];;
//users: {token: '', User: {}}

const net = require('net');
let server;

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'chatNode'
});

const QUERY_CREATE_TABLE_USERS = 'CREATE TABLE users (' +
    'id VARCHAR(50) NOT NULL,' +
    'name VARCHAR(50) NOT NULL,' +
    'PRIMARY KEY(id));';

const QUERY_CREATE_TABLE_MESSAGES = 'CREATE TABLE messages (' +
    'id VARCHAR(50) NOT NULL,' +
    'text VARCHAR(250) NOT NULL,' +
    'idUserFrom VARCHAR(50) NOT NULL,' +
    'idUserTo VARCHAR(50),' +
    'PRIMARY KEY(id),' +
    'FOREIGN KEY (idUserFrom) REFERENCES users(id),' +
    'FOREIGN KEY (idUserTo) REFERENCES users(id));';

connection.connect((err) => {
  if (err)
    return log(err, 'error');

  connection.query(QUERY_CREATE_TABLE_USERS, (err) => {
    if (err)
      return log(err, 'error');
    connection.query(QUERY_CREATE_TABLE_MESSAGES, (err) => {
      if (err)
        return log(err, 'error');

      server = createServer();
      server.on('connection', () => {
        log('connected user', 'connection');
      });

      server.listen(2000);

    });
  });
});

const sockets = {};

//Generate token
//n = token.lengh

function generateToken(n) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < n; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

//User

const User = function(message, socket) {
  this.id = generateToken(15);
  this.name = message.text.trim();
  sockets[this.id] = socket;
  connection.query('INSERT INTO users (id, name) VALUES ("' + this.id + '", "' + this.name + '")', (err) => {
    if (err)
      log(err, 'error');
  });
  return this;
};

User.findUserByName = (name, callback) => connection.query('SELECT * FROM users u WHERE name = ?', [name], (err, result) => {
  if (err)
    log(err, 'error');
  if (result.length)
    callback(result[0]);
});
User.findById = (id, callback) => connection.query('SELECT * FROM users u WHERE id = ?', [id], (err, result) => {
  if (err)
    log(err, 'error');
  if (result.length)
    callback(result[0]);
});
User.getAllUsers = (callback) => connection.query('SELECT * FROM users;', (err, result) => {
  if (err)
    log(err, 'error');
  if (result.length)
    callback(result);
});

//Message

const Message = function(idUserTo, idUserFrom, text) {
  this.idUserTo = idUserTo;
  this.idUserFrom = idUserFrom;
  this.text = text;
  this.date = new Date().toISOString();
  connection.query('INSERT INTO messages (text, idUserTo, idUserFrom, date) VALUES ("' + this.text + '", "' +  this.idUserTo + '", "' + this.idUserFrom + '")', (err) => {
    if (err)
      log(err, 'error');
  });
  return this;
};

Message.findDialog = (idUser1, idUser2, callback) => connection.query('SELECT * FROM messages WHERE (idUserFrom = ? AND idUserTo = ?) OR (idUserFrom = ? AND idUserTo = ?)', [idUser1, idUser2, idUser2, idUser1], (err, result) => {
  if (err)
    return log(err, 'error');
  callback(result);
});

// Logs

const date = new Date().toISOString();
const log = (...params) => {
  console.log(date, ...params);
};

//Server

function createServer() {
  return net.createServer((socket) => {

    socket.on('data', (data) => {
      const message = JSON.parse(data);
      let user;

      //Register
      if (message.type === 'register') {
        user = new User(message, socket);
        log('registered:', user.name);
        return socket.write(JSON.stringify({ token: user.id }));
      }

      if (message.type === 'privateMessage') {
        User.findById(message.idUser, (userFrom) => {
          User.findUserByName(message.destinationName, (userTo) => {
            new Message(userTo.id, userFrom.id, message.text);
            log(userFrom.name, userTo.name, message.text, 'private-message');
            sockets[userTo.id].write(JSON.stringify({ messages: [{ nameUserFrom: userFrom.name, text: message.text }] }));
          });
        });
      } else if (message.type === 'history') {
        User.findById(message.idUser, (userFrom) => {
          User.findUserByName(message.destinationName, (userTo) => {
            Message.findDialog(userFrom.id, userTo.id, (dialog) => {
              sockets[userTo.id].write(JSON.stringify({ messages: dialog }));
            });
          });
        });
      } else if (!message.type) {
        User.findById(message.idUser, (userFrom) => {
          User.getAllUsers((users) => {
            users.forEach((userTo) => {
              new Message(userTo.id, '\\todo', message.text);
              sockets[userTo.id].write(JSON.stringify({ messages: [{ nameUserFrom: userFrom.name, text: message.text }] }));
            });
          });
        });
      }

    });
  });
}
