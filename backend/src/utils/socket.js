/**
 * Socket.IO Real-Time Event Broadcaster Helper
 */
const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : '*';

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.includes('*') ? '*' : corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
      if (room) {
        socket.join(room);
      }
    });
  });

  return io;
};

const getIo = () => io;

const broadcastEvent = (eventName, data, room = null) => {
  if (!io) return;
  if (room) {
    io.to(room).emit(eventName, data);
  } else {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  broadcastEvent
};
