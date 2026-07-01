const { body } = require('express-validator');
const Staff = require('../models/Staff');
const Business = require('../models/Business');
const AppError = require('../utils/AppError');

// ── Validation Rules ──────────────────────────────────────────────────

const staffValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Staff name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('role')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Role cannot exceed 100 characters'),
  body('weeklyAvailability')
    .optional()
    .isArray().withMessage('weeklyAvailability must be an array'),
  body('weeklyAvailability.*.day')
    .optional()
    .isInt({ min: 0, max: 6 }).withMessage('Day must be 0–6 (Sun–Sat)'),
  body('weeklyAvailability.*.start')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:mm'),
  body('weeklyAvailability.*.end')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:mm'),
];

// ── Helper: Check ownership ─────────────────────────────────────────

const verifyBusinessOwner = async (businessId, userId) => {
  const business = await Business.findById(businessId);
  if (!business) throw new AppError('Business not found', 404);
  if (business.ownerId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to manage staff for this business', 403);
  }
  return business;
};

// ── POST /api/businesses/:id/staff ────────────────────────────────────
const createStaff = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    await verifyBusinessOwner(businessId, req.user._id);

    const { name, email, phone, role, weeklyAvailability } = req.body;

    const staff = await Staff.create({
      businessId,
      name,
      email: email || '',
      phone: phone || '',
      role: role || 'Staff',
      weeklyAvailability: weeklyAvailability || undefined,
    });

    res.status(201).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/businesses/:id/staff ─────────────────────────────────────
const getStaffByBusiness = async (req, res, next) => {
  try {
    const businessId = req.params.id;

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) return next(new AppError('Business not found', 404));

    const staff = await Staff.find({ businessId, isActive: true })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/staff/:id ────────────────────────────────────────────────
const getStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('businessId', 'name timezone');

    if (!staff) return next(new AppError('Staff member not found', 404));

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/staff/:id ────────────────────────────────────────────────
const updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return next(new AppError('Staff member not found', 404));

    await verifyBusinessOwner(staff.businessId, req.user._id);

    const allowedFields = ['name', 'email', 'phone', 'role', 'weeklyAvailability', 'isActive'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        staff[field] = req.body[field];
      }
    });

    await staff.save();

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/staff/:id (soft-delete) ───────────────────────────────
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return next(new AppError('Staff member not found', 404));

    await verifyBusinessOwner(staff.businessId, req.user._id);

    staff.isActive = false;
    await staff.save();

    res.json({
      success: true,
      data: null,
      message: 'Staff member deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getStaffByBusiness,
  getStaff,
  updateStaff,
  deleteStaff,
  staffValidation,
};
