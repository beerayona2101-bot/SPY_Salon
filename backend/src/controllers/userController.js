/**
 * User Controller for SPY Salon Enterprise REST API & Realtime Sync
 */
const store = require('../data/store');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { broadcastEvent } = require('../utils/socket');

exports.getUserAppointments = async (req, res, next) => {
  try {
    const appointments = store.appointments || [];
    return ApiResponse.success(res, appointments, 'User appointments retrieved');
  } catch (error) {
    next(error);
  }
};

exports.requestReschedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;

    const appointment = store.appointments.find(a => String(a._id) === String(id) || String(a.bookingId) === String(id));
    if (!appointment) throw ApiError.notFound('Appointment not found');

    appointment.rescheduleRequested = true;
    appointment.rescheduleData = {
      requestedDate: newDate || appointment.appointmentDate,
      requestedTime: newTime || appointment.appointmentTime,
      reason: reason || 'Customer requested date/time change',
      requestedAt: new Date().toISOString()
    };
    appointment.status = 'Reschedule Requested';

    // Broadcast Notifications to Admin & Staff
    store.addNotification(
      'Reschedule Requested 📅',
      `Client ${appointment.customerName} requested to reschedule #${appointment.bookingId} to ${newDate} at ${newTime}.`,
      'warning'
    );

    // Audit Log Entry
    store.logActivity(
      'Reschedule Requested',
      `${appointment.customerName} requested reschedule for #${appointment.bookingId} to ${newDate} at ${newTime}.`
    );

    broadcastEvent('appointment:rescheduled', appointment);
    broadcastEvent('stats:updated', store.getAnalyticsStats());

    return ApiResponse.success(res, appointment, 'Reschedule request submitted successfully!');
  } catch (error) {
    next(error);
  }
};

exports.getUserMembership = async (req, res, next) => {
  try {
    const membershipData = {
      hasActiveMembership: false,
      offers: [
        { id: 'o1', title: 'WELCOME LUXURY 20', code: 'SPYFIRST20', discountPercentage: 20, description: 'Get flat 20% off on your first salon service booking.', validUntil: '2026-12-31' },
        { id: 'o2', title: 'GOLD FACIAL SPECIAL', code: 'GOLDFACIAL', discountPercentage: 25, description: 'Save 25% on all 24K Gold & Diamond Skin Care treatments.', validUntil: '2026-12-31' },
        { id: 'o3', title: 'SPA WEEKEND RELAX', code: 'SPAWEEKEND', discountPercentage: 15, description: 'Special 15% discount on Aromatherapy & Deep Tissue Massage packages.', validUntil: '2026-12-31' }
      ]
    };
    return ApiResponse.success(res, membershipData, 'User membership offers retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getUserNotifications = async (req, res, next) => {
  try {
    const { email, phone } = req.query;
    let matches = [...(store.userNotifications || [])];

    if (email || phone) {
      matches = matches.filter(n => 
        (email && n.customerEmail && n.customerEmail.toLowerCase() === email.toLowerCase()) ||
        (phone && n.customerPhone && n.customerPhone.includes(phone))
      );
    }

    // Welcome Notification: Created ONLY ONCE per user account
    if (matches.length === 0 && (email || phone)) {
      const welcomeNotif = {
        _id: `welcome_${(email || phone).replace(/[^a-zA-Z0-9]/g, '')}`,
        timestamp: new Date().toISOString(),
        customerEmail: email || '',
        customerPhone: phone || '',
        title: 'Welcome to SPY Salon 🌸',
        message: 'Book hair & skin appointments online with instant specialist selection.',
        read: false,
        type: 'info'
      };
      store.userNotifications.unshift(welcomeNotif);
      matches = [welcomeNotif];
    }

    return ApiResponse.success(res, matches, 'User notifications retrieved');
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId, email, phone } = req.body;

    if (store.userNotifications) {
      store.userNotifications.forEach(n => {
        if (!notificationId || String(n._id) === String(notificationId)) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
    }

    if (store.notifications) {
      store.notifications.forEach(n => {
        if (!notificationId || String(n._id) === String(notificationId)) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
    }

    broadcastEvent('notification:read', { notificationId, email, phone });
    return ApiResponse.success(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

exports.clearUserNotifications = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    
    if (email || phone) {
      store.userNotifications = (store.userNotifications || []).filter(n => 
        !(
          (email && n.customerEmail && n.customerEmail.toLowerCase() === email.toLowerCase()) ||
          (phone && n.customerPhone && n.customerPhone.includes(phone))
        )
      );
    } else {
      store.userNotifications = [];
    }

    broadcastEvent('notification:cleared', { email, phone });
    return ApiResponse.success(res, null, 'All notifications cleared.');
  } catch (error) {
    next(error);
  }
};
