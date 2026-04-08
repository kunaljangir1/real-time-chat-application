const express = require('express');
const router = express.Router();
const { getConversations } = require('../controllers/conversationController');

router.get('/', getConversations);

module.exports = router;
