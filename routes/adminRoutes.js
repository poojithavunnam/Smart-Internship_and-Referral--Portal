const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireFields } = require('../middleware/validateMiddleware');
const { getAllApplications, updateApplicationStatus, getAllReferrals, updateReferralStatus, createAdminUser } = require('../controllers/adminController');

const router = express.Router();

// Admin-only routes
router.get('/admin/applications', verifyToken, getAllApplications);
router.put('/admin/applications/status', verifyToken, requireFields(['applicationId', 'status']), updateApplicationStatus);
router.get('/admin/referrals', verifyToken, getAllReferrals);
router.put('/admin/referrals/status', verifyToken, requireFields(['referralId', 'status']), updateReferralStatus);

// Temporary route to create admin user (remove in production)
router.post('/admin/create', requireFields(['email', 'password', 'name']), createAdminUser);

module.exports = router;