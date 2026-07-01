const { body } = require('express-validator');
const Review = require('../models/Review');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');

// ── Validation Rules ──────────────────────────────────────────────────

const reviewValidation = [
  body('businessId').notEmpty().withMessage('businessId is required'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

// ── POST /api/reviews ─────────────────────────────────────────────────
const createReview = async (req, res, next) => {
  try {
    const { businessId, rating, comment } = req.body;
    const userId = req.user._id;

    // 1. Verify business exists
    const business = await Business.findById(businessId);
    if (!business) return next(new AppError('Business not found', 404));

    // 2. Verify user has a past completed appointment with this business
    const pastAppointment = await Appointment.findOne({
      businessId,
      customerId: userId,
      status: 'confirmed',
      end: { $lt: new Date() },
    });

    if (!pastAppointment) {
      return next(
        new AppError('You can only review businesses where you have completed an appointment.', 403)
      );
    }

    // 3. Create review (unique index prevents duplicates)
    const review = await Review.create({
      businessId,
      userId,
      rating,
      comment: comment || '',
    });

    const populated = await Review.findById(review._id)
      .populate('userId', 'name email')
      .populate('businessId', 'name');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    // Handle duplicate review (unique index violation)
    if (error.code === 11000) {
      return next(new AppError('You have already reviewed this business.', 409));
    }
    next(error);
  }
};

// ── GET /api/businesses/:id/reviews ───────────────────────────────────
const getBusinessReviews = async (req, res, next) => {
  try {
    const businessId = req.params.id;

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) return next(new AppError('Business not found', 404));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ businessId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ businessId }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/reviews/:id ───────────────────────────────────────────
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    // Only the review author can delete
    if (review.userId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this review', 403));
    }

    await Review.findByIdAndDelete(review._id);

    res.json({
      success: true,
      data: null,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getBusinessReviews,
  deleteReview,
  reviewValidation,
};
