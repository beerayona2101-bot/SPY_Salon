const store = require('../data/store');

exports.getUserAppointments = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.appointments.length,
    data: store.appointments
  });
};

exports.getUserMembership = async (req, res) => {
  return res.status(200).json({
    success: true,
    hasActiveMembership: false,
    offers: [
      { id: 'o1', title: 'WELCOME LUXURY 20', code: 'SPYFIRST20', discountPercentage: 20, description: 'Get flat 20% off on your first salon service booking.', validUntil: '2026-12-31' },
      { id: 'o2', title: 'GOLD FACIAL SPECIAL', code: 'GOLDFACIAL', discountPercentage: 25, description: 'Save 25% on all 24K Gold & Diamond Skin Care treatments.', validUntil: '2026-12-31' },
      { id: 'o3', title: 'SPA WEEKEND RELAX', code: 'SPAWEEKEND', discountPercentage: 15, description: 'Special 15% discount on Aromatherapy & Deep Tissue Massage packages.', validUntil: '2026-12-31' }
    ]
  });
};

exports.getUserNotifications = async (req, res) => {
  const { email, phone } = req.query;
  let matches = [...store.userNotifications];

  if (email || phone) {
    matches = matches.filter(n => 
      (email && n.customerEmail && n.customerEmail.toLowerCase() === email.toLowerCase()) ||
      (phone && n.customerPhone && n.customerPhone.includes(phone))
    );
  }

  // Fallback default notifications if array is empty
  if (matches.length === 0) {
    matches = [
      {
        _id: 'notif_welcome',
        timestamp: new Date().toISOString(),
        title: 'Welcome to SPY Salon 🌸',
        message: 'Book hair & skin appointments online with instant specialist selection.',
        read: false,
        type: 'info'
      }
    ];
  }

  return res.status(200).json({
    success: true,
    count: matches.length,
    data: matches
  });
};

exports.clearUserNotifications = async (req, res) => {
  const { email, phone } = req.body;
  
  if (email || phone) {
    store.userNotifications = store.userNotifications.filter(n => 
      !(
        (email && n.customerEmail && n.customerEmail.toLowerCase() === email.toLowerCase()) ||
        (phone && n.customerPhone && n.customerPhone.includes(phone))
      )
    );
  } else {
    store.userNotifications = [];
  }

  return res.status(200).json({ success: true, message: 'All notifications cleared.' });
};
