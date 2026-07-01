const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics — owner analytics dashboard data
router.get('/', protect, authorize('owner'), getAnalytics);

module.exports = router;
