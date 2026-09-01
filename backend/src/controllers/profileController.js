/**
 * Production Profile Management Controller
 * SPY Salon Enterprise System
 */
const User = require('../models/User');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Branch = require('../models/Branch');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const bcrypt = require('bcryptjs');

// Calculate profile completeness percentage
const calculateProfileCompleteness = (user) => {
  const fields = ['email', 'phone', 'gender', 'dob', 'anniversary', 'address', 'emergencyContact', 'avatar'];
  const missing = [];
  let filled = 2; // name and role are always filled
  const total = fields.length + 2;

  fields.forEach(field => {
    if (user[field] && String(user[field]).trim() !== '') {
      filled++;
    } else {
      missing.push(field);
    }
  });

  const percent = Math.round((filled / total) * 100);
  return { percent, missing };
};

// Avatar Upload Handler
exports.uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { avatar } = req.body;

    if (!avatar) throw ApiError.badRequest('No avatar image URL provided');

    // Update avatar variants
    const avatarVariants = {
      thumbnail: avatar,
      navbar: avatar,
      card: avatar,
      full: avatar
    };

    const user = await User.findByIdAndUpdate(userId, { avatar, avatarVariants }, { new: true });
    
    // If employee, sync avatar to Employee model as well
    if (user.role === 'employee') {
      await Employee.findByIdAndUpdate(userId, { avatar });
    }

    return ApiResponse.success(res, { avatar, avatarVariants }, 'Profile avatar updated successfully');
  } catch (error) {
    next(error);
  }
};

// Remove Avatar Handler
exports.removeAvatar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findByIdAndUpdate(userId, { 
      avatar: '', 
      avatarVariants: { thumbnail: '', navbar: '', card: '', full: '' } 
    }, { new: true });

    if (user.role === 'employee') {
      await Employee.findByIdAndUpdate(userId, { avatar: '' });
    }

    return ApiResponse.success(res, null, 'Avatar removed successfully');
  } catch (error) {
    next(error);
  }
};

// Update Profile Details (Triggers completeness validation)
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { 
      name, 
      gender, 
      dob, 
      anniversary, 
      address, 
      emergencyContact, 
      preferredLanguage, 
      preferredCommunication, 
      notificationPreferences 
    } = req.body;

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Account not found');

    if (name) user.name = name;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (anniversary !== undefined) user.anniversary = anniversary;
    if (address !== undefined) user.address = address;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (preferredCommunication) user.preferredCommunication = preferredCommunication;
    
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    // Recalculate completeness
    const completeness = calculateProfileCompleteness(user);
    user.profileCompleteness = completeness.percent;
    user.missingFields = completeness.missing;

    await user.save();

    // If employee, sync name to Employee model
    if (user.role === 'employee') {
      await Employee.findByIdAndUpdate(userId, { name: user.name });
    }

    await ActivityLog.create({
      action: 'Profile Updated',
      details: `${user.name} updated profile details. Completeness: ${user.profileCompleteness}%`,
      user: user.name,
      branchId: user.branchId || null
    });

    user.password = undefined;
    return ApiResponse.success(res, user, 'Profile details updated successfully');
  } catch (error) {
    next(error);
  }
};

// Update Account Password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('Please provide a new password (minimum 6 characters).');
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Account not found');

    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      action: 'Password Changed',
      details: `${user.name} updated account password securely.`,
      user: user.name,
      branchId: user.branchId || null
    });

    return ApiResponse.success(res, null, 'Password updated successfully!');
  } catch (error) {
    next(error);
  }
};

// Retrieve User Package Subscriptions
exports.getUserPackages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    return ApiResponse.success(res, user.packages || [], 'User service packages retrieved');
  } catch (error) {
    next(error);
  }
};

// Book Session using Package Credits (Atomic deduction check)
exports.bookPackageSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { packageId, appointmentDate, appointmentTime, branchName } = req.body;

    if (!packageId || !appointmentDate || !appointmentTime) {
      throw ApiError.badRequest('Please provide packageId, date, and time for session booking');
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Account not found');

    const pkg = user.packages.find(p => p.packageId === packageId);
    if (!pkg) throw ApiError.notFound('Subscribed package not found');

    if (pkg.status !== 'Active' || pkg.remainingSessions <= 0) {
      throw ApiError.badRequest('No remaining sessions left on this package subscription.');
    }

    // Decrement sessions
    pkg.usedSessions += 1;
    pkg.remainingSessions -= 1;
    if (pkg.remainingSessions === 0) {
      pkg.status = 'Completed';
    }

    await user.save();

    // Create Booking Appointment record in MongoDB
    const bookingId = `SPY-PKG-${Math.floor(10000 + Math.random() * 90000)}`;
    const branchDoc = await Branch.findOne({ name: new RegExp(branchName || 'Jubilee Hills', 'i') });
    
    await Appointment.create({
      bookingId,
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      service: pkg.serviceIncluded,
      specialistName: 'Any Available Specialist',
      appointmentDate,
      appointmentTime,
      paymentMethod: 'Package Credits',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      branch: branchName || 'Jubilee Hills Flagship',
      branchId: branchDoc ? branchDoc._id.toString() : null,
      customerId: userId.toString()
    });

    await ActivityLog.create({
      action: 'Package Session Booked',
      details: `${user.name} booked a session for ${pkg.serviceIncluded} using package credit. Remaining: ${pkg.remainingSessions}`,
      user: user.name,
      branchId: branchDoc ? branchDoc._id.toString() : null
    });

    return ApiResponse.success(res, user.packages, `Session booked successfully! Remaining sessions: ${pkg.remainingSessions}`);
  } catch (error) {
    next(error);
  }
};

// Permanently Deactivate / Delete Account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Account not found');

    // Deactivate rather than hard delete to retain customer transaction history
    user.status = 'Inactive';
    await user.save();

    await ActivityLog.create({
      action: 'Account Deactivated',
      details: `Customer ${user.name} requested profile deactivation.`,
      user: user.name,
      branchId: user.branchId || null
    });

    return ApiResponse.success(res, null, 'Your profile has been successfully deactivated.');
  } catch (error) {
    next(error);
  }
};
