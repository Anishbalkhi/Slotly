const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Appointment must belong to a business'],
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Appointment must reference a service'],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Appointment must belong to a customer'],
      index: true,
    },
    start: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    end: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled'],
        message: 'Status must be confirmed or cancelled',
      },
      default: 'confirmed',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────
// Fast lookup: all appointments for a business in a time range
appointmentSchema.index({ businessId: 1, start: 1 });

// Fast lookup: all appointments for a customer
appointmentSchema.index({ customerId: 1, start: -1 });

// Prevent the same customer from double-booking the exact same slot
appointmentSchema.index(
  { businessId: 1, customerId: 1, start: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
  }
);

// Compound index for overlap queries during conflict detection
appointmentSchema.index({ businessId: 1, status: 1, start: 1, end: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
