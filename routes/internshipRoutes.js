const express = require('express');
const { getInternships } = require('../controllers/internshipController');

const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/internships', verifyToken, getInternships);

module.exports = router;
