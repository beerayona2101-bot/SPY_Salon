const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Public Plan Routes
router.get('/plans', membershipController.getPlans);
router.get('/plan/:tier', membershipController.getPlanDetails);

// Purchase & Manage Routes (requires authentication)
router.get('/my-membership', protect, membershipController.getMyMembership);
router.post('/purchase', protect, membershipController.purchase);
router.post('/cancel', protect, membershipController.cancelMembership);

// Admin Routes (requires admin/manager role)
router.get('/admin/analytics', protect, authorize('admin', 'manager'), membershipController.getAdminAnalytics);
router.patch('/admin/status', protect, authorize('admin', 'manager'), membershipController.updateStatus);

module.exports = router;
