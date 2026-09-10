const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
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
    enum: ['admin', 'manager', 'receptionist', 'employee', 'customer', 'all'],
    default: 'customer',
    index: true
  },
  fcmToken: {
    type: String,
    required: [true, 'FCM token is required'],
    unique: true,
    trim: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    default: 'android'
  },
  deviceId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ email: 1, isActive: 1 });
deviceTokenSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
