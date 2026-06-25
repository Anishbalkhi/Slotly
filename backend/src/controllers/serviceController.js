const { body } = require('express-validator');
const Service = require('../models/Service');
const Business = require('../models/Business');
const AppError = require('../utils/AppError');

/**
 * Validation rules for creating/updating a service.
 */
const serviceValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 5, max: 480 }).withMessage('Duration must be 5–480 minutes'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('bufferMinutes')
    .optional()
    .isInt({ min: 0 }).withMessage('Buffer time cannot be negative'),
  body('type')
    .optional()
    .isIn(['individual', 'group']).withMessage('Type must be individual or group'),
];

/**
 * Helper: verify the requesting user owns the business.
 */
const verifyOwnership = async (businessId, userId) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new AppError('Business not found', 404);
  }
  if (business.ownerId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to manage this business', 403);
  }
  return business;
};

/**
 * POST /api/businesses/:id/services
 * Add a service to a business. Auth: Owner.
 */
const createService = async (req, res, next) => {
  try {
    await verifyOwnership(req.params.id, req.user._id);

    const { name, description, duration, price, currency, capacity, bufferMinutes, type } = req.body;

    const service = await Service.create({
      businessId: req.params.id,
      name,
      description,
      duration,
      price,
      currency,
      capacity,
      bufferMinutes,
      type: capacity > 1 ? 'group' : (type || 'individual'),
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/businesses/:id/services
 * List services for a business (public).
 */
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({
      businessId: req.params.id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/services/:sid
 * Update a service. Auth: Owner of parent business.
 */
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.sid);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    await verifyOwnership(service.businessId, req.user._id);

    const allowedFields = [
      'name', 'description', 'duration', 'price', 'currency',
      'capacity', 'bufferMinutes', 'type', 'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    await service.save();

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/services/:sid
 * Remove a service. Auth: Owner of parent business.
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.sid);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    await verifyOwnership(service.businessId, req.user._id);

    await Service.findByIdAndDelete(req.params.sid);

    res.json({
      success: true,
      data: null,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  updateService,
  deleteService,
  serviceValidation,
};
