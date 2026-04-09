const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

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

// @route DELETE /api/rooms/:roomName
const deleteRoom = async (req, res) => {
    try {
        const { roomName } = req.params;
        if (roomName === 'Global Lounge') {
            return res.status(403).json({ message: 'Cannot delete the Global Lounge' });
        }
        
        const room = await ChatRoom.findOne({ roomName });
        if (room) {
            await Message.deleteMany({ roomId: room._id });
            await ChatRoom.deleteOne({ _id: room._id });
            res.json({ message: 'Conversation permanently deleted.' });
        } else {
             // In case physical room doesn't exist but history does exist due to async sockets
             res.json({ message: 'Room cleared.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/rooms/:roomName/members
const getRoomMembers = async (req, res) => {
    try {
        const { roomName } = req.params;
        const room = await ChatRoom.findOne({ roomName }).populate('members', 'id username email onlineStatus');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        res.json(room.members);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/rooms/add-member
const addMember = async (req, res) => {
    try {
        const { roomName, userId } = req.body;
        
        const room = await ChatRoom.findOne({ roomName });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        if (room.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member of this room' });
        }

        room.members.push(userId);
        await room.save();

        res.json({ message: 'Member added successfully', room });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createRoom, getRooms, deleteRoom, getRoomMembers, addMember };
