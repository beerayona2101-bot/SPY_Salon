const store = require('../data/store');

const fallbackBranches = [
  { id: 'b1', name: 'SPY Salon - Flagship Jubilee Hills', code: 'JUB-01', address: 'Road No. 36, Jubilee Hills', city: 'Hyderabad', phone: '+91 98765 43210', email: 'jubilee@spysalon.com', operatingHours: '09:00 AM - 09:00 PM', rating: 4.9, isMainBranch: true },
  { id: 'b2', name: 'SPY Salon - Tech Hub Gachibowli', code: 'GCH-02', address: 'Financial District, Gachibowli', city: 'Hyderabad', phone: '+91 98765 43211', email: 'gachibowli@spysalon.com', operatingHours: '10:00 AM - 09:30 PM', rating: 4.8, isMainBranch: false },
  { id: 'b3', name: 'SPY Salon - Luxury Suite Banjara Hills', code: 'BNJ-03', address: 'Road No. 12, Banjara Hills', city: 'Hyderabad', phone: '+91 98765 43212', email: 'banjara@spysalon.com', operatingHours: '09:30 AM - 09:00 PM', rating: 4.9, isMainBranch: false }
];

const fallbackOffers = [
  { id: 'o1', title: 'WELCOME LUXURY 20', code: 'SPYFIRST20', discountPercentage: 20, description: 'Get flat 20% off on your first salon service booking.', validUntil: '2026-12-31' },
  { id: 'o2', title: 'GOLD FACIAL SPECIAL', code: 'GOLDFACIAL', discountPercentage: 25, description: 'Save 25% on all 24K Gold & Diamond Skin Care treatments.', validUntil: '2026-12-31' },
  { id: 'o3', title: 'SPA WEEKEND RELAX', code: 'SPAWEEKEND', discountPercentage: 15, description: 'Special 15% discount on Aromatherapy & Deep Tissue Massage packages.', validUntil: '2026-12-31' }
];

// Get Services (Reflects Admin Updates Live)
exports.getServices = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.services.length,
    data: store.services
  });
};

// Get Specialists List (Reflects Admin Updates Live)
exports.getSpecialists = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.employees.length,
    data: store.employees
  });
};

// Get Customer Reviews
exports.getReviews = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: store.reviews
  });
};

// Submit Customer Review
exports.submitReview = async (req, res) => {
  const { customerName, customerEmail, serviceName, rating, comment } = req.body;
  if (!customerName || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Please provide name, rating, and comment.' });
  }

  const newReview = {
    _id: 'rev_' + Date.now(),
    customerName,
    customerEmail,
    serviceName: serviceName || 'General Service',
    rating: Number(rating),
    comment
  };

  store.reviews.unshift(newReview);
  return res.status(201).json({ success: true, message: 'Thank you for your review!', data: newReview });
};

// Get Branches
exports.getBranches = async (req, res) => {
  return res.status(200).json({ success: true, count: fallbackBranches.length, data: fallbackBranches });
};

// Get Offers
exports.getOffers = async (req, res) => {
  return res.status(200).json({ success: true, count: fallbackOffers.length, data: fallbackOffers });
};

// Get Booked Time Slots for a Given Date and Specialist
exports.getBookedSlots = async (req, res) => {
  const { date, specialist } = req.query;
  let matches = store.appointments.filter(a => a.status !== 'Cancelled');

  if (date) {
    matches = matches.filter(a => a.appointmentDate === date);
  }

  if (specialist && specialist !== 'Any Available Specialist') {
    matches = matches.filter(a => a.specialistName === specialist || a.specialistName.includes(specialist.split('(')[0].trim()));
  }

  const bookedTimeSlots = matches.map(a => a.appointmentTime);
  return res.status(200).json({
    success: true,
    date: date || 'All',
    specialist: specialist || 'All',
    bookedSlots: bookedTimeSlots
  });
};

// Book Appointment Public Endpoint (Syncs with Admin & Employee Desks)
exports.bookAppointment = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      branch, 
      service, 
      staffPreference, 
      specialistName,
      appointmentDate, 
      appointmentTime, 
      paymentMethod,
      paymentDetails,
      notes 
    } = req.body;

    if (!customerName || !customerPhone || !branch || !service || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking fields.' });
    }

    const chosenSpecialist = specialistName || staffPreference || 'Any Available Specialist';

    // Check slot availability
    const conflict = store.appointments.find(a => 
      a.status !== 'Cancelled' &&
      a.appointmentDate === appointmentDate &&
      a.appointmentTime === appointmentTime &&
      (chosenSpecialist === 'Any Available Specialist' || a.specialistName === chosenSpecialist)
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `The selected time slot ${appointmentTime} on ${appointmentDate} is already booked. Please select another available time slot.`
      });
    }

    const bookingId = 'SPY-' + Math.floor(100000 + Math.random() * 900000);
    const chosenPayment = paymentMethod || 'Cash';
    const initialPaymentStatus = (chosenPayment === 'UPI' || chosenPayment === 'Razorpay') ? 'Paid' : 'Unpaid';
    
    const now = new Date();
    const bookingDateTime = now.toISOString();
    const bookingDateStr = now.toISOString().split('T')[0];
    const bookingTimeFormattedStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAppointment = {
      _id: 'app_' + Date.now(),
      bookingId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      branch,
      service,
      specialistName: chosenSpecialist,
      bookingDateTime,
      bookingDate: bookingDateStr,
      bookingTimeFormatted: bookingTimeFormattedStr,
      appointmentDate,
      appointmentTime,
      paymentMethod: chosenPayment,
      paymentStatus: initialPaymentStatus,
      paymentDetails: paymentDetails || {},
      notes: notes || '',
      status: 'Pending',
      createdAt: bookingDateTime,
      updatedAt: bookingDateTime
    };

    // If this is a reschedule action, update existing appointment & clear old reschedule notifications
    const existingIndex = store.appointments.findIndex(a => 
      (a.customerPhone === customerPhone || a.customerEmail === customerEmail) && a.status === 'Reschedule Requested'
    );

    if (existingIndex !== -1) {
      const oldDate = store.appointments[existingIndex].appointmentDate;
      const oldTime = store.appointments[existingIndex].appointmentTime;
      
      store.appointments[existingIndex].appointmentDate = appointmentDate;
      store.appointments[existingIndex].appointmentTime = appointmentTime;
      store.appointments[existingIndex].status = 'Confirmed';
      store.appointments[existingIndex].service = service;
      store.appointments[existingIndex].specialistName = chosenSpecialist;
      store.appointments[existingIndex].updatedAt = new Date().toISOString();
      // NOTE: bookingDateTime remains completely untouched!

      store.logActivity(
        'Appointment Rescheduled',
        `Rescheduled #${store.appointments[existingIndex].bookingId} for ${customerName}. Old Schedule: ${oldDate} ${oldTime} ➔ New Schedule: ${appointmentDate} ${appointmentTime}. (Booked on: ${store.appointments[existingIndex].bookingDateTime})`
      );
    } else {
      store.appointments.unshift(newAppointment);

      store.logActivity(
        'New Appointment Booked',
        `Client ${customerName} booked #${bookingId} for ${service} scheduled on ${appointmentDate} at ${appointmentTime}. (Booked on: ${bookingDateTime})`
      );
    }

    // Clear old warning reschedule notifications for this customer
    store.userNotifications = store.userNotifications.filter(n => 
      !( (n.customerPhone === customerPhone || n.customerEmail === customerEmail) && n.title.includes('Reschedule') )
    );

    // Push new confirmation notification
    store.addUserNotification(
      customerPhone,
      customerEmail,
      'Reschedule Completed 🟢',
      `Your appointment ${newAppointment.bookingId} for ${service} has been updated to ${appointmentDate} at ${appointmentTime}.`,
      'success'
    );

    // Sync Audit Activity Log & Send Realtime Notification to Admin
    store.logActivity(
      'Customer Reschedule Completed',
      `Client ${customerName} (${customerPhone}) rescheduled ${service} with ${chosenSpecialist} for ${appointmentDate} at ${appointmentTime}`
    );

    store.addNotification(
      'Appointment Slot Updated 🟢',
      `Client ${customerName} rescheduled ${service} to ${appointmentDate} at ${appointmentTime}. Status: Confirmed.`,
      'success'
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment rescheduled and confirmed successfully!',
      data: existingIndex !== -1 ? store.appointments[existingIndex] : newAppointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete appointment booking.', error: error.message });
  }
};

// Contact Us submit endpoint
exports.submitContact = async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in required contact details.' });
  }
  return res.status(200).json({
    success: true,
    message: 'Thank you for reaching out to SPY Salon! We will respond within 2 hours.'
  });
};
