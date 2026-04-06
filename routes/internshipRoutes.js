const express = require('express');
const { getInternships } = require('../controllers/internshipController');

const router = express.Router();
router.get('/internships', getInternships);

module.exports = router;
