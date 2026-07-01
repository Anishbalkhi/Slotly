const mongoose = require('mongoose');

/**
 * Sub-schema for a single day's working hours.
 * Each entry represents one day a staff member is available.
 */
const dayAvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    start: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Start time must be HH:mm format'],
    },
    end: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'End time must be HH:mm format'],
    },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Staff must belong to a business'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      trim: true,
      default: 'Staff',
      maxlength: [100, 'Role cannot exceed 100 characters'],
    },
    weeklyAvailability: {
      type: [dayAvailabilitySchema],
      default: [
        { day: 1, start: '09:00', end: '17:00' }, // Monday
        { day: 2, start: '09:00', end: '17:00' }, // Tuesday
        { day: 3, start: '09:00', end: '17:00' }, // Wednesday
        { day: 4, start: '09:00', end: '17:00' }, // Thursday
        { day: 5, start: '09:00', end: '17:00' }, // Friday
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────
// Fast lookup: all active staff for a business
staffSchema.index({ businessId: 1, isActive: 1 });

module.exports = mongoose.model('Staff', staffSchema);
