//DRAFT FILE
'use strict'

const net = require('net');
const users = [];
const messages = [];
let userMsg;

const getUser = (name) => {
    let count = -1;
    for(let i = 0; i < users.length; i++){
        if(users[i]['name'] === name) count = i;
        }
    return count;
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let userData = JSON.parse(data);
        let userMsg = `${userData['name'] || 'new user'} : ${userData['message']}`;
        messages.push(userMsg);
        let history = messages.join('\n');
        if(userData['type'] === 'setName'){
            users.push({
                name: userData['message'],
                socket: socket
            });
            socket.write(JSON.stringify(history));
        } else if(userData['type'] === 'message'){
            let userInd = getUser(userData['name']);
            users[userInd]['message'] = userData['message'];
        }
        for(let user of users){
            if(getUser(userData['name']) != -1) user.socket.write(JSON.stringify(history));
        }
        
    });
    
});

server.on('connection', (data) => {
    console.log('New connection')
});

server.listen(2000);
