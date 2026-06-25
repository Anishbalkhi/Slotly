const express = require('express');
const { updateService, deleteService, serviceValidation } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// PUT /api/services/:sid  — update service (Owner)
router.put('/:sid', protect, authorize('owner'), serviceValidation, validate, updateService);

// DELETE /api/services/:sid — delete service (Owner)
router.delete('/:sid', protect, authorize('owner'), deleteService);

module.exports = router;
