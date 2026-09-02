const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true, default: 'Hair' }, // e.g., Hair, Skin, Spa, Nails, Bridal, Grooming
  gender: { type: String, default: 'all' }, // all, men, women, kids
  subCategory: { type: String },
  serviceType: { type: String, enum: ['MAIN', 'CATALOGUE', 'INDIVIDUAL'], default: 'CATALOGUE' },
  description: { type: String },
  durationMinutes: { type: Number, required: true, default: 60 },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 42 },
  image: { type: String, default: '' },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  steps: [{
    num: String,
    title: String,
    desc: String
  }],
  benefits: [{ type: String }],
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }
}, { timestamps: true });

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ slug: 1 });
serviceSchema.index({ isPopular: -1 });

module.exports = mongoose.model('Service', serviceSchema);
