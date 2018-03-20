'use strict';

const net = require('net');
const readline = require('readline');

let username;
let user;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = net.createConnection({
  host: '127.0.0.1',
  port: 2000
}, () => {
  rl.question('Set username: ', (answer) => {
    username = answer;
    user = {
      type: 'setName',
      message: username
    };
    client.write(JSON.stringify(user));
    rl.pause();
  });
});

client.on('data', (data) => {
  rl.resume();
  const result = JSON.parse(data);
  console.clear();
  console.log(result);
});

rl.on('line', (input) => {
  user = {
    name: username,
    type: 'message',
    message: input
  };
  input === 'end' ? client.destroy() :
    client.write(JSON.stringify(user));
  rl.pause();
});
