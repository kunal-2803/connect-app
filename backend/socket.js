const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Connection = require('./models/Connection');

module.exports = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      // Update user's last active status
      await User.findByIdAndUpdate(decoded.id, { lastActive: Date.now() });
      
      next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Join personal room for user-specific events
    socket.join(socket.userId);
    
    // Handle joining connection rooms
    socket.on('join-connection', async (connectionId) => {
      try {
        const connection = await Connection.findById(connectionId);
        
        if (!connection) {
          socket.emit('error', { message: 'Connection not found' });
          return;
        }
        
        // Ensure user is part of the connection
        if (
          connection.requester.toString() !== socket.userId && 
          connection.recipient.toString() !== socket.userId
        ) {
          socket.emit('error', { message: 'Not authorized to join this connection' });
          return;
        }
        
        // Join the connection room
        socket.join(`connection:${connectionId}`);
        socket.emit('connection-joined', connectionId);
        
        // Mark messages as read
        await Message.updateMany(
          {
            connection: connectionId,
            sender: { $ne: socket.userId },
            isRead: false
          },
          { $set: { isRead: true } }
        );
      } catch (err) {
        console.error('Join connection error:', err);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { connectionId, content, messageType } = data;
        
        const connection = await Connection.findById(connectionId);
        
        if (!connection || connection.status !== 'accepted') {
          socket.emit('error', { message: 'Cannot send message: connection is not active' });
          return;
        }
        
        // Check if user is part of the connection
        if (
          connection.requester.toString() !== socket.userId && 
          connection.recipient.toString() !== socket.userId
        ) {
          socket.emit('error', { message: 'Not authorized to send messages in this connection' });
          return;
        }
        
        // Create and save message
        const message = new Message({
          connection: connectionId,
          sender: socket.userId,
          content,
          messageType
        });
        
        await message.save();
        
        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username');
        
        // Emit to the connection room
        io.to(`connection:${connectionId}`).emit('new-message', populatedMessage);
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (connectionId) => {
      socket.to(`connection:${connectionId}`).emit('user-typing', socket.userId);
    });
    
    // Handle stop typing indicator
    socket.on('stop-typing', (connectionId) => {
      socket.to(`connection:${connectionId}`).emit('user-stop-typing', socket.userId);
    });
    
    // Connection request notification
    socket.on('connection-request', async (recipientId) => {
      socket.to(recipientId).emit('new-connection-request', {
        from: socket.userId
      });
    });
    
    // Disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);
      
      // Update user's last active status
      await User.findByIdAndUpdate(socket.userId, { lastActive: Date.now() });
    });
  });
};