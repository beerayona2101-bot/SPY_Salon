const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  description: { type: String, required: true },
  validUntil: { type: Date, required: true },
  applicableServices: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
