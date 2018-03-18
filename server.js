'use strict';

const net = require('net');
const users = [];
const messages = [];

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const message = JSON.parse(data);
    console.log('new connection with' + message);
    if (!users.includes(socket)) {
      // let history = messages.join('\n');
      users.push(socket);
      // socket.write(JSON.stringify(history))
    }
    messages.push(message);
    for (const user of users) {
      user.write(JSON.stringify(messages));
    }
  });
});

server.listen(2000);
