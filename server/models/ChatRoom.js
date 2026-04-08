const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isGroupChat: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Automatically creates 'createdAt' and 'updatedAt'
});

// Safely map Mongoose _id to id in JSON outputs
chatRoomSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
    }
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
