const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/appointments', userController.getUserAppointments);
router.post('/appointments/:id/reschedule', userController.requestReschedule);
router.get('/membership', userController.getUserMembership);
router.get('/notifications', userController.getUserNotifications);
router.put('/notifications/read', userController.markNotificationRead);
router.put('/notifications/clear', userController.clearUserNotifications);

module.exports = router;
