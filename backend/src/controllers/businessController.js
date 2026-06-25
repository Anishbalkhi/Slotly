const { body, param } = require('express-validator');
const Business = require('../models/Business');
const AppError = require('../utils/AppError');

/**
 * Validation rules for creating/updating a business.
 */
const businessValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),
  body('timezone')
    .optional()
    .trim()
    .notEmpty().withMessage('Timezone cannot be empty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .trim(),
  body('maxAdvanceDays')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Max advance days must be 1–365'),
];

/**
 * POST /api/businesses
 * Create a new business. Auth: Owner.
 */
const createBusiness = async (req, res, next) => {
  try {
    const { name, description, category, address, phone, email, timezone, hours, maxAdvanceDays } = req.body;

    const business = await Business.create({
      ownerId: req.user._id,
      name,
      description,
      category,
      address,
      phone,
      email,
      timezone: timezone || 'Asia/Kolkata',
      hours,
      maxAdvanceDays,
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/businesses
 * List businesses (public). Supports ?search, ?category, ?page, ?limit.
 */
const getBusinesses = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Business.countDocuments(filter);
    const businesses = await Business.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/businesses/:id
 * Get a single business by ID (public).
 */
const getBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('services');

    if (!business) {
      return next(new AppError('Business not found', 404));
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/businesses/mine
 * Get businesses owned by the authenticated user.
 */
const getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id })
      .populate('services')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/businesses/:id
 * Update a business. Auth: Owner of this business.
 */
const updateBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return next(new AppError('Business not found', 404));
    }

    if (business.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this business', 403));
    }

    // Only allow updating specific fields
    const allowedFields = [
      'name', 'description', 'category', 'address', 'phone',
      'email', 'timezone', 'hours', 'maxAdvanceDays', 'logo', 'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    });

    await business.save();

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/businesses/:id
 * Delete a business. Auth: Owner of this business.
 */
const deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return next(new AppError('Business not found', 404));
    }

    if (business.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this business', 403));
    }

    await Business.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: null,
      message: 'Business deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBusiness,
  getBusinesses,
  getBusiness,
  getMyBusinesses,
  updateBusiness,
  deleteBusiness,
  businessValidation,
};
