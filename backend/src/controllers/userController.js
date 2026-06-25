const { body } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Validation rules for profile update.
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1–100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('emailNotifications')
    .optional()
    .isBoolean().withMessage('emailNotifications must be a boolean'),
];

/**
 * GET /api/users/me
 * Get current user's profile.
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/me
 * Update current user's profile.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, emailNotifications } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if new email is already taken
      const existing = await User.findOne({ email });
      if (existing) {
        return next(new AppError('Email already in use', 409));
      }
      user.email = email;
    }
    if (emailNotifications !== undefined) {
      user.emailNotifications = emailNotifications;
    }

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfileValidation,
};
