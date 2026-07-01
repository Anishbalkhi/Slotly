const express = require('express');
const {
  createBusiness,
  getBusinesses,
  getBusiness,
  getMyBusinesses,
  updateBusiness,
  deleteBusiness,
  businessValidation,
} = require('../controllers/businessController');
const { createService, getServices, serviceValidation } = require('../controllers/serviceController');
const { createStaff, getStaffByBusiness, staffValidation } = require('../controllers/staffController');
const { getBusinessReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────
router.get('/', getBusinesses);

// ── Protected (Owner) — specific routes BEFORE /:id param ──────────
router.get('/user/mine', protect, authorize('owner'), getMyBusinesses);
router.post('/', protect, authorize('owner'), businessValidation, validate, createBusiness);

// ── Parameterized routes ────────────────────────────────────────────
router.get('/:id', getBusiness);
router.put('/:id', protect, authorize('owner'), businessValidation, validate, updateBusiness);
router.delete('/:id', protect, authorize('owner'), deleteBusiness);

// ── Services (nested under business) ────────────────────────────────
router.get('/:id/services', getServices);
router.post('/:id/services', protect, authorize('owner'), serviceValidation, validate, createService);

// ── Staff (nested under business) ───────────────────────────────────
router.get('/:id/staff', getStaffByBusiness);
router.post('/:id/staff', protect, authorize('owner'), staffValidation, validate, createStaff);

// ── Reviews (nested under business) ─────────────────────────────────
router.get('/:id/reviews', getBusinessReviews);

module.exports = router;
