const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requestReferral, getReferrals } = require('../controllers/referralController');
const { requireFields } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/referral', verifyToken, requireFields(['internshipId', 'message']), requestReferral);
router.get('/referrals', verifyToken, getReferrals);

module.exports = router;
