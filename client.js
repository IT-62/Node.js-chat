'use strict';

const net = require('net');
const socket = new net.Socket();

const readline = require('readline');
const user = { idUser: '', userName: '' };
const friends = [];
const newMess = {};
let dialog = { userNameTo: null, messages: [] };

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
    user.userName = lines[0];
    commands.cls();
    socket.write(JSON.stringify({ type: 'register', text: lines[0] }));
  },
  private(lines) {
    if (!dialog.userNameTo)
      return console.log('Start dialog first');
    const text = lines[0];
    socket.write(JSON.stringify({ type: 'privateMessage', text, destinationName: dialog.userNameTo, idUser: user.idUser }));
    dialog.messages.push({ nameUserFrom: user.userName, text });
    updateMess();
  },
  broad(lines) {
    const text = lines[0];
    commands.cls();
    socket.write(JSON.stringify({ text, idUser: user.idUser }));
  },
  exit() {
    socket.end();
    rl.close();
  },
  talkTo(lines) {
    dialog =  { userNameTo: null, messages: [] };
    dialog.userNameTo = lines[0];
    addFriend(lines[0]);
    commands.cls();
    socket.write(JSON.stringify({ type: 'history', destinationName: lines[0], idUser: user.idUser }));
  },
  cls() {
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log('userName: ' + (user.userName || 'none'));
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

function updateMess() {
  commands.cls();
  if (dialog.messages)
    dialog.messages.forEach((mess) => {
      console.log('|', mess.nameUserFrom, '|', mess.text);
    });
}

function addNewMessPopup(result) {
  if (!newMess[result.nameUserFrom])
    newMess[result.nameUserFrom] = 1;
  else
    newMess[result.nameUserFrom] += 1;
}

socket.on('data', (data) => {
  const result = JSON.parse(data);
  if (result.token)
    user.idUser = result.token;
  else if (result.err)
    log(result.err);
  else if (result.nameUserFrom) {
    if (!dialog.userNameTo || result.nameUserFrom !== dialog.userNameTo)
      addNewMessPopup(result);
    if (dialog.userNameTo && dialog.userNameTo === result.nameUserFrom)
      dialog.messages.push({ nameUserFrom: result.nameUserFrom, text: result.text });
    updateMess();
  } else if (result.type === 'history') {
    result.messages.forEach((mess) => {
      if (newMess[mess.nameUserFrom])
        delete newMess[mess.nameUserFrom];
      dialog.messages.push({ nameUserFrom: mess.nameUserFrom, text: mess.text });
    });
    updateMess();
  }
  rl.prompt();
});

socket.on('error', (err) => {
  console.dir(err);
});



