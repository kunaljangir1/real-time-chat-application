const User = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
        // Exclude the password field
        const users = await User.find({}).select('-password');
        
        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            onlineStatus: user.onlineStatus
        }));
        
        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAllUsers };
