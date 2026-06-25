const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Service must belong to a business'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    duration: {
      type: Number,
      required: [true, 'Duration (in minutes) is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 8 hours (480 minutes)'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    capacity: {
      type: Number,
      default: 1,
      min: [1, 'Capacity must be at least 1'],
    },
    bufferMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Buffer time cannot be negative'],
    },
    type: {
      type: String,
      enum: ['individual', 'group'],
      default: 'individual',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying services by business
serviceSchema.index({ businessId: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
