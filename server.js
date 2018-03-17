'use strict'

const net = require('net');
const users = [];
const messages = [];

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let message = JSON.parse(data);
        console.log('new connection')
        if(!users.includes(socket)){
            let history = messages.join('\n');
            users.push(socket);
            socket.write(JSON.stringify(history))
        }
        for(let user of users){
            user.write(data)
        }
        messages.push(message);
    })
})

server.listen(2000);