const ChatRoom = require('../models/ChatRoom');

// @route POST /api/rooms/create
const createRoom = async (req, res) => {
    try {
        const { roomName, members } = req.body;
        
        // Prevent generic duplicate room names
        const roomExists = await ChatRoom.findOne({ roomName });
        if (roomExists) {
            return res.status(400).json({ message: 'A room with this name already exists' });
        }

        const room = await ChatRoom.create({
            roomName,
            members: members || [],
            isGroupChat: true
        });

        res.status(201).json({
            id: room._id,
            roomName: room.roomName,
            members: room.members,
            isGroupChat: room.isGroupChat
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/rooms
// Returns all rooms available
const getRooms = async (req, res) => {
    try {
        const rooms = await ChatRoom.find({});
        res.json(rooms.map(room => ({
            id: room._id,
            roomName: room.roomName,
            isGroupChat: room.isGroupChat,
            members: room.members
        })));
    } catch (error) {
         res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createRoom, getRooms };
