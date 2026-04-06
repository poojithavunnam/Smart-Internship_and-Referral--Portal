const express = require('express');
const { register, login, updateProfile, getProfile } = require('../controllers/authController');
const { requireFields } = require('../middleware/validateMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', requireFields(['name', 'email', 'password']), register);
router.post('/login', requireFields(['email', 'password']), login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
