'use strict';

const net = require('net');

const readline = require('readline');

const name = 'Nikita';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const socket = new net.Socket();


socket.connect({
  port: 2000,
  host: '169.254.15.163',
},() => {
  socket.write(JSON.stringify(name));
});

socket.on('data', (data) => {
  let result = JSON.parse(data);
  console.clear();
  console.log(result);
})
rl.on('line', (input) => {
  let message = `${name} : ${input}`
  input === 'end' ? rl.close() : socket.write(JSON.stringify(message));
});
