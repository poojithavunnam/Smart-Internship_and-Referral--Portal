const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { applyForInternship, getApplications } = require('../controllers/applicationController');
const { requireFields } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/apply', verifyToken, requireFields(['internshipId', 'skills']), applyForInternship);
router.get('/applications', verifyToken, getApplications);

module.exports = router;
