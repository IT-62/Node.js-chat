'use strict';

const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const user = net.createConnection(2020, () => {
  let login, password;

  rl.question('Login: ', (answer) => {
    login = answer;
    rl.question('Password: ', (answer) => {
      password = answer;
      user.write(JSON.stringify({ login, password }));
    });
  });

  rl.on('line', (input) => {
    const msg = input;
    user.write(JSON.stringify({ msg }));
  });

});

user.on('data', (data) => {
  const message = JSON.parse(data);
  console.log(`\n${message}\n`);
});
