const express = require('express');
const router = express.Router();
const { getAllUsers, updateProfile, searchUserByEmail } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/search', searchUserByEmail);
router.put('/:id', updateProfile);

module.exports = router;
