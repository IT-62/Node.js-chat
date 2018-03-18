'use strict';

const net = require('net');

//let message = '';

const socket = new net.Socket();

socket.connect({
  port: 2000,
  host: '10.42.0.20',
}, () => {
  socket.write(JSON.stringify('Hello from new user!'));
  socket.on('data', (data) => {
    const result = JSON.parse(data);
    console.log(result);
  });
});
