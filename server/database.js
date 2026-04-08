const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'offline',
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER,
            channel TEXT NOT NULL, 
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )`);
    });
}

const getUserByUsername = (username, callback) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
            // Create user
            db.run(`INSERT INTO users (username, status) VALUES (?, 'online')`, [username], function(err) {
                if (err) return callback(err);
                callback(null, { id: this.lastID, username, status: 'online' });
            });
        } else {
            // Update status
            db.run(`UPDATE users SET status = 'online' WHERE id = ?`, [row.id], function(err) {
                callback(err, { ...row, status: 'online' });
            });
        }
    });
};

const setUserOffline = (userId) => {
    db.run(`UPDATE users SET status = 'offline', last_seen = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
};

const getAllUsers = (callback) => {
    db.all(`SELECT id, username, status, last_seen as timestamp FROM users`, [], (err, rows) => {
        callback(err, rows);
    });
};

const saveMessage = (sender_id, channel, content, callback) => {
    db.run(`INSERT INTO messages (sender_id, channel, content) VALUES (?, ?, ?)`, [sender_id, channel, content], function(err) {
        callback(err, { id: this.lastID, sender_id, channel, content, timestamp: new Date().toISOString() });
    });
};

const getMessagesByChannel = (channel, callback) => {
    db.all(`SELECT m.id, m.sender_id, u.username as sender_username, m.channel, m.content, m.timestamp 
            FROM messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.channel = ? 
            ORDER BY m.timestamp ASC`, [channel], (err, rows) => {
        callback(err, rows);
    });
};

module.exports = {
    db,
    getUserByUsername,
    setUserOffline,
    getAllUsers,
    saveMessage,
    getMessagesByChannel
};
