const express = require('express');
const router = express.Router();
const { createRoom, getRooms, deleteRoom } = require('../controllers/roomController');

router.post('/create', createRoom);
router.get('/', getRooms);
router.delete('/:roomName', deleteRoom);

module.exports = router;
