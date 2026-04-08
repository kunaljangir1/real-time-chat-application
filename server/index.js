require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));

const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userSocketMap = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log('User connected:', socket.id, 'UserId:', userId);

  if (userId && userId !== "undefined") {
    userSocketMap.set(userId, socket.id);
    io.emit('user_status_changed', { userId, status: 'online' });
  }

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', async (data) => {
    try {
      let room = await ChatRoom.findOne({ roomName: data.roomId });

      if (!room) {
        room = await ChatRoom.create({
          roomName: data.roomId,
          isGroupChat: true
        });
      }

      const newMessage = await Message.create({
        roomId: room._id,
        senderId: data.senderId,
        content: data.content
      });

      const broadcastData = { ...data, id: newMessage._id, isRead: false };

      io.to(data.roomId).emit('receive_message', broadcastData);

    } catch (error) {
      console.error('Error saving message payload:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (userId && userId !== "undefined") {
      userSocketMap.delete(userId);
      io.emit('user_status_changed', { userId, status: 'offline' });
    }
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});