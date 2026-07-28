const mongoose = require('mongoose');

const membershipTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  membershipId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  planCode: {
    type: String,
    required: true
  },
  planName: String,
  amount: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  paymentMethod: {
    type: String,
    default: 'UPI / Online Gateway'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
    default: 'Paid'
  },
  type: {
    type: String,
    enum: ['Purchase', 'Renewal', 'Upgrade', 'Refund'],
    default: 'Purchase'
  }
}, { timestamps: true });

module.exports = mongoose.model('MembershipTransaction', membershipTransactionSchema);
