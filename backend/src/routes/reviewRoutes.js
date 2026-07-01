const express = require('express');
const {
  createReview,
  deleteReview,
  reviewValidation,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/reviews — create a review (customer auth)
router.post('/', protect, authorize('customer'), reviewValidation, validate, createReview);

// DELETE /api/reviews/:id — delete own review (customer auth)
router.delete('/:id', protect, deleteReview);

module.exports = router;
