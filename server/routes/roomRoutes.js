const express = require('express');
const router = express.Router();
const { createRoom, getRooms } = require('../controllers/roomController');

router.post('/create', createRoom);
router.get('/', getRooms);

module.exports = router;
