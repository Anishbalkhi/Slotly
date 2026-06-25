const mongoose = require('mongoose');

/**
 * Business hours sub-schema: each day has open/close times (HH:mm format)
 * and a boolean to mark whether the business is open that day.
 */
const dayHoursSchema = new mongoose.Schema(
  {
    isOpen: { type: Boolean, default: false },
    open: { type: String, default: '09:00' },   // HH:mm
    close: { type: String, default: '17:00' },  // HH:mm
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business must belong to an owner'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      zipCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'Asia/Kolkata',
    },
    hours: {
      monday: { type: dayHoursSchema, default: () => ({ isOpen: true, open: '09:00', close: '17:00' }) },
      tuesday: { type: dayHoursSchema, default: () => ({ isOpen: true, open: '09:00', close: '17:00' }) },
      wednesday: { type: dayHoursSchema, default: () => ({ isOpen: true, open: '09:00', close: '17:00' }) },
      thursday: { type: dayHoursSchema, default: () => ({ isOpen: true, open: '09:00', close: '17:00' }) },
      friday: { type: dayHoursSchema, default: () => ({ isOpen: true, open: '09:00', close: '17:00' }) },
      saturday: { type: dayHoursSchema, default: () => ({ isOpen: false, open: '10:00', close: '14:00' }) },
      sunday: { type: dayHoursSchema, default: () => ({ isOpen: false }) },
    },
    maxAdvanceDays: {
      type: Number,
      default: 30,
      min: [1, 'Must allow at least 1 day advance booking'],
      max: [365, 'Cannot exceed 365 days advance booking'],
    },
    logo: {
      type: String,
      default: '',
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
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

// Virtual: populate services
businessSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'businessId',
  justOne: false,
});

// Text index for search
businessSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Business', businessSchema);
