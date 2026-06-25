const express = require('express');
const { getProfile, updateProfile, updateProfileValidation } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/users/me — get profile (authenticated)
router.get('/me', protect, getProfile);

// PUT /api/users/me — update profile (authenticated)
router.put('/me', protect, updateProfileValidation, validate, updateProfile);

module.exports = router;
