'use strict';

const net = require('net');

//let message = '';

const socket = new net.Socket();

socket.connect({
  port: 2000,
  host: '10.241.129.31',
}, () => {
  socket.write(JSON.stringify('Hello from Nikita'));
  socket.on('data', (data) => {
      let result = JSON.parse(data);
      console.log(result)
  })
});
