const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  branch: { type: String, required: true },
  service: { type: String, required: true },
  staffPreference: { type: String, default: 'Any Available Specialist' },
  specialistName: { type: String, default: 'Any Available Specialist' },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Not Selected'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Partial'],
    default: 'Unpaid'
  },
  paymentDetails: {
    upiId: String,
    transactionId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
