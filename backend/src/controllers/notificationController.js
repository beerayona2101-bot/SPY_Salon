const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Universal Notification Dispatcher (Saves to Mongo + Emits Targeted Socket.io Event + Triggers FCM Push)
 */
const dispatchNotification = async (reqApp, notifData) => {
  try {
    // Universal Idempotency: Prevent duplicate notifications for same event reference & recipient
    const refEventId = notifData.bookingId || notifData.leaveRequestId || notifData.reviewId || notifData.enquiryId || notifData.appointmentId;
    if (refEventId) {
      const queryOr = [];
      if (notifData.bookingId) queryOr.push({ bookingId: notifData.bookingId });
      if (notifData.leaveRequestId) queryOr.push({ leaveRequestId: notifData.leaveRequestId });
      if (notifData.reviewId) queryOr.push({ reviewId: notifData.reviewId });
      if (notifData.enquiryId) queryOr.push({ enquiryId: notifData.enquiryId });
      if (notifData.appointmentId) queryOr.push({ appointmentId: notifData.appointmentId });

      const query = { $or: queryOr };
      if (notifData.userId) query.userId = String(notifData.userId);
      else if (notifData.email) query.email = String(notifData.email).toLowerCase().trim();
      else if (notifData.role) query.role = notifData.role;

      const existing = await Notification.findOne(query);
      if (existing) {
        return existing.toObject();
      }
    }

    const notificationId = notifData.notificationId || ('NOTIF-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900));
    const payload = {
      notificationId,
      userId: notifData.userId ? String(notifData.userId) : null,
      email: notifData.email ? notifData.email.toLowerCase().trim() : null,
      role: notifData.role || 'all',
      title: notifData.title || 'System Notification',
      message: notifData.message || '',
      type: notifData.type || 'system',
      icon: notifData.icon || '',
      priority: notifData.priority || 'normal',
      isRead: false,
      link: notifData.link || '',
      bookingId: notifData.bookingId || null,
      appointmentId: notifData.appointmentId || null,
      leaveRequestId: notifData.leaveRequestId || null,
      reviewId: notifData.reviewId || null,
      enquiryId: notifData.enquiryId || null
    };

    const savedNotif = await Notification.create(payload);
    const notifObj = savedNotif.toObject();

    // Emit live targeted Socket.io events
    const io = reqApp ? reqApp.get('io') : null;
    if (io) {
      if (payload.userId) {
        io.to(`room:user_${payload.userId}`).emit('notification:new', notifObj);
      }
      if (payload.email) {
        io.to(`room:user_${payload.email}`).emit('notification:new', notifObj);
      }
      if (payload.role === 'admin') {
        io.to('room:admin').emit('notification:new', notifObj);
      }
      io.emit('notifications:updated', { role: payload.role, email: payload.email, userId: payload.userId });
    }

    // Asynchronously dispatch FCM Mobile Push Notification (Non-blocking)
    setImmediate(async () => {
      try {
        const firebaseNotificationService = require('../services/firebaseNotificationService');
        const pushData = {
          notificationId: notifObj.notificationId || '',
          type: notifObj.type || 'system',
          bookingId: notifObj.bookingId || '',
          appointmentId: notifObj.appointmentId || '',
          leaveRequestId: notifObj.leaveRequestId || '',
          reviewId: notifObj.reviewId || '',
          enquiryId: notifObj.enquiryId || '',
          link: notifObj.link || ''
        };

        if (payload.userId || payload.email) {
          await firebaseNotificationService.sendPushNotificationToUser({
            userId: payload.userId,
            email: payload.email,
            title: payload.title,
            body: payload.message,
            data: pushData
          });
        } else if (payload.role && payload.role !== 'all' && payload.role !== 'public') {
          await firebaseNotificationService.sendPushNotificationToRole({
            role: payload.role,
            title: payload.title,
            body: payload.message,
            data: pushData
          });
        }
      } catch (fcmErr) {
        console.error('[NotificationController] Non-blocking FCM dispatch warning:', fcmErr.message);
      }
    });

    return notifObj;
  } catch (error) {
    console.error('[NotificationController] Error dispatching notification:', error);
    return null;
  }
};

exports.dispatchNotification = dispatchNotification;

// POST /api/v1/notifications/device-token
exports.registerDeviceToken = async (req, res, next) => {
  try {
    const { fcmToken, platform = 'android', deviceId = '', role = 'customer' } = req.body;
    if (!fcmToken) {
      throw ApiError.badRequest('fcmToken is required');
    }

    const userId = req.user ? String(req.user._id || req.user.id) : (req.body.userId || null);
    const email = req.user ? req.user.email : (req.body.email || null);
    const userRole = req.user ? req.user.role : role;

    const updatedToken = await DeviceToken.findOneAndUpdate(
      { fcmToken },
      {
        userId,
        email: email ? String(email).toLowerCase().trim() : null,
        role: userRole,
        platform,
        deviceId,
        isActive: true,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return ApiResponse.success(res, updatedToken, 'FCM Device token registered successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/device-token
exports.unregisterDeviceToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      throw ApiError.badRequest('fcmToken is required');
    }

    await DeviceToken.updateMany({ fcmToken }, { isActive: false });
    return ApiResponse.success(res, null, 'FCM Device token unregistered successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { role = 'all', userId, email } = req.query;
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    
    // If unauthenticated guest request without userId/email, return only public notifications
    const isGuest = (role === 'guest' || role === 'user') && !userId && !cleanEmail;

    let query = {};
    if (role === 'admin') {
      query = { $or: [{ role: 'admin' }, { role: 'all' }] };
    } else if (role === 'employee') {
      const empConditions = [];
      if (userId) empConditions.push({ userId: String(userId) });
      if (cleanEmail) empConditions.push({ email: cleanEmail });

      query = {
        $or: [
          ...(empConditions.length > 0 ? empConditions : []),
          { role: 'employee', userId: null, email: null }
        ]
      };
    } else if (isGuest) {
      query = { role: 'public' };
    } else {
      // Customer / User profile notifications strictly for this customer
      const targetConditions = [];
      if (userId) targetConditions.push({ userId: String(userId) });
      if (cleanEmail) targetConditions.push({ email: cleanEmail });

      if (targetConditions.length > 0) {
        query = {
          $or: [
            ...targetConditions,
            { role: 'all' }
          ]
        };
      } else {
        query = { role: 'public' };
      }
    }
    
    const limitNum = Math.min(parseInt(req.query.limit) || 25, 50);
    const list = await Notification.find(query)
      .select('notificationId userId email role title message type icon priority isRead link bookingId appointmentId leaveRequestId reviewId enquiryId createdAt')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    return ApiResponse.success(res, list, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications/unread
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { role = 'all', userId, email } = req.query;
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    const isGuest = (role === 'guest' || role === 'user') && !userId && !cleanEmail;

    let query = { isRead: false };
    if (role === 'admin') {
      query.$or = [{ role: 'admin' }, { role: 'all' }];
    } else if (role === 'employee') {
      const empConditions = [];
      if (userId) empConditions.push({ userId: String(userId) });
      if (cleanEmail) empConditions.push({ email: cleanEmail });

      query.$or = [
        ...(empConditions.length > 0 ? empConditions : []),
        { role: 'employee', userId: null, email: null }
      ];
    } else if (isGuest) {
      query.role = 'public';
    } else {
      const targetConditions = [];
      if (userId) targetConditions.push({ userId: String(userId) });
      if (cleanEmail) targetConditions.push({ email: cleanEmail });

      if (targetConditions.length > 0) {
        query.$or = [
          ...targetConditions,
          { role: 'all' }
        ];
      } else {
        query.role = 'public';
      }
    }
    
    const count = await Notification.countDocuments(query);
    return ApiResponse.success(res, { unreadCount: count }, 'Unread count fetched');
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/notifications
exports.createNotification = async (req, res, next) => {
  try {
    const created = await dispatchNotification(req.app, req.body);
    return ApiResponse.created(res, created, 'Notification created and dispatched');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/read/:id
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updated = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }

    if (!updated) {
      updated = await Notification.findOneAndUpdate({ notificationId: id }, { isRead: true }, { new: true });
    }

    if (!updated) {
      throw ApiError.notFound('Notification not found');
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:updated', { id, isRead: true });
    }

    return ApiResponse.success(res, updated, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { role = 'all', userId, email } = req.body || req.query;

    const targetConditions = [];
    if (userId) targetConditions.push({ userId: String(userId) });
    if (email) targetConditions.push({ email: String(email).toLowerCase().trim() });

    let query = { isRead: false };
    if (role === 'admin') {
      query.$or = [{ role: 'admin' }, { role: 'all' }];
    } else if (role === 'employee') {
      query.$or = [
        ...(targetConditions.length > 0 ? targetConditions : []),
        { role: 'employee', userId: null, email: null }
      ];
    } else if (targetConditions.length > 0) {
      query.$or = [...targetConditions, { role: 'all' }];
    } else {
      query.role = 'public';
    }
    await Notification.updateMany(query, { isRead: true });

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:read_all', { role, userId });
      io.emit('notifications:updated', { role, userId });
    }

    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (mongoose.Types.ObjectId.isValid(id)) {
      const resVal = await Notification.findByIdAndDelete(id);
      if (resVal) deleted = true;
    }

    if (!deleted) {
      const resVal = await Notification.deleteOne({ notificationId: id });
      if (resVal.deletedCount > 0) deleted = true;
    }

    if (!deleted) throw ApiError.notFound('Notification not found');

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:deleted', { id });
      io.emit('notifications:updated', {});
    }

    return ApiResponse.success(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/clear-all
exports.clearAllNotifications = async (req, res, next) => {
  try {
    const { role = 'all', userId, email } = req.body || req.query;

    const targetConditions = [];
    if (userId) targetConditions.push({ userId: String(userId) });
    if (email) targetConditions.push({ email: String(email).toLowerCase().trim() });

    let query = {};
    if (role === 'admin') {
      query.$or = [{ role: 'admin' }, { role: 'all' }];
    } else if (role === 'employee') {
      query.$or = [
        ...(targetConditions.length > 0 ? targetConditions : []),
        { role: 'employee', userId: null, email: null }
      ];
    } else if (targetConditions.length > 0) {
      query.$or = [...targetConditions, { role: 'all' }];
    } else {
      query.role = 'public';
    }
    await Notification.deleteMany(query);

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:cleared', { role, userId });
      io.emit('notifications:updated', { role, userId });
    }

    return ApiResponse.success(res, null, 'All notifications cleared cleanly');
  } catch (error) {
    next(error);
  }
};
