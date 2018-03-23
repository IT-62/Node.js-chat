'use strict';

const net = require('net');
const socket = new net.Socket();

const readline = require('readline');
let idUser;
let userName;
const friends = [];
const newMess = {};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});

function addFriend(currDialog) {
  if (!friends.includes(currDialog))
    friends.push(currDialog);
}

const commands = {
  register(lines) {
    userName = lines[0];
    commands.cls();
    socket.write(JSON.stringify({ type: 'register', text: lines[0] }));
  },
  private(lines) {
    const text = lines[0];
    const nameUserTo = lines[1];
    socket.write(JSON.stringify({ type: 'privateMessage', text, destinationName: nameUserTo, idUser }));
    addFriend(nameUserTo);
    commands.cls();
    commands.history([nameUserTo]);
  },
  broad(lines) {
    const text = lines[0];
    commands.cls();
    socket.write(JSON.stringify({ text, idUser }));
  },
  exit() {
    socket.end();
    rl.close();
  },
  history(lines) {
    commands.cls();
    socket.write(JSON.stringify({ type: 'history', destinationName: lines[0], idUser }));
  },
  cls() {
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log('userName: ' + (userName || 'none'));
    console.log('Commands: ' + Object.keys(commands).join(', '));
    console.log('Friends: ' + friends.join(', '));
    let newMessString = '';
    for (const userName in newMess) {
      newMessString += userName + '-' + newMess[userName] + '; ';
    }
    console.log('New messages from: ' + newMessString);
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
  else if (result.newMess) {
    if (!newMess[result.nameUserFrom])
      newMess[result.nameUserFrom] = 1;
    else
      newMess[result.nameUserFrom] += 1;
  } else if (result.type === 'history')
    result.messages.forEach((mess) => {
      if (newMess[mess.nameUserFrom])
        delete newMess[mess.nameUserFrom];
      if (!mess.isRead)
        console.log('\x1b[37m', '|', mess.nameUserFrom, '|', mess.text);
      else
        console.log('\x1b[33m', '|', mess.nameUserFrom, '|', mess.text);
    });
  rl.prompt();
});

socket.on('error', (err) => {
  console.dir(err);
});

//todo make messages selectable
//todo make local storage for messages


