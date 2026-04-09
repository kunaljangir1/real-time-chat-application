const express = require('express');
const router = express.Router();
const { createRoom, getRooms, deleteRoom, getRoomMembers, addMember } = require('../controllers/roomController');

router.post('/create', createRoom);
router.get('/', getRooms);
router.get('/:roomName/members', getRoomMembers);
router.post('/add-member', addMember);
router.delete('/:roomName', deleteRoom);

module.exports = router;
