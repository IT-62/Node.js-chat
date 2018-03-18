'use strict';

const net = require('net');

const readline = require('readline');

const name = 'alex';

const rl = readline.createInterface( {
  input: process.stdin,
  output: process.stdout;
});

const socket = new net.Socket();
let message = "";

socket.connect({
  port: 2000,
  host: '10.42.0.20',
},() => {
  socket.write(JSON.stringify(name));
  socket.on('data', (data) => {
      let result = JSON.parse(data);
      console.clear();
      console.log(result);
  })
});

  rl.question('>', (answer) =>{
    if(message == 'end'){
      rl.close();
    }
     else{
       message = answer;
       socket.write(JSON.stringify(message));
     }

  });
