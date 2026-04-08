const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

const getConversations = async (req, res) => {
    try {
        const { userId } = req.query; 
        if (!userId) return res.status(400).json({ message: "userId query param required" });

        // Get groups the user belongs to
        const groups = await ChatRoom.find({ members: userId, isGroupChat: true });
        
        // Get all other users (to represent potential 1-1 conversations)
        const users = await User.find({ _id: { $ne: userId } }).select('-password');

        const conversations = [];

        // Map Groups
        for (let group of groups) {
            const lastMsg = await Message.findOne({ roomId: group._id }).sort({ timestamp: -1 });
            const unreadCount = await Message.countDocuments({ roomId: group._id, senderId: { $ne: userId }, isRead: false });

            conversations.push({
                id: group.roomName, 
                name: group.roomName,
                isGroup: true,
                lastMessage: lastMsg ? lastMsg.content : "Created explicitly. Say hi!",
                lastMessageTime: lastMsg ? lastMsg.timestamp : new Date(0), // Push to bottom if empty
                unreadCount,
                onlineStatus: false
            });
        }

        // Map 1-1 Users
        for (let user of users) {
             const p1 = userId;
             const p2 = user._id.toString();
             const oneOnOneRoomName = p1 < p2 ? `${p1}_${p2}` : `${p2}_${p1}`;

             const room = await ChatRoom.findOne({ roomName: oneOnOneRoomName });
             let lastMessage = "Say hello!";
             let unreadCount = 0;
             let lastMessageTime = new Date(0);

             if (room) {
                 const lastMsg = await Message.findOne({ roomId: room._id }).sort({ timestamp: -1 });
                 if (lastMsg) {
                     lastMessage = lastMsg.content;
                     lastMessageTime = lastMsg.timestamp;
                 }
                 unreadCount = await Message.countDocuments({ roomId: room._id, senderId: { $ne: userId }, isRead: false });
             }

             conversations.push({
                 id: oneOnOneRoomName,
                 name: user.username,
                 isGroup: false,
                 targetUserId: user._id.toString(), // used to target live online Statuses
                 lastMessage,
                 lastMessageTime,
                 unreadCount,
                 onlineStatus: user.onlineStatus
             });
        }

        // Sort descending (most recent message at the top)
        conversations.sort((a,b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        // Let's add "Global Lounge" unconditionally for fallback parity
        const globalRoom = await ChatRoom.findOne({ roomName: 'Global Lounge' });
        if (globalRoom) {
            const lastMsg = await Message.findOne({ roomId: globalRoom._id }).sort({ timestamp: -1 });
            const unreadCount = await Message.countDocuments({ roomId: globalRoom._id, senderId: { $ne: userId }, isRead: false });
            conversations.unshift({
                id: 'Global Lounge',
                name: 'Global Lounge',
                isGroup: true,
                lastMessage: lastMsg ? lastMsg.content : "Welcome to the global chat!",
                lastMessageTime: lastMsg ? lastMsg.timestamp : new Date(),
                unreadCount,
                onlineStatus: false
            });
        } else {
             conversations.unshift({
                id: 'Global Lounge',
                name: 'Global Lounge',
                isGroup: true,
                lastMessage: "Welcome to the global chat!",
                lastMessageTime: new Date(),
                unreadCount: 0,
                onlineStatus: false
            });
        }

        res.json(conversations);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Server Error fetching aggregated conversations" });
    }
}

module.exports = { getConversations };
