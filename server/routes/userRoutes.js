const express = require('express');
const router = express.Router();
const { getAllUsers, updateProfile, searchUsers, getUserContacts, addContact } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/search', searchUsers);          // GET /api/users/search?q=<query>&currentUserId=<id>
router.get('/:id/contacts', getUserContacts); // GET /api/users/:id/contacts
router.post('/:id/contacts', addContact);     // POST /api/users/:id/contacts
router.put('/:id', updateProfile);

module.exports = router;
