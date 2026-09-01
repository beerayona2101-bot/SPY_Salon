const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    sparse: true
  },
  tokenHash: {
    type: String,
    sparse: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  deviceType: {
    type: String,
    default: 'Desktop'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  os: {
    type: String,
    default: 'Unknown OS'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: String,
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

refreshTokenSchema.index({ user: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.isRevoked && !this.revokedAt && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
