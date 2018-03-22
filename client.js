'use strict';

const net = require('net');
const socket = new net.Socket();

const readline = require('readline');
let idUser;
let userName;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});

const commands = {
  register(lines) {
    userName = lines[0];
    commands.cls();
    socket.write(JSON.stringify({ type: 'register', text: lines[0] }));
  },
  private(lines) {
    socket.write(JSON.stringify({ type: 'privateMessage', text: lines[0], destinationName: lines[1], idUser }));
  },
  broad(lines) {
    socket.write(JSON.stringify({ text: lines[0], idUser }));
  },
  exit() {
    socket.end();
    rl.close();
  },
  history(lines) {
    socket.write(JSON.stringify({ type: 'history', destinationName: lines[0], idUser }));
  },
  cls() {
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log('userName: ' + (userName || 'none'));
    console.log('Commands: ' + Object.keys(commands).join(', '));
  }
};
commands.cls();

rl.on('line', (line) => {
  const lines = line.trim().split(' - ');
  const command = commands[lines[0]];
  lines.shift();
  if (command) command(lines);
  else console.log('Unknown command');
  rl.prompt();
}).on('close', () => {
  console.log('Bye!');
  process.exit(0);
});

function log(err) {
  console.dir(err);
}

socket.connect({
  port: 2000,
  host: '127.0.0.1',
}, () => {
  rl.prompt();
});

socket.on('data', (data) => {
  const result = JSON.parse(data);
  if (result.token)
    idUser = result.token;
  else if (result.err)
    log(result.err);
  else if (result.messages) {
    result.messages.forEach((mess) => {
      console.log('\n|', mess.nameUserFrom, '|', mess.text);
    });
    rl.prompt();
  }
});

socket.on('error', (err) => {
  console.dir(err);
});


