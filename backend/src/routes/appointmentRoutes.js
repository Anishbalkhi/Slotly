const express = require('express');
const {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  availabilityValidation,
  createAppointmentValidation,
  rescheduleValidation,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────
// GET /api/availability?businessId=&serviceId=&date=YYYY-MM-DD
router.get('/availability', availabilityValidation, validate, getAvailability);

// ── Protected ───────────────────────────────────────────────────────
// POST /api/appointments — create booking (Customer)
router.post('/', protect, createAppointmentValidation, validate, createAppointment);

// GET /api/appointments — list appointments (Customer sees own, Owner sees business)
router.get('/', protect, getAppointments);

// GET /api/appointments/:id — get single appointment
router.get('/:id', protect, getAppointment);

// PUT /api/appointments/:id/cancel — cancel appointment
router.put('/:id/cancel', protect, cancelAppointment);

// PUT /api/appointments/:id/reschedule — reschedule appointment
router.put('/:id/reschedule', protect, rescheduleValidation, validate, rescheduleAppointment);

module.exports = router;

