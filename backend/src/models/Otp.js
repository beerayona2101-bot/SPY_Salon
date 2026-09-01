const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { 
    type: String, 
    required: true 
  },
  hashedOtp: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['login', 'reset-password', 'verification'],
    default: 'verification' 
  }
}, { timestamps: true });

otpSchema.index({ identifier: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired documents

module.exports = mongoose.model('Otp', otpSchema);
