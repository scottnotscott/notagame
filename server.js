const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const activeUsers = [];
const parsedactiveUsers = JSON.stringify(activeUsers)
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const officerHelpBot = 'Officer Helpbot ';
const commandBot = 'Command Bot ';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
     activeUsers.push(user);
     Object.entries(activeUsers).forEach(keyValuePair => {console.log("   ",...keyValuePair)}) 
     /**
      * this iterates through the object console logging keyvaluepairs for each of the object
      *  
      */

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(officerHelpBot, 'Welcome to ' + user.room + ' @' + username));
    socket.emit('message', formatMessage(officerHelpBot, 'Things you can do include: !train, !quest, !kill'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(officerHelpBot, `${user.username} has joined the world!`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    if(msg.includes('!debug')){
      
      socket.emit('message', formatMessage(officerHelpBot, `${parsedactiveUsers} activeUsers my guy`))
    }
    if(msg.includes("!attack")){
      socket.emit('message', formatMessage(commandBot, 'please @someone you would like to attack!'));
    }
    if(msg.includes("!help")){
      socket.emit('message', formatMessage(commandBot, 'Available commands include: !attack <@user> & !help'))
    }
    // console.log(chatMessage + 'chatMessage')
    

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    
    const popped = Array.prototype.pop.call(activeUsers)
    Object.entries(popped).forEach(keyValuePair => {console.log("   ",...keyValuePair)})
    console.log(`${popped} has been removed.`)
    

    const user = userLeave(socket.id);
    

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(officerHelpBot, `${user.username} has left the world`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
