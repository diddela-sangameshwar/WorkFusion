const jwt = require('jsonwebtoken');

const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (${socket.userRole})`);

    // Join personal room
    socket.join(`user_${socket.userId}`);

    // HR and Admin join global room
    if (socket.userRole === 'hr' || socket.userRole === 'admin') {
      socket.join('management');
    }

    // Join department room (will be set on client)
    socket.on('join:department', (department) => {
      socket.join(`dept_${department}`);
      console.log(`📁 User ${socket.userId} joined dept_${department}`);
    });

    // Handle real-time task update notifications
    socket.on('task:update', (data) => {
      socket.to(`user_${data.assignedTo}`).emit('task:updated', data);
      socket.to('management').emit('task:updated', data);
    });

    // Handle progress notifications
    socket.on('progress:update', (data) => {
      socket.to('management').emit('progress:logged', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
