const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txnId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  type: { 
    type: String, 
    enum: ['Credited', 'Debited'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    default: 'UPI' 
  },
  status: { 
    type: String, 
    default: 'Completed' 
  },
  date: {
    type: String
  },
  branchId: { 
    type: String, 
    default: null 
  },
  appointmentId: {
    type: String,
    default: null,
    index: true
  }
}, { timestamps: true });


transactionSchema.index({ type: 1 });
transactionSchema.index({ branchId: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
