const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// Authenticated user notifications — identity resolved from JWT
router.get('/', protect, notificationController.getNotifications);
router.get('/unread', protect, notificationController.getUnreadCount);
router.post('/', notificationController.createNotification);
router.post('/device-token', notificationController.registerDeviceToken);
router.delete('/device-token', notificationController.unregisterDeviceToken);
router.patch('/read-all', protect, notificationController.markAllAsRead);
router.patch('/read/:id', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

