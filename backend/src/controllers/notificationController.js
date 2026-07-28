const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const store = require('../data/store');

/**
 * Universal Notification Dispatcher (Saves to Mongo + Emits Socket.io Event + Memory Sync)
 */
exports.dispatchNotification = async (reqApp, notifData) => {
  try {
    const notificationId = notifData.notificationId || ('NOTIF-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900));
    const payload = {
      notificationId,
      userId: notifData.userId || null,
      email: notifData.email ? notifData.email.toLowerCase().trim() : null,
      role: notifData.role || 'all',
      title: notifData.title || 'System Notification',
      message: notifData.message || '',
      type: notifData.type || 'system',
      icon: notifData.icon || '',
      priority: notifData.priority || 'normal',
      isRead: false,
      link: notifData.link || ''
    };

    let savedNotif = null;
    try {
      savedNotif = await Notification.create(payload);
    } catch (dbErr) {
      console.warn('[NotificationController] Mongo save fallback to memory:', dbErr.message);
      savedNotif = {
        _id: 'notif_' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Sync memory store fallback
    if (!store.notifications) store.notifications = [];
    const notifObj = savedNotif.toObject ? savedNotif.toObject() : savedNotif;
    store.notifications.unshift(notifObj);

    // Emit live Socket.io event to all connected clients
    const io = reqApp ? reqApp.get('io') : null;
    if (io) {
      io.emit('notification:new', notifObj);
      io.emit('notifications:updated', { role: payload.role, email: payload.email, userId: payload.userId });
    }

    return notifObj;
  } catch (error) {
    console.error('[NotificationController] Error dispatching notification:', error);
    return null;
  }
};

// GET /api/v1/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { role = 'all', userId, email } = req.query;
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    let list = [];

    // If unauthenticated guest request without userId/email, return only public notifications
    const isGuest = (role === 'guest' || role === 'user') && !userId && !cleanEmail;

    try {
      let query = {};
      if (role === 'admin') {
        query = { $or: [{ role: 'admin' }, { role: 'all' }, { role: 'user' }] };
      } else if (isGuest) {
        query = { role: 'public' };
      } else {
        query = {
          $or: [
            { role: 'user' },
            { role: 'all' },
            ...(userId ? [{ userId }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ...(role && role !== 'all' ? [{ role }] : [])
          ]
        };
      }
      const limitNum = Math.min(parseInt(req.query.limit) || 25, 50);
      list = await Notification.find(query)
        .select('notificationId title message type icon priority isRead link createdAt')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();
    } catch (err) {
      list = store.notifications || [];
    }

    if ((!list || list.length === 0) && store.notifications && store.notifications.length > 0) {
      list = store.notifications;
    }

    // Filter memory list according to auth state
    if (role === 'admin') {
      list = list.filter(n => n.role === 'admin' || n.role === 'all' || n.role === 'user');
    } else if (isGuest) {
      list = list.filter(n => n.role === 'public');
    } else {
      list = list.filter(n => 
        n.role === 'all' || 
        n.role === 'user' ||
        (userId && String(n.userId) === String(userId)) || 
        (cleanEmail && n.email && n.email.toLowerCase().trim() === cleanEmail) ||
        (n.role === role)
      );
    }

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
    let count = 0;

    try {
      let query = { isRead: false };
      if (role === 'admin') {
        query.$or = [{ role: 'admin' }, { role: 'all' }, { role: 'user' }];
      } else if (isGuest) {
        query.role = 'public';
      } else {
        query.$or = [
          { role: 'user' },
          { role: 'all' },
          ...(userId ? [{ userId }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(role && role !== 'all' ? [{ role }] : [])
        ];
      }
      count = await Notification.countDocuments(query);
    } catch (err) {
      const list = store.notifications || [];
      if (isGuest) {
        count = list.filter(n => !n.isRead && n.role === 'public').length;
      } else {
        count = list.filter(n => !n.isRead && (
          n.role === 'all' || 
          n.role === 'user' ||
          (userId && String(n.userId) === String(userId)) ||
          (cleanEmail && n.email && n.email.toLowerCase().trim() === cleanEmail)
        )).length;
      }
    }

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

    try {
      updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    } catch (err) {}

    if (!updated) {
      try {
        updated = await Notification.findOneAndUpdate({ notificationId: id }, { isRead: true }, { new: true });
      } catch (err) {}
    }

    if (store.notifications) {
      const item = store.notifications.find(n => String(n._id) === String(id) || n.notificationId === id);
      if (item) {
        item.isRead = true;
        if (!updated) updated = item;
      }
    }

    // Emit live socket update
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
    const { role = 'all', userId } = req.body;

    try {
      const query = {
        isRead: false,
        $or: [
          { role: 'all' },
          { role: role },
          ...(userId ? [{ userId }] : [])
        ]
      };
      await Notification.updateMany(query, { isRead: true });
    } catch (err) {}

    if (store.notifications) {
      store.notifications.forEach(n => {
        if (n.role === 'all' || n.role === role) {
          n.isRead = true;
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:read_all', { role });
      io.emit('notifications:updated', { role });
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

    try {
      await Notification.findByIdAndDelete(id);
    } catch (err) {
      try {
        await Notification.deleteOne({ notificationId: id });
      } catch (e2) {}
    }

    if (store.notifications) {
      const idx = store.notifications.findIndex(n => String(n._id) === String(id) || n.notificationId === id);
      if (idx !== -1) {
        store.notifications.splice(idx, 1);
      }
    }

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
    const { role = 'all', userId } = req.body || req.query;

    try {
      const query = {
        $or: [
          { role: 'all' },
          { role: role },
          ...(userId ? [{ userId }] : [])
        ]
      };
      await Notification.deleteMany(query);
    } catch (err) {}

    if (store.notifications) {
      store.notifications = store.notifications.filter(n => n.role !== 'all' && n.role !== role);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('notifications:cleared', { role });
      io.emit('notifications:updated', { role });
    }

    return ApiResponse.success(res, null, 'All notifications cleared cleanly');
  } catch (error) {
    next(error);
  }
};

