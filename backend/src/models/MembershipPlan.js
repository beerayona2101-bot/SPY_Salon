const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['standard', 'premium', 'gold'],
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    required: true
  },
  tagline: {
    type: String,
    default: ''
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  yearlyPrice: {
    type: Number,
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 0
  },
  benefits: [{
    type: String
  }],
  whatsIncluded: [{
    type: String
  }],
  whatsNotIncluded: [{
    type: String
  }],
  termsAndConditions: [{
    type: String
  }],
  faqs: [{
    question: String,
    answer: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  colorScheme: {
    primary: String,
    gradient: String,
    border: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
