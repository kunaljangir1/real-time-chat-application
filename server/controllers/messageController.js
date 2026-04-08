const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// @desc    Get messages by room name
// @route   GET /api/messages/:roomId
// @access  Public (in reality should be protected, but keeping it open per simplicity unless auth is mounted)
const getMessages = async (req, res) => {
    try {
        const roomName = req.params.roomId;
        
        let room = await ChatRoom.findOne({ roomName });
        if (!room) {
            return res.json([]); // No messages simply means an empty array
        }

        const messages = await Message.find({ roomId: room._id })
            .populate('senderId', 'username avatar')
            .sort({ timestamp: 1 }); // Sort oldest to newest

        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            roomId: roomName,
            senderId: msg.senderId ? msg.senderId._id : null,
            senderName: msg.senderId ? msg.senderId.username : 'Unknown',
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: msg.isRead
        }));

        res.json(formattedMessages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages', error: error.message });
    }
};

module.exports = { getMessages };
