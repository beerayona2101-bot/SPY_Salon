const mongoose = require('mongoose');

const customerMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  membershipId: {
    type: String,
    required: true,
    unique: true
  },
  planCode: {
    type: String,
    required: true,
    enum: ['standard', 'premium', 'gold']
  },
  planName: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  pricePaid: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Refunded'],
    default: 'Paid'
  },
  autoRenewal: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomerMembership', customerMembershipSchema);
