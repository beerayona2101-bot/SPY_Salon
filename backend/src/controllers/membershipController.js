/**
 * SPY Salon VIP Membership Controller
 * Endpoint handlers for membership plans, purchases, status checks, and admin management.
 */

const membershipService = require('../services/membershipService');
const CustomerMembership = require('../models/CustomerMembership');
const User = require('../models/User');

// GET /api/v1/membership/plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await membershipService.getMembershipPlans();
    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch membership plans.',
      error: error.message
    });
  }
};

// GET /api/v1/membership/plan/:tier
exports.getPlanDetails = async (req, res) => {
  try {
    const tier = req.params.tier;
    const plan = await membershipService.getPlanByCode(tier);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: `Membership plan '${tier}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving package details.',
      error: error.message
    });
  }
};

// POST /api/v1/membership/purchase
exports.purchase = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, planCode, billingCycle, paymentMethod } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !planCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, mobile phone, and selected plan tier.'
      });
    }

    const userId = req.user?._id || null;

    const result = await membershipService.purchaseMembership({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      planCode,
      billingCycle: billingCycle || 'monthly',
      paymentMethod: paymentMethod || 'UPI / Online Card',
      app: req.app
    });

    return res.status(201).json({
      success: true,
      message: `🎉 Membership activated successfully! Welcome to SPY Salon ${result.membership.planName}!`,
      data: result
    });
  } catch (error) {
    console.error('[MembershipController] Purchase error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to process membership purchase.'
    });
  }
};

// GET /api/v1/membership/my-membership
exports.getMyMembership = async (req, res) => {
  try {
    const email = req.query.email || req.user?.email;
    const phone = req.query.phone || req.user?.phone;

    if (!email && !phone) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    const membership = await membershipService.getCustomerMembership({
      $or: [
        ...(email ? [{ customerEmail: String(email).toLowerCase() }] : []),
        ...(phone ? [{ customerPhone: String(phone) }] : [])
      ]
    });

    return res.status(200).json({
      success: true,
      data: membership
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer membership.',
      error: error.message
    });
  }
};

// POST /api/v1/membership/cancel
exports.cancelMembership = async (req, res) => {
  try {
    const { membershipId } = req.body;
    if (!membershipId) {
      return res.status(400).json({ success: false, message: 'Membership ID required.' });
    }

    await CustomerMembership.findOneAndUpdate({ membershipId }, { status: 'Cancelled', autoRenewal: false });

    // Also update User profile if linked
    const membershipRecord = await CustomerMembership.findOne({ membershipId });
    if (membershipRecord) {
      await User.findOneAndUpdate(
        { email: membershipRecord.customerEmail },
        { 'membership.status': 'Cancelled' }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Membership auto-renewal cancelled successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/membership/admin/analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const analytics = await membershipService.getAdminMembershipAnalytics();
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin membership analytics.',
      error: error.message
    });
  }
};

// PATCH /api/v1/membership/admin/status
exports.updateStatus = async (req, res) => {
  try {
    const { membershipId, status } = req.body;
    if (!membershipId || !status) {
      return res.status(400).json({ success: false, message: 'Membership ID and new status required.' });
    }

    await CustomerMembership.findOneAndUpdate({ membershipId }, { status });

    // Also update user profile
    const membershipRecord = await CustomerMembership.findOne({ membershipId });
    if (membershipRecord) {
      await User.findOneAndUpdate(
        { email: membershipRecord.customerEmail },
        { 'membership.status': status }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Membership ${membershipId} status updated to ${status}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
