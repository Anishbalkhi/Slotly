const express = require('express');
const {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  updateProfileValidation,
  updatePasswordValidation,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/users/me — get profile (authenticated)
router.get('/me', protect, getProfile);

// PUT /api/users/me — update profile (authenticated)
router.put('/me', protect, updateProfileValidation, validate, updateProfile);

// PUT /api/users/me/password — change password (authenticated)
router.put('/me/password', protect, updatePasswordValidation, validate, updatePassword);

// DELETE /api/users/me — delete account (authenticated)
router.delete('/me', protect, deleteAccount);

module.exports = router;
