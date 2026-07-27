const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { 
    type: String, 
    required: true, 
    unique: true, 
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
    enum: ['appointment', 'enquiry', 'leave', 'attendance', 'employee', 'customer', 'review', 'payment', 'service', 'system'], 
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
