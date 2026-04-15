const User = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
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

const searchUserByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('-password');
        if (!user) return res.status(404).json({ message: 'No user found with that email' });

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            onlineStatus: user.onlineStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.params.id;

        if (!username || username.trim() === '') {
            return res.status(400).json({ message: 'Username cannot be empty' });
        }

        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            onlineStatus: updatedUser.onlineStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAllUsers, updateProfile, searchUserByEmail };
