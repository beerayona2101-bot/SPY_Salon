const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.get('/unread', notificationController.getUnreadCount);
router.post('/', notificationController.createNotification);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/read/:id', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
