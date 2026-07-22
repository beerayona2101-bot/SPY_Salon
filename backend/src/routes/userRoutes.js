const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/appointments', userController.getUserAppointments);
router.get('/membership', userController.getUserMembership);
router.get('/notifications', userController.getUserNotifications);
router.put('/notifications/clear', userController.clearUserNotifications);

module.exports = router;
