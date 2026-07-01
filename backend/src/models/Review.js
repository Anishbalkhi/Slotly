const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Review must belong to a business'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────
// One review per user per business
reviewSchema.index({ businessId: 1, userId: 1 }, { unique: true });

// ── Static: Recalculate business rating ──────────────────────────────
reviewSchema.statics.calcAverageRating = async function (businessId) {
  const Business = mongoose.model('Business');

  const result = await this.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
    {
      $group: {
        _id: '$businessId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: 0,
      reviewCount: 0,
    });
  }
};

// ── Hooks: auto-update rating on save/remove ─────────────────────────
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.businessId);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.businessId);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
