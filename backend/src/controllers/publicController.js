const store = require('../data/store');
const Enquiry = require('../models/Enquiry');
const enquiryService = require('../services/enquiryService');
const guestBookingService = require('../services/guestBookingService');
const { getCustomerWhatsAppChatUrl } = require('../services/whatsappService');

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

// Get Single Service by ID, Slug, or Name
exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  const target = String(id).toLowerCase().trim();
  const normalizeSlug = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const match = store.services.find(s => 
    String(s._id).toLowerCase() === target ||
    String(s.id).toLowerCase() === target ||
    (s.slug && String(s.slug).toLowerCase() === target) ||
    normalizeSlug(s.name) === normalizeSlug(target) ||
    normalizeSlug(s.title) === normalizeSlug(target)
  );

  if (!match) {
    return res.status(404).json({
      success: false,
      message: `Selected service '${id}' not found`
    });
  }

  return res.status(200).json({
    success: true,
    data: match
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

    const targetAppointment = existingIndex !== -1 ? store.appointments[existingIndex] : newAppointment;

    // Async Guest Booking Workflow (Auto-account creation, linking, credentials email, admin alerts, CRM sync)
    setImmediate(async () => {
      try {
        await guestBookingService.processGuestBooking({
          appointment: targetAppointment,
          customerName,
          customerEmail,
          customerPhone,
          service,
          branch,
          specialistName: chosenSpecialist,
          appointmentDate,
          appointmentTime,
          paymentMethod: chosenPayment,
          paymentStatus: initialPaymentStatus
        });
      } catch (gErr) {
        console.error('[PublicController] Guest booking async processing error:', gErr);
      }
    });

    return res.status(201).json({
      success: true,
      message: existingIndex !== -1 ? 'Appointment rescheduled and confirmed successfully!' : 'Appointment booked successfully!',
      data: targetAppointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete appointment booking.', error: error.message });
  }
};

// Contact Us submit endpoint with persistent database save, unique Enquiry ID, Socket.io alerts & Email dispatch
exports.submitContact = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    
    // Delegate to Enquiry Service
    const enquiryRecord = await enquiryService.createEnquiry(req.body, req.app, clientIp);
    const defaultAdminMsg = `Hello SPY Salon Concierge,

I have submitted an enquiry on the website.

🆔 Enquiry ID: ${enquiryRecord.enquiryId}
👤 Name: ${enquiryRecord.name}
📞 Phone: ${enquiryRecord.phone || 'Not Provided'}
📧 Email: ${enquiryRecord.email}

💬 Message:
"${enquiryRecord.message}"`;

    const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER || '919490644434';
    const cleanAdminNum = adminWhatsAppNumber.split(',')[0].replace(/[^0-9]/g, '') || '919490644434';
    const whatsappAdminLink = `https://wa.me/${cleanAdminNum}?text=${encodeURIComponent(defaultAdminMsg)}`;

    const cleanCustomerNum = enquiryRecord.phone ? enquiryRecord.phone.replace(/[^0-9]/g, '') : '';
    const customerWaUrl = cleanCustomerNum ? `https://wa.me/${cleanCustomerNum}` : '';

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your enquiry has been received and our concierge team will respond shortly.',
      data: {
        enquiryId: enquiryRecord.enquiryId,
        name: enquiryRecord.name,
        email: enquiryRecord.email,
        phone: enquiryRecord.phone,
        status: enquiryRecord.status,
        createdAt: enquiryRecord.createdAt,
        whatsappAdminLink,
        whatsappCustomerChatUrl: customerWaUrl
      }
    });

  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('[PublicController] Error submitting enquiry:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process inquiry submission. Please try again or call support.',
      error: error.message 
    });
  }
};
