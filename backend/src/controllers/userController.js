/**
 * User Controller for SPY Salon Enterprise REST API & Realtime Sync
 */
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const CustomerMembership = require('../models/CustomerMembership');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { broadcastEvent } = require('../utils/socket');

exports.getUserHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required to access customer history.');
    }
    if (req.user.role === 'admin' || req.user.role === 'employee') {
      throw ApiError.forbidden(`Role '${req.user.role}' is not authorized to access customer history.`);
    }

    const userConditions = [];

    const userIds = [
      req.user?._id ? req.user._id.toString() : null,
      req.query?.userId,
      req.query?.id
    ].filter(Boolean);
    for (const uid of userIds) {
      if (String(uid).trim()) userConditions.push({ customerId: String(uid).trim() });
    }

    const emails = [req.user?.email, req.query?.email].filter(Boolean);
    for (const em of emails) {
      const cleanEmail = String(em).toLowerCase().trim();
      if (cleanEmail.length > 0) {
        userConditions.push({ customerEmail: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }
    }

    const phones = [req.user?.phone, req.query?.phone].filter(Boolean);
    for (const ph of phones) {
      const cleanPhone = String(ph).trim();
      if (cleanPhone.length > 0) {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.length >= 7) {
          userConditions.push({ customerPhone: new RegExp(digits.slice(-10), 'i') });
        } else {
          userConditions.push({ customerPhone: new RegExp(cleanPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
        }
      }
    }

    const names = [req.user?.name, req.query?.name].filter(Boolean);
    for (const nm of names) {
      const cleanName = String(nm).trim();
      if (cleanName.length > 0) {
        userConditions.push({ customerName: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }
    }

    if (userConditions.length === 0) {
      return ApiResponse.success(res, [], 'Customer history retrieved');
    }

    const historyItems = await Appointment.find({
      $or: userConditions
    }).sort({ createdAt: -1 });

    return ApiResponse.success(res, historyItems, 'Customer history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getUserAppointments = async (req, res, next) => {
  try {
    const userConditions = [];

    const userIds = [
      req.user?._id ? req.user._id.toString() : null,
      req.query?.userId,
      req.query?.id
    ].filter(Boolean);
    for (const uid of userIds) {
      if (String(uid).trim()) userConditions.push({ customerId: String(uid).trim() });
    }

    const emails = [req.user?.email, req.query?.email].filter(Boolean);
    for (const em of emails) {
      const cleanEmail = String(em).toLowerCase().trim();
      if (cleanEmail.length > 0) {
        userConditions.push({ customerEmail: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }
    }

    const phones = [req.user?.phone, req.query?.phone].filter(Boolean);
    for (const ph of phones) {
      const cleanPhone = String(ph).trim();
      if (cleanPhone.length > 0) {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.length >= 7) {
          userConditions.push({ customerPhone: new RegExp(digits.slice(-10), 'i') });
        } else {
          userConditions.push({ customerPhone: new RegExp(cleanPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
        }
      }
    }

    const names = [req.user?.name, req.query?.name].filter(Boolean);
    for (const nm of names) {
      const cleanName = String(nm).trim();
      if (cleanName.length > 0) {
        userConditions.push({ customerName: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }
    }

    if (userConditions.length === 0) {
      return ApiResponse.success(res, [], 'User appointments retrieved');
    }

    const appointments = await Appointment.find({
      $or: userConditions
    }).sort({ createdAt: -1 });

    return ApiResponse.success(res, appointments, 'User appointments retrieved');
  } catch (error) {
    next(error);
  }
};

exports.requestReschedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;
    const userId = req.user._id.toString();

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { bookingId: id };
    const appointment = await Appointment.findOne(query);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    // Ownership Authorization check
    if (appointment.customerId && appointment.customerId !== userId && req.user.role !== 'admin') {
      throw ApiError.forbidden('You are not authorized to reschedule this appointment.');
    }

    // Eligibility check
    const currentStatus = appointment.status || 'Pending';
    if (['Completed', 'Cancelled', 'No Show'].includes(currentStatus)) {
      throw ApiError.badRequest(`Cannot request reschedule for appointment with status '${currentStatus}'.`);
    }

    appointment.rescheduleRequested = true;
    appointment.rescheduleData = {
      requestedDate: newDate || appointment.appointmentDate,
      requestedTime: newTime || appointment.appointmentTime,
      reason: reason || 'Customer requested date/time change',
      requestedAt: new Date().toISOString()
    };
    appointment.status = 'Reschedule Requested';
    appointment.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: 'Reschedule Requested',
      updatedBy: req.user.name || appointment.customerName,
      updatedRole: req.user.role || 'customer',
      timestamp: new Date(),
      note: `Customer requested reschedule to ${newDate} at ${newTime}`
    });
    await appointment.save();

    // Create Admin In-app Alert Notification
    await Notification.create({
      recipientRole: 'admin',
      title: 'Reschedule Requested 📅',
      message: `Client ${appointment.customerName} requested to reschedule #${appointment.bookingId} to ${newDate} at ${newTime}.`,
      type: 'booking',
      branchId: appointment.branchId
    });

    // Audit Log Entry
    await ActivityLog.create({
      action: 'Reschedule Requested',
      details: `${appointment.customerName} requested reschedule for #${appointment.bookingId} to ${newDate} at ${newTime}.`,
      user: appointment.customerName,
      branchId: appointment.branchId
    });

    broadcastEvent('appointment:rescheduled', appointment);
    broadcastEvent('appointment:updated', { appointment });
    return ApiResponse.success(res, appointment, 'Reschedule request submitted successfully!');
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id.toString();

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { bookingId: id };
    const appointment = await Appointment.findOne(query);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    // Ownership Authorization check
    if (appointment.customerId && appointment.customerId !== userId && req.user.role !== 'admin') {
      throw ApiError.forbidden('You are not authorized to cancel this appointment.');
    }

    const currentStatus = appointment.status || 'Pending';
    if (['Completed', 'Cancelled', 'No Show'].includes(currentStatus)) {
      throw ApiError.badRequest(`Cannot cancel appointment that is already ${currentStatus}.`);
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = reason || 'Cancelled by customer';
    appointment.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: 'Cancelled',
      updatedBy: req.user.name || appointment.customerName,
      updatedRole: req.user.role || 'customer',
      timestamp: new Date(),
      note: reason || 'Cancelled by customer'
    });
    await appointment.save();

    // Notify admins
    await Notification.create({
      recipientRole: 'admin',
      title: 'Appointment Cancelled 🔴',
      message: `Booking #${appointment.bookingId} (${appointment.service}) was cancelled by client.`,
      type: 'booking',
      branchId: appointment.branchId
    });

    // Audit log
    await ActivityLog.create({
      action: 'Appointment Cancelled',
      details: `Booking #${appointment.bookingId} cancelled. Reason: ${appointment.cancellationReason}`,
      user: appointment.customerName,
      branchId: appointment.branchId
    });

    broadcastEvent('appointment:cancelled', appointment);
    broadcastEvent('appointment:updated', { appointment });

    return ApiResponse.success(res, appointment, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

exports.getUserMembership = async (req, res, next) => {
  try {
    const email = req.user.email;
    const membership = await CustomerMembership.findOne({ customerEmail: email, status: 'Active' });

    const membershipData = {
      hasActiveMembership: !!membership,
      membership: membership || null,
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
    const userId = req.user._id.toString();

    // Query notifications meant for this customer
    let list = await Notification.find({
      $or: [
        { recipientUserId: userId },
        { recipientUserId: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    // Welcome Notification: Created automatically if empty
    if (list.length === 0) {
      const welcome = await Notification.create({
        recipientUserId: userId,
        title: 'Welcome to SPY Salon 🌸',
        message: 'Book hair & skin appointments online with instant specialist selection.',
        type: 'info'
      });
      list = [welcome];
    }

    return ApiResponse.success(res, list, 'User notifications retrieved');
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user._id.toString();

    const query = { recipientUserId: userId };
    if (notificationId) query._id = notificationId;

    await Notification.updateMany(query, { read: true, readAt: new Date().toISOString() });

    broadcastEvent('notification:read', { notificationId, userId });
    return ApiResponse.success(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

exports.clearUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    await Notification.deleteMany({ recipientUserId: userId });

    broadcastEvent('notification:cleared', { userId });
    return ApiResponse.success(res, null, 'All notifications cleared.');
  } catch (error) {
    next(error);
  }
};
