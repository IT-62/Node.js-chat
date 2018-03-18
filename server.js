'use strict';

const net = require('net');
const users = [];
const messages = [];

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let message = JSON.parse(data);
        console.log('new connection')
        if(!users.includes(socket)){
            users.push(socket);
        }
        for(let user of users){
            user.write(JSON.stringify(messages.join('\n')))
        }
        messages.push(message);
    });
});

server.listen(2000);
