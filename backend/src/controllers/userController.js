const { body } = require('express-validator');
const User = require('../models/User');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');

// ── Validation Rules ──────────────────────────────────────────────────

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

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ── GET /api/users/me ─────────────────────────────────────────────────
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

// ── PUT /api/users/me ─────────────────────────────────────────────────
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

// ── PUT /api/users/me/password ────────────────────────────────────────
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Set new password (pre-save hook will hash it)
    user.passwordHash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/users/me ──────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Cancel all future confirmed appointments
    await Appointment.updateMany(
      { customerId: userId, status: 'confirmed', start: { $gt: new Date() } },
      { status: 'cancelled' }
    );

    // Delete user's reviews
    await Review.deleteMany({ userId });

    // If owner, deactivate their businesses
    await Business.updateMany(
      { ownerId: userId },
      { isActive: false }
    );

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  updateProfileValidation,
  updatePasswordValidation,
};
