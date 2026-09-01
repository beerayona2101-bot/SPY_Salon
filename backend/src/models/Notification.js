const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { 
    type: String, 
    required: true, 
    unique: true, 
    default: () => `NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
    index: true 
  },
  userId: { 
    type: String, 
    default: null,
    index: true 
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
    index: true
  },
  role: { 
    type: String, 
    enum: ['admin', 'employee', 'user', 'all', 'public'], 
    default: 'all',
    index: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  message: { 
    type: String, 
    required: true, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['appointment', 'booking', 'enquiry', 'leave', 'attendance', 'employee', 'customer', 'review', 'payment', 'service', 'system'], 
    default: 'system',
    index: true
  },
  icon: { 
    type: String, 
    default: '' 
  },
  priority: { 
    type: String, 
    enum: ['normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  link: { 
    type: String, 
    default: '' 
  },
  bookingId: {
    type: String,
    default: null,
    index: true
  },
  appointmentId: {
    type: String,
    default: null,
    index: true
  },
  leaveRequestId: {
    type: String,
    default: null,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
