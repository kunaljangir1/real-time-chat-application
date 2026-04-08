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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = new Map(); // Maps userId -> socket.id

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('User connected:', socket.id, 'UserId:', userId);

    if (userId && userId !== "undefined") {
        userSocketMap.set(userId, socket.id);
        // Emit online status updates to all connected users
        io.emit('user_status_changed', { userId, status: 'online' });
    }

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        // data is expected to contain { roomId, senderId, content, ... }
        try {
            let room = await ChatRoom.findOne({ roomName: data.roomId });
            if (!room) {
                // Auto-create room if it's the first time
                room = await ChatRoom.create({ roomName: data.roomId, isGroupChat: true });
            }

            const newMessage = await Message.create({
                roomId: room._id,
                senderId: data.senderId,
                content: data.content
            });

            // Make sure new payload holds the exact DB properties
            const broadcastData = { ...data, id: newMessage._id, isRead: false };

            // Re-broadcast to everyone (including sender)
            io.to(data.roomId).emit('receive_message', broadcastData);
        } catch (error) {
            console.error('Error saving message payload:', error);
        }
    });

    socket.on('messages_read', async (data) => {
        try {
            const room = await ChatRoom.findOne({ roomName: data.roomId });
            if (room) {
                // Update all unread messages from OTHERS in this room
                await Message.updateMany(
                    { roomId: room._id, senderId: { $ne: data.readerId }, isRead: false },
                    { $set: { isRead: true } }
                );

                // Broadcast back so senders update UI
                io.to(data.roomId).emit('read_status_updated', { roomId: data.roomId, readerId: data.readerId });
            }
        } catch (error) {
            console.error('Error updating read status:', error);
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

const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
