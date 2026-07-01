const express = require('express');
const {
  getStaff,
  updateStaff,
  deleteStaff,
  staffValidation,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Individual staff routes ─────────────────────────────────────────
// GET /api/staff/:id — get single staff member (public)
router.get('/:id', getStaff);

// PUT /api/staff/:id — update staff (owner auth)
router.put('/:id', protect, authorize('owner'), staffValidation, validate, updateStaff);

// DELETE /api/staff/:id — soft-delete staff (owner auth)
router.delete('/:id', protect, authorize('owner'), deleteStaff);

module.exports = router;
