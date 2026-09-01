const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide your mobile phone number'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'receptionist', 'employee', 'customer'],
    default: 'customer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otpCode: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  avatarVariants: {
    thumbnail: String,
    navbar: String,
    card: String,
    full: String
  },
  gender: { 
    type: String, 
    default: '' 
  },
  dob: { 
    type: String, 
    default: '' 
  },
  anniversary: { 
    type: String, 
    default: '' 
  },
  address: { 
    type: String, 
    default: '' 
  },
  emergencyContact: { 
    type: String, 
    default: '' 
  },
  preferredLanguage: { 
    type: String, 
    default: 'English' 
  },
  preferredCommunication: { 
    type: String, 
    default: 'WhatsApp' 
  },
  notificationPreferences: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: true },
    whatsappAlerts: { type: Boolean, default: true },
    promoOffers: { type: Boolean, default: true }
  },
  profileCompleteness: { 
    type: Number, 
    default: 0 
  },
  missingFields: [{ 
    type: String 
  }],
  membership: {
    status: String,
    tier: String,
    code: String,
    badge: String,
    membershipId: String,
    startDate: Date,
    expiryDate: Date,
    discountPercent: Number
  },
  packages: [{
    packageId: String,
    title: String,
    serviceIncluded: String,
    totalSessions: Number,
    usedSessions: Number,
    remainingSessions: Number,
    status: String,
    expiryDate: Date
  }],
  totalSpent: { 
    type: Number, 
    default: 0 
  },
  visits: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  },
  branchId: { 
    type: String, 
    default: null 
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  }
});

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // Prevent double-hashing if password is already a valid bcrypt hash
  if (/^\$2[ayb]\$\d+\$/.test(this.password)) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6-digit OTP for verification / login
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
  return otp;
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // valid for 15 minutes
  return resetToken;
};

// Performance Database Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);


