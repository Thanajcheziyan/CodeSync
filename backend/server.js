const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const cors=require('cors');
const { Server } = require('socket.io');
const ACTIONS = require('../frontend/src/Actions');
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('sendInput', (input) => {
        
        // Broadcast the input to all other connected clients
        socket.broadcast.emit('inputFromOtherUser', input);
      });

      socket.on('sendOutput', (input) => {
        
        // Broadcast the input to all other connected clients
        socket.broadcast.emit('outputFromOtherUser', input);
      });

      socket.on('sendchoice', (input) => {
        
        // Broadcast the choice to all other connected clients
        socket.broadcast.emit('choiceFromOtherUser', input);
      });

      socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on('stream', (streamData) => {
        socket.broadcast.emit('stream', streamData); // Broadcast the video stream to other users
    });



    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId); 
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });
    socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

  
  
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
