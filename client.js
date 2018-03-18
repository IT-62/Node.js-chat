'use strict';

const net = require('net');

const readline = require('readline');

const name = 'Nikita';

const rl = readline.createInterface( {
  input: process.stdin,
  output: process.stdout
});

const socket = new net.Socket();
let message;

socket.connect({
  port: 2000,
  host: '127.0.0.1',
},() => {
  socket.write(JSON.stringify(name));
  socket.on('data', (data) => {
      let result = JSON.parse(data);
      console.clear();
      console.log(result);
  })
});

  rl.question('>', (answer) =>{
    message === 'end' ? rl.close() : socket.write(JSON.stringify(answer));
  });