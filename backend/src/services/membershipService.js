/**
 * SPY Salon Enterprise VIP Membership Service
 * Runs exclusively on Mongoose models (no memory store fallbacks).
 */
const MembershipPlan = require('../models/MembershipPlan');
const CustomerMembership = require('../models/CustomerMembership');
const MembershipTransaction = require('../models/MembershipTransaction');
const User = require('../models/User');
const notificationService = require('./notificationService');

// Seed Default Plans Constant
const DEFAULT_PLANS = [
  {
    code: 'standard',
    name: 'Standard Membership',
    badge: '🥉 Standard Member',
    tagline: 'Essential VIP Privileges & Special Perks',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    discountPercentage: 5,
    benefits: [
      '5% Discount on all salon services',
      'Priority Salon Booking',
      'Special Birthday Offer & Gift',
      'Monthly Beauty & Care Tips Newsletter',
      'Dedicated Member Support Desk'
    ],
    whatsIncluded: [
      '5% Flat Discount across Hair, Skin, & Nails',
      'Priority Slot Queue Access',
      'Birthday Celebration Coupon',
      'Member Support via WhatsApp & Phone'
    ],
    whatsNotIncluded: [
      'Free Complimentary Treatments',
      'VIP Lounge Access',
      'Unlimited Priority Booking'
    ],
    termsAndConditions: [
      'Valid for 30 days (Monthly) or 365 days (Yearly) from activation date.',
      'Discount applies to full-price treatments and cannot be combined with clearance flash deals.',
      'Membership is non-transferable.'
    ],
    faqs: [
      { question: 'When does my membership discount start?', answer: 'Your 5% discount is activated instantly upon successful payment and applies to your very next booking.' },
      { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel auto-renewal anytime from your Customer Dashboard.' }
    ],
    colorScheme: {
      primary: '#cd7f32',
      gradient: 'from-amber-700 to-amber-900',
      border: 'border-amber-600/40'
    }
  },
  {
    code: 'premium',
    name: 'Premium Membership',
    badge: '🥈 Premium Member',
    tagline: 'Enhanced Luxury Experience & Monthly Spa Benefits',
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    discountPercentage: 10,
    benefits: [
      '10% Discount on all salon services',
      'Priority Booking & Faster Queue',
      'Free Expert Hair & Skin Consultation',
      'Free Hair Spa Treatment every month',
      'Exclusive Member Flash Offers',
      'Special Birthday Gift',
      'VIP Member Support'
    ],
    whatsIncluded: [
      '10% Flat Discount on all services',
      '1 Complimentary Hair Spa Ritual every month',
      'Free Dermato-Cosmetology Consultation',
      'Priority Queueing at Flagship Branch',
      'Premium Birthday Surprise Gift'
    ],
    whatsNotIncluded: [
      'Complimentary Facial Treatments',
      'VIP Executive Lounge Access'
    ],
    termsAndConditions: [
      'Complimentary Hair Spa must be redeemed within the active monthly cycle.',
      '10% discount applies automatically during online or desk booking.'
    ],
    faqs: [
      { question: 'How do I claim my free Hair Spa?', answer: 'Simply select any Hair Spa service when booking online; your 100% discount for the monthly spa will automatically apply at checkout.' }
    ],
    colorScheme: {
      primary: '#c0c0c0',
      gradient: 'from-slate-400 to-slate-700',
      border: 'border-slate-400/50'
    }
  },
  {
    code: 'gold',
    name: 'Gold VIP Membership',
    badge: '👑 Gold Member',
    tagline: 'Ultimate Luxury Privilege & Complimentary Rituals',
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    discountPercentage: 20,
    benefits: [
      '20% Discount on all salon services',
      'Unlimited Priority Booking',
      'Dedicated Executive VIP Support',
      'Complimentary Hair Spa & Luxury Facial',
      'Exclusive VIP Gala Events & Early Access',
      'Special Festival Offers & Bonuses',
      'VIP Lounge Access at Flagship Outlets',
      'Birthday Premium Luxury Gift',
      'Exclusive Package Pricing & Cashback'
    ],
    whatsIncluded: [
      '20% Flat Discount across all luxury treatments',
      '1 Complimentary Signature Hair Spa & 1 Luxury Gold Facial per month',
      'Unlimited VIP Priority Queueing & Lounge Access',
      'Dedicated Executive Concierge Desk',
      'Double Reward Points on all purchases'
    ],
    whatsNotIncluded: [
      'None! Gold VIP includes all luxury privileges offered by SPY Salon.'
    ],
    termsAndConditions: [
      'Gold VIP membership includes full access to all flagship salon lounges.',
      '20% discount is automatically applied to all services and packages.'
    ],
    faqs: [
      { question: 'What is VIP Lounge Access?', answer: 'Gold VIP members enjoy complimentary refreshments, private styling suites, and complimentary beverage menus while waiting or relaxing.' }
    ],
    colorScheme: {
      primary: '#d4af37',
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      border: 'border-amber-400/60'
    }
  }
];

/**
 * Seed & Retrieve Membership Plans from MongoDB
 */
const getMembershipPlans = async () => {
  let plans = await MembershipPlan.find({ isActive: true }).sort({ monthlyPrice: 1 });
  if (!plans || plans.length === 0) {
    try {
      await MembershipPlan.insertMany(DEFAULT_PLANS);
      plans = await MembershipPlan.find({ isActive: true }).sort({ monthlyPrice: 1 });
    } catch (err) {
      console.error('[MembershipService] Auto-seed error:', err.message);
    }
  }
  return plans || [];
};

/**
 * Get Specific Plan by Code from MongoDB
 */
const getPlanByCode = async (code) => {
  let cleanCode = String(code || 'standard').toLowerCase().trim();
  if (cleanCode === 'silver' || cleanCode === 'bronze' || cleanCode === 'basic') {
    cleanCode = 'standard';
  }
  let plan = await MembershipPlan.findOne({ code: cleanCode });
  if (!plan) {
    const plans = await getMembershipPlans();
    plan = plans.find((p) => p.code === cleanCode || p.name.toLowerCase().includes(cleanCode));
  }
  if (!plan && (cleanCode === 'silver' || cleanCode === 'standard')) {
    const plans = await getMembershipPlans();
    plan = plans.find((p) => p.code === 'standard') || plans[0];
  }
  return plan || null;
};

/**
 * Process Membership Purchase & Activation End-to-End
 */
const purchaseMembership = async ({
  userId = null,
  customerName,
  customerEmail,
  customerPhone,
  planCode,
  billingCycle = 'monthly',
  paymentMethod = 'UPI / Online Gateway',
  app = null
}) => {
  // 1. Fetch Plan Details
  const plan = await getPlanByCode(planCode);
  if (!plan) {
    const err = new Error('Invalid membership plan selected.');
    err.statusCode = 400;
    throw err;
  }

  const isYearly = billingCycle === 'yearly';
  const pricePaid = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  // Calculate Dates
  const startDate = new Date();
  const expiryDate = new Date();
  if (isYearly) {
    expiryDate.setDate(expiryDate.getDate() + 365);
  } else {
    expiryDate.setDate(expiryDate.getDate() + 30);
  }

  // Generate Unique Identifiers
  const membershipId = 'MEMB-' + Math.floor(100000 + Math.random() * 900000);
  const transactionId = 'TXN-MB-' + Date.now();

  // 2. Create Membership Record in MongoDB
  const membershipData = {
    userId,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail).trim().toLowerCase(),
    customerPhone: String(customerPhone).trim(),
    membershipId,
    planCode: plan.code,
    planName: plan.name,
    badge: plan.badge,
    discountPercentage: plan.discountPercentage,
    billingCycle,
    startDate,
    expiryDate,
    status: 'Active',
    pricePaid,
    transactionId,
    paymentStatus: 'Paid',
    autoRenewal: true
  };

  // Cancel any previous active membership for this customer
  await CustomerMembership.updateMany(
    { customerEmail: membershipData.customerEmail, status: 'Active' },
    { status: 'Expired' }
  );

  const createdMembership = await CustomerMembership.create(membershipData);

  // 3. Record Transaction in MongoDB
  const txnData = {
    transactionId,
    membershipId,
    userId,
    customerName: membershipData.customerName,
    customerEmail: membershipData.customerEmail,
    customerPhone: membershipData.customerPhone,
    planCode: plan.code,
    planName: plan.name,
    amount: pricePaid,
    billingCycle,
    paymentMethod,
    paymentStatus: 'Paid',
    type: 'Purchase',
    createdAt: new Date()
  };

  await MembershipTransaction.create(txnData);

  // 4. Update User Profile with VIP Membership Badge & Incremented Total Spend
  const membershipObjForUser = {
    status: 'Active',
    tier: plan.name.replace(' Membership', ''),
    code: plan.code,
    badge: plan.badge,
    membershipId,
    startDate: startDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    discountPercent: plan.discountPercentage
  };

  let targetUser = null;
  if (userId) {
    targetUser = await User.findByIdAndUpdate(
      userId,
      {
        membership: membershipObjForUser,
        $inc: { totalSpent: pricePaid }
      },
      { new: true }
    );
  }

  if (!targetUser) {
    targetUser = await User.findOneAndUpdate(
      { email: membershipData.customerEmail },
      {
        membership: membershipObjForUser,
        $inc: { totalSpent: pricePaid }
      },
      { new: true }
    );
  }

  // Auto-create Customer User account if registration didn't exist yet
  if (!targetUser) {
    const crypto = require('crypto');
    const secureRandomPassword = 'CUST-' + crypto.randomBytes(6).toString('hex');
    targetUser = await User.create({
      name: membershipData.customerName,
      email: membershipData.customerEmail,
      phone: membershipData.customerPhone,
      password: secureRandomPassword,
      role: 'customer',
      isVerified: true,
      membership: membershipObjForUser,
      totalSpent: pricePaid,
      visits: 1
    });
  }

  // 5. Emit Realtime Socket.io Event to Client & Admin
  const io = app ? app.get('io') : null;
  if (io) {
    io.emit('membership_activated', {
      membershipId,
      customerEmail: membershipData.customerEmail,
      customerName: membershipData.customerName,
      badge: plan.badge,
      planName: plan.name
    });
    io.emit('new_membership_transaction', txnData);
  }

  // 6. Trigger Multi-Channel Notifications
  setImmediate(async () => {
    try {
      await notificationService.createNotification({
        recipientType: 'User',
        recipientId: userId || membershipData.customerEmail,
        title: `👑 ${plan.name} Activated!`,
        message: `Congratulations ${membershipData.customerName}! Your ${plan.name} is now ACTIVE (${membershipId}). Enjoy ${plan.discountPercentage}% flat discount on all salon bookings!`,
        type: 'Membership',
        metadata: { membershipId, planCode: plan.code, badge: plan.badge }
      });
    } catch (nErr) {
      console.error('[MembershipService] Notification dispatch error:', nErr.message);
    }
  });

  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'spysalon_super_secret_jwt_key_2026';
  const token = targetUser ? jwt.sign({ id: targetUser._id, role: targetUser.role }, secret, { expiresIn: '7d' }) : null;

  return {
    success: true,
    token,
    user: targetUser,
    membership: createdMembership,
    transaction: txnData,
    userMembership: membershipObjForUser
  };
};

/**
 * Get Customer Active Membership by Email / User ID
 */
const getCustomerMembership = async (identifier) => {
  const query = typeof identifier === 'object' ? identifier : {
    $or: [{ customerEmail: String(identifier).toLowerCase() }, { customerPhone: String(identifier) }]
  };

  const membership = await CustomerMembership.findOne({ ...query, status: 'Active' }).sort({ createdAt: -1 });

  // Check if expired
  if (membership && new Date(membership.expiryDate) < new Date()) {
    membership.status = 'Expired';
    await membership.save();
    return null;
  }

  return membership;
};

/**
 * Admin Membership Analytics & Reporting
 */
const getAdminMembershipAnalytics = async () => {
  const allMemberships = await CustomerMembership.find().sort({ createdAt: -1 });
  const allTxns = await MembershipTransaction.find().sort({ createdAt: -1 });

  const activeMembers = allMemberships.filter(m => m.status === 'Active');
  const expiredMembers = allMemberships.filter(m => m.status === 'Expired');
  const cancelledMembers = allMemberships.filter(m => m.status === 'Cancelled');

  const totalRevenue = allTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyRevenue = allTxns
    .filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const standardCount = activeMembers.filter(m => m.planCode === 'standard').length;
  const premiumCount = activeMembers.filter(m => m.planCode === 'premium').length;
  const goldCount = activeMembers.filter(m => m.planCode === 'gold').length;

  return {
    totalRevenue,
    monthlyRevenue,
    activeCount: activeMembers.length,
    expiredCount: expiredMembers.length,
    cancelledCount: cancelledMembers.length,
    renewalsCount: allTxns.filter(t => t.type === 'Renewal').length,
    tierBreakdown: {
      standard: standardCount,
      premium: premiumCount,
      gold: goldCount
    },
    popularPlan: goldCount >= premiumCount && goldCount >= standardCount ? 'Gold VIP' : premiumCount >= standardCount ? 'Premium' : 'Standard',
    recentMemberships: allMemberships.slice(0, 20),
    transactions: allTxns.slice(0, 20)
  };
};

module.exports = {
  DEFAULT_PLANS,
  getMembershipPlans,
  getPlanByCode,
  purchaseMembership,
  getCustomerMembership,
  getAdminMembershipAnalytics
};
