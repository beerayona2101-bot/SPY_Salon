const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  branch: { type: String, required: true },
  service: { type: String, required: true },
  packageTier: { type: String, default: null },
  packageName: { type: String, default: null },
  price: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  staffPreference: { type: String, default: 'Any Available Specialist' },
  specialistName: { type: String, default: 'Any Available Specialist' },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  bookingDateTime: { type: Date, default: Date.now },
  bookingDate: { type: String },
  bookingTimeFormatted: { type: String },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Staff_Accepted', 'Staff_Rejected', 'In Progress', 'Completed', 'Cancelled', 'Reschedule Requested', 'Rescheduled'], 
    default: 'Pending' 
  },
  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Not Selected', 'Razorpay', 'Razorpay (Pre-Paid)'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Partial', 'Pending'],
    default: 'Unpaid'
  },
  paymentDetails: {
    upiId: String,
    transactionId: String,
    transactionRef: String,
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String
  },
  branchId: { type: String, default: null },
  customerId: { type: String, default: null }
}, { timestamps: true });

// Performance Database Indexes
appointmentSchema.index({ appointmentDate: -1, status: 1 });
appointmentSchema.index({ specialistName: 1, appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ customerPhone: 1 });
appointmentSchema.index({ customerEmail: 1 });
appointmentSchema.index({ branch: 1 });
appointmentSchema.index({ branchId: 1 });
appointmentSchema.index({ customerId: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

