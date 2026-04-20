const mongoose = require('mongoose');

const connectDB = async (retryCount = 0) => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://[IP_ADDRESS]/realtime-chat';
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
        });
        console.log('MongoDB connection established successfully.');
    } catch (error) {
        console.error(`MongoDB connection attempt #${retryCount + 1} failed:`, error.message);
        
        if (retryCount < 5) {
            console.log('Retrying in 5 seconds...');
            setTimeout(() => connectDB(retryCount + 1), 5000);
        } else {
            console.error('CRITICAL: MongoDB core connection failed after maximum retries. API will remain active but database features may fail.');
        }
    }
};

module.exports = connectDB;
