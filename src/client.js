'use strict';

const net = require('net');
const readline = require('readline');
const server = require('../config/server');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const user = new net.Socket();

const showLoginForm = () => {
  let login, password;
  rl.question('Login: ', (answer) => {
    login = answer.trim().toLowerCase();
    rl.question('Password: ', (answer) => {
      password = answer;
      user.write(JSON.stringify({ login, password }));
    });
  });
};

const parseError = (err) => {
  if (err.invalidPassword) console.log(err.invalidPassword);
  else if (err.userOnline) console.log(err.userOnline);
  showLoginForm();
};

user.connect(server, () => {
  showLoginForm();
  rl.on('line', (input) => {
    const msg = input;
    user.write(JSON.stringify({ msg }));
  });
});

user.on('data', (data) => {
  const message = JSON.parse(data);
  if (!message.err) console.log(`\n${message}\n`);
  else parseError(message.err);
});
