const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true }, // e.g., Hair, Skin, Spa, Nails, Bridal, Grooming
  description: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 42 },
  image: { type: String },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
