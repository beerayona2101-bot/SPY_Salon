/**
 * Socket.IO Real-Time Event Broadcaster Helper
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  // JWT Authenticated Handshake Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } catch (err) {
        console.warn('[Socket.IO] Handshake JWT check failed:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New connection: ${socket.id} (Authenticated: ${!!socket.user})`);

    // Dynamic token authentication post-connection
    socket.on('authenticate', (token) => {
      if (!token) return;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        const userId = decoded.id || decoded._id;
        if (userId) socket.join(`room:user_${userId}`);
        if (decoded.role) socket.join(`room:${decoded.role}`);
        console.log(`[Socket.IO] Socket ${socket.id} authenticated post-connect as ${decoded.role} (${userId})`);
      } catch (err) {
        console.warn('[Socket.IO] Post-connect auth error:', err.message);
      }
    });

    // Enforce dynamic room verification
    socket.on('join_room', (room) => {
      if (!room) return;

      // 1. Role-specific rooms (e.g. room:admin, room:employee)
      if (room.startsWith('room:')) {
        const rolePart = room.replace('room:', '');
        const validRoles = ['admin', 'manager', 'receptionist', 'employee', 'customer'];
        
        if (validRoles.includes(rolePart)) {
          if (!socket.user) {
            console.warn(`[Socket.IO] Guest socket ${socket.id} denied access to role room: ${room}`);
            return;
          }
          
          // Role authorization checks
          if (rolePart === 'admin' && socket.user.role !== 'admin') return;
          if (rolePart === 'manager' && !['admin', 'manager'].includes(socket.user.role)) return;
          if (rolePart === 'receptionist' && !['admin', 'manager', 'receptionist'].includes(socket.user.role)) return;
          if (rolePart === 'employee' && !['admin', 'manager', 'receptionist', 'employee'].includes(socket.user.role)) return;
        }
      }

      // 2. User-specific private rooms (e.g. room:user_cust_123)
      if (room.startsWith('room:user_')) {
        const targetUserId = room.replace('room:user_', '');
        if (!socket.user || (String(socket.user.id || socket.user._id) !== String(targetUserId) && socket.user.role !== 'admin')) {
          console.warn(`[Socket.IO] Socket ${socket.id} denied access to private user room: ${room}`);
          return;
        }
      }

      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} authorized and joined room: ${room}`);
    });
  });

  return io;
};

const getIo = () => io;

const broadcastEvent = (eventName, data, room = null) => {
  try {
    if (!io) return;
    if (room) {
      io.to(room).emit(eventName, data);
    } else {
      io.to('room:admin').to('room:manager').to('room:receptionist').emit(eventName, data);
    }
  } catch (err) {
    console.error('[Socket.IO] broadcastEvent error:', err.message);
  }
};

const emitToUser = (userId, eventName, data) => {
  try {
    if (!io || !userId) return;
    io.to(`room:user_${userId}`).emit(eventName, data);
  } catch (err) {
    console.error('[Socket.IO] emitToUser error:', err.message);
  }
};

module.exports = {
  initSocket,
  getIo,
  broadcastEvent,
  emitToUser
};
