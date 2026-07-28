const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

// Public Plan Routes
router.get('/plans', membershipController.getPlans);
router.get('/plan/:tier', membershipController.getPlanDetails);
router.get('/my-membership', membershipController.getMyMembership);

// Purchase & Manage Routes
router.post('/purchase', membershipController.purchase);
router.post('/cancel', membershipController.cancelMembership);

// Admin Routes
router.get('/admin/analytics', membershipController.getAdminAnalytics);
router.patch('/admin/status', membershipController.updateStatus);

module.exports = router;
