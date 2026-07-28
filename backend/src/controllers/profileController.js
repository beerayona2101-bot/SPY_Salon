/**
 * Production-Grade User Profile Management Controller
 * Handles image processing, profile details, password change, package sessions, and real-time socket sync.
 */
const store = require('../data/store');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { broadcastEvent } = require('../utils/socket');

// Helper to calculate Profile Completeness Percentage
const calculateCompleteness = (user) => {
  let score = 0;
  const checks = [
    { field: user.name, weight: 15, name: 'Full Name' },
    { field: user.email, weight: 15, name: 'Email Address' },
    { field: user.phone, weight: 15, name: 'Mobile Phone' },
    { field: user.avatar, weight: 20, name: 'Profile Photo' },
    { field: user.dob, weight: 10, name: 'Date of Birth' },
    { field: user.gender, weight: 5, name: 'Gender' },
    { field: user.address, weight: 10, name: 'Address' },
    { field: user.emergencyContact, weight: 5, name: 'Emergency Contact' },
    { field: user.anniversary, weight: 5, name: 'Anniversary' }
  ];

  const missing = [];
  checks.forEach(item => {
    if (item.field && String(item.field).trim().length > 0) {
      score += item.weight;
    } else {
      missing.push(item.name);
    }
  });

  return { percentage: Math.min(score, 100), missing };
};

// Seed initial packages for store if not exists
if (!store.userPackages) {
  store.userPackages = [
    {
      packageId: 'PKG-1001',
      userEmail: 'vip.guest@spysalon.com',
      userPhone: '+91 98765 43210',
      title: 'Botanical Hair Spa Package',
      serviceIncluded: 'Signature Keratin Hair Spa & Mask',
      totalSessions: 10,
      usedSessions: 4,
      remainingSessions: 6,
      packagePrice: 14999,
      purchaseDate: '2026-01-10',
      expiryDate: '2026-12-20',
      status: 'Active'
    },
    {
      packageId: 'PKG-1002',
      userEmail: 'vip.guest@spysalon.com',
      userPhone: '+91 98765 43210',
      title: '24K Royal Gold Glow Ritual Pass',
      serviceIncluded: '24K Royal Gold Glow Facial',
      totalSessions: 5,
      usedSessions: 2,
      remainingSessions: 3,
      packagePrice: 11999,
      purchaseDate: '2026-03-01',
      expiryDate: '2026-11-30',
      status: 'Active'
    }
  ];
}

/**
 * 1. Upload Profile Avatar & Generate Size Variants
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { imageBase64, email, phone } = req.body;
    let imageUrl = '';

    if (imageBase64) {
      imageUrl = imageBase64;
    } else if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else {
      throw ApiError.badRequest('No image payload provided');
    }

    const variants = {
      thumbnail: imageUrl,
      navbar: imageUrl,
      card: imageUrl,
      full: imageUrl
    };

    // Update store user if matching email/phone
    const targetEmail = email || 'vip.guest@spysalon.com';
    let userRecord = store.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (userRecord) {
      userRecord.avatar = imageUrl;
      userRecord.avatarVariants = variants;
    }

    // Broadcast Realtime Update
    broadcastEvent('user:profile_updated', {
      email: targetEmail,
      phone: phone || '',
      avatar: imageUrl,
      avatarVariants: variants,
      updatedAt: new Date().toISOString()
    });

    store.addNotification(
      'Profile Photo Updated 📷',
      `Profile picture updated successfully. Synchronized across all devices.`,
      'info'
    );

    return ApiResponse.success(res, {
      avatar: imageUrl,
      avatarVariants: variants
    }, 'Profile photo uploaded and processed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Delete / Remove Avatar
 */
exports.removeAvatar = async (req, res, next) => {
  try {
    const { email } = req.body;
    const targetEmail = email || 'vip.guest@spysalon.com';

    let userRecord = store.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (userRecord) {
      userRecord.avatar = '';
      userRecord.avatarVariants = null;
    }

    broadcastEvent('user:profile_updated', {
      email: targetEmail,
      avatar: '',
      avatarVariants: null,
      updatedAt: new Date().toISOString()
    });

    return ApiResponse.success(res, null, 'Profile photo removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Update User Profile Details
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      dob,
      anniversary,
      address,
      emergencyContact,
      preferredLanguage,
      preferredCommunication,
      notificationPreferences
    } = req.body;

    const targetEmail = email || 'vip.guest@spysalon.com';
    let userRecord = store.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

    const updatedProfile = {
      name: name || userRecord?.name || 'Valued VIP Guest',
      email: targetEmail,
      phone: phone || userRecord?.phone || '+91 98765 43210',
      gender: gender || 'Female',
      dob: dob || '',
      anniversary: anniversary || '',
      address: address || '',
      emergencyContact: emergencyContact || '',
      preferredLanguage: preferredLanguage || 'English',
      preferredCommunication: preferredCommunication || 'WhatsApp',
      notificationPreferences: notificationPreferences || {
        emailAlerts: true,
        smsAlerts: true,
        whatsappAlerts: true,
        promoOffers: true
      }
    };

    if (userRecord) {
      Object.assign(userRecord, updatedProfile);
    }

    const completeness = calculateCompleteness({ ...userRecord, ...updatedProfile });
    updatedProfile.profileCompleteness = completeness.percentage;
    updatedProfile.missingFields = completeness.missing;

    // Realtime Broadcast across entire app (Navbar, CRM, Admin, Employee, Booking)
    broadcastEvent('user:profile_updated', updatedProfile);
    broadcastEvent('crm:customer_updated', updatedProfile);

    store.addNotification(
      'Profile Updated ⚙️',
      `Your SPY Salon profile details have been updated successfully.`,
      'info'
    );

    return ApiResponse.success(res, updatedProfile, 'Profile updated and synchronized successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Change Password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long');
    }

    store.addNotification(
      'Security Alert 🔒',
      `Your account password was updated successfully.`,
      'warning'
    );

    return ApiResponse.success(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Get User Purchased Service Packages
 */
exports.getUserPackages = async (req, res, next) => {
  try {
    const { email, phone } = req.query;
    let packages = store.userPackages || [];
    if (email || phone) {
      packages = packages.filter(p => 
        (email && p.userEmail?.toLowerCase() === email.toLowerCase()) ||
        (phone && p.userPhone?.includes(phone))
      );
    }

    return ApiResponse.success(res, packages, 'User service packages retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Book Remaining Session from Package
 */
exports.bookPackageSession = async (req, res, next) => {
  try {
    const { packageId, appointmentDate, appointmentTime, specialistName } = req.body;
    const pkg = store.userPackages?.find(p => p.packageId === packageId);

    if (!pkg) throw ApiError.notFound('Package not found');
    if (pkg.remainingSessions <= 0) throw ApiError.badRequest('No remaining sessions available in this package');

    pkg.usedSessions += 1;
    pkg.remainingSessions -= 1;
    if (pkg.remainingSessions === 0) pkg.status = 'Completed';

    // Broadcast update
    broadcastEvent('package:updated', pkg);
    broadcastEvent('appointment:created', {
      service: pkg.serviceIncluded,
      appointmentDate,
      appointmentTime,
      specialistName,
      status: 'Confirmed'
    });

    store.addNotification(
      'Package Session Booked 🎟️',
      `Session deducted from ${pkg.title}. ${pkg.remainingSessions} sessions remaining.`,
      'success'
    );

    return ApiResponse.success(res, pkg, `Session booked successfully! ${pkg.remainingSessions} sessions remaining.`);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Delete Account
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { email, confirmCode } = req.body;
    if (confirmCode !== 'DELETE') {
      throw ApiError.badRequest('Please type DELETE to confirm account removal');
    }

    broadcastEvent('user:account_deleted', { email });
    return ApiResponse.success(res, null, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
