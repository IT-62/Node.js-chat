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

const handleError = (err) => {
  console.log(`\n${err}\n`);
  showLoginForm();
};

user.connect(server, () => {
  showLoginForm();
  rl.on('line', (input) => {
    user.write(JSON.stringify({ input }));
  });
});

user.on('data', (data) => {
  const message = JSON.parse(data);
  if (!message.err) console.log(`\n${message}\n`);
  else handleError(message.err);
});
