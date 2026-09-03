const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Protect all user routes
router.use(protect);

router.get('/history', userController.getUserHistory);
router.get('/appointments', userController.getUserAppointments);
router.post('/appointments/:id/reschedule', userController.requestReschedule);
router.post('/appointments/:id/cancel', userController.cancelAppointment);
router.get('/membership', userController.getUserMembership);
router.get('/notifications', userController.getUserNotifications);
router.put('/notifications/read', userController.markNotificationRead);
router.put('/notifications/clear', userController.clearUserNotifications);

module.exports = router;
