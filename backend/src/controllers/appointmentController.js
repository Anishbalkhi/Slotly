const { body, query, param } = require('express-validator');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Service = require('../models/Service');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getAvailableSlots } = require('../services/availabilityService');
const { sendBookingConfirmation, sendCancellationEmail, sendRescheduleEmail } = require('../services/emailService');

// ── Validation Rules ──────────────────────────────────────────────────

const availabilityValidation = [
  query('businessId').notEmpty().withMessage('businessId is required'),
  query('serviceId').notEmpty().withMessage('serviceId is required'),
  query('date')
    .notEmpty().withMessage('date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
];

const createAppointmentValidation = [
  body('businessId').notEmpty().withMessage('businessId is required'),
  body('serviceId').notEmpty().withMessage('serviceId is required'),
  body('start').notEmpty().withMessage('start time is required'),
  body('end').notEmpty().withMessage('end time is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const rescheduleValidation = [
  body('start').notEmpty().withMessage('New start time is required'),
  body('end').notEmpty().withMessage('New end time is required'),
];

// ── GET /api/availability ─────────────────────────────────────────────
const getAvailability = async (req, res, next) => {
  try {
    const { businessId, serviceId, date } = req.query;
    const slots = await getAvailableSlots(businessId, serviceId, date);

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/appointments ────────────────────────────────────────────
const createAppointment = async (req, res, next) => {
  try {
    const { businessId, serviceId, start, end, notes } = req.body;
    const customerId = req.user._id;

    // 1. Validate business & service exist
    const business = await Business.findById(businessId);
    if (!business) return next(new AppError('Business not found', 404));

    const service = await Service.findById(serviceId);
    if (!service) return next(new AppError('Service not found', 404));
    if (service.businessId.toString() !== businessId) {
      return next(new AppError('Service does not belong to this business', 400));
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    // 2. Basic time validation
    if (startTime >= endTime) {
      return next(new AppError('Start time must be before end time', 400));
    }
    if (startTime < new Date()) {
      return next(new AppError('Cannot book a slot in the past', 400));
    }

    // 3. Check for overlapping confirmed appointments (double-booking prevention)
    const capacity = service.capacity || 1;

    // Count how many confirmed appointments exist for this exact slot
    const bookedCount = await Appointment.countDocuments({
      businessId,
      serviceId,
      status: 'confirmed',
      start: startTime,
      end: endTime,
    });

    if (bookedCount >= capacity) {
      return next(new AppError('This time slot is fully booked. Please choose another time.', 409));
    }

    // 4. Also check for any overlapping individual bookings (for individual services)
    if (capacity === 1) {
      const overlap = await Appointment.findOne({
        businessId,
        status: 'confirmed',
        start: { $lt: endTime },
        end: { $gt: startTime },
      });

      if (overlap) {
        return next(new AppError('This time slot conflicts with an existing booking.', 409));
      }
    }

    // 5. Create the appointment
    const appointment = await Appointment.create({
      businessId,
      serviceId,
      customerId,
      start: startTime,
      end: endTime,
      notes: notes || '',
      status: 'confirmed',
    });

    // 6. Populate for response
    const populated = await Appointment.findById(appointment._id)
      .populate('businessId', 'name timezone address phone')
      .populate('serviceId', 'name duration price currency')
      .populate('customerId', 'name email');

    // 7. Send confirmation email (non-blocking)
    const customer = await User.findById(customerId);
    sendBookingConfirmation({
      user: customer,
      business,
      service,
      appointment: populated,
    }).catch((err) => {
      console.error('Failed to send booking confirmation email:', err.message);
    });

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    // Handle duplicate key error (same customer, same slot)
    if (error.code === 11000) {
      return next(new AppError('You have already booked this time slot.', 409));
    }
    next(error);
  }
};

// ── GET /api/appointments ─────────────────────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let filter = {};

    if (userRole === 'customer') {
      // Customers see their own appointments
      filter.customerId = userId;
    } else if (userRole === 'owner') {
      // Owners see appointments for their businesses
      const businesses = await Business.find({ ownerId: userId }).select('_id');
      const bizIds = businesses.map((b) => b._id);
      filter.businessId = { $in: bizIds };
    }

    if (status) {
      filter.status = status;
    }

    if (from || to) {
      filter.start = {};
      if (from) filter.start.$gte = new Date(from);
      if (to) filter.start.$lte = new Date(to);
    }

    const appointments = await Appointment.find(filter)
      .populate('businessId', 'name timezone address phone logo')
      .populate('serviceId', 'name duration price currency')
      .populate('customerId', 'name email')
      .sort({ start: 1 });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/appointments/:id ─────────────────────────────────────────
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId', 'name timezone address phone email logo')
      .populate('serviceId', 'name duration price currency description')
      .populate('customerId', 'name email');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    // Check authorization: customer or business owner
    const isCustomer = appointment.customerId._id.toString() === req.user._id.toString();
    const business = await Business.findById(appointment.businessId._id);
    const isOwner = business && business.ownerId.toString() === req.user._id.toString();

    if (!isCustomer && !isOwner) {
      return next(new AppError('Not authorized to view this appointment', 403));
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/appointments/:id/cancel ──────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId', 'name timezone')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name email');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status === 'cancelled') {
      return next(new AppError('Appointment is already cancelled', 400));
    }

    // Check authorization
    const isCustomer = appointment.customerId._id.toString() === req.user._id.toString();
    const business = await Business.findById(appointment.businessId._id);
    const isOwner = business && business.ownerId.toString() === req.user._id.toString();

    if (!isCustomer && !isOwner) {
      return next(new AppError('Not authorized to cancel this appointment', 403));
    }

    // Cancel the appointment
    appointment.status = 'cancelled';
    await appointment.save();

    // Send cancellation email (non-blocking)
    const customer = await User.findById(appointment.customerId._id);
    sendCancellationEmail({
      user: customer,
      business: appointment.businessId,
      service: appointment.serviceId,
      appointment,
    }).catch((err) => {
      console.error('Failed to send cancellation email:', err.message);
    });

    res.json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/appointments/:id/reschedule ──────────────────────────────
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { start, end } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId', 'name timezone')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name email');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status === 'cancelled') {
      return next(new AppError('Cannot reschedule a cancelled appointment', 400));
    }

    // Check authorization
    const isCustomer = appointment.customerId._id.toString() === req.user._id.toString();
    const business = await Business.findById(appointment.businessId._id);
    const isOwner = business && business.ownerId.toString() === req.user._id.toString();

    if (!isCustomer && !isOwner) {
      return next(new AppError('Not authorized to reschedule this appointment', 403));
    }

    const newStart = new Date(start);
    const newEnd = new Date(end);

    // Time validation
    if (newStart >= newEnd) {
      return next(new AppError('Start time must be before end time', 400));
    }
    if (newStart < new Date()) {
      return next(new AppError('Cannot reschedule to a time in the past', 400));
    }

    // Conflict check (exclude current appointment)
    const overlap = await Appointment.findOne({
      _id: { $ne: appointment._id },
      businessId: appointment.businessId._id,
      status: 'confirmed',
      start: { $lt: newEnd },
      end: { $gt: newStart },
    });

    if (overlap) {
      return next(new AppError('The new time slot conflicts with an existing booking.', 409));
    }

    // Store old time for email
    const oldStart = appointment.start;
    const oldEnd = appointment.end;

    // Update times
    appointment.start = newStart;
    appointment.end = newEnd;
    await appointment.save();

    // Send reschedule email (non-blocking)
    const customer = await User.findById(appointment.customerId._id);
    sendRescheduleEmail({
      user: customer,
      business: appointment.businessId,
      service: appointment.serviceId,
      appointment,
      oldStart,
      oldEnd,
    }).catch((err) => {
      console.error('Failed to send reschedule email:', err.message);
    });

    res.json({
      success: true,
      data: appointment,
      message: 'Appointment rescheduled successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  availabilityValidation,
  createAppointmentValidation,
  rescheduleValidation,
};
