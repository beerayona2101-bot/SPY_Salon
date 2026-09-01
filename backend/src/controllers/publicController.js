const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Leave = require('../models/Leave');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Branch = require('../models/Branch');
const Enquiry = require('../models/Enquiry');
const LandingSettings = require('../models/LandingSettings');
const ActivityLog = require('../models/ActivityLog');
const Transaction = require('../models/Transaction');
const enquiryService = require('../services/enquiryService');
const guestBookingService = require('../services/guestBookingService');

// Get Landing Page Settings
exports.getLandingSettings = async (req, res) => {
  try {
    let settings = await LandingSettings.findOne({ key: 'main_landing_settings' });
    if (!settings) {
      settings = await LandingSettings.create({ 
        key: 'main_landing_settings',
        heroTitle: 'Hairs make perfectly',
        heroSubtitle: 'Style come from the hair style'
      });
    } else {
      let updated = false;
      if (settings.heroTitle === 'SPY Salon | Luxury Beauty Studio & MedSpa' || settings.heroTitle === 'Unveil Your Radiant Beauty' || settings.heroTitle === 'Hairs make perfect') {
        settings.heroTitle = 'Hairs make perfectly';
        updated = true;
      }
      if (!settings.heroSubtitle) {
        settings.heroSubtitle = 'Style come from the hair style';
        updated = true;
      }
      if (updated) {
        await settings.save();
      }
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to convert '11:00 AM' to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(/\s+/);
  const time = parts[0];
  const modifier = parts[1];
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10) || 0;
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Convert '09:00' (24h) to minutes
const time24ToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':');
  return parseInt(hours, 10) * 60 + (parseInt(minutes, 10) || 0);
};

// Verify if a specialist is available at a given date/time slot
const verifySpecialistAvailability = async (specialist, date, timeSlot) => {
  if (!specialist) return { available: true };
  if (specialist.status === 'Inactive') return { available: false, reason: 'Specialist account is currently inactive.' };
  
  // 1. Check leave
  const leaveConflict = await Leave.findOne({
    $or: [
      { employeeName: new RegExp(specialist.name, 'i') },
      ...(specialist._id ? [{ employeeId: specialist._id }] : [])
    ],
    startDate: { $lte: date },
    endDate: { $gte: date },
    status: 'Approved'
  });
  if (leaveConflict) {
    return { available: false, reason: `Specialist is on approved leave from ${leaveConflict.startDate} to ${leaveConflict.endDate}.` };
  }

  // 2. Check overlapping booked appointment
  const cleanSpecName = (specialist.name || '').split(/\s+/)[0];
  if (cleanSpecName) {
    const appointmentConflict = await Appointment.findOne({
      specialistName: { $regex: new RegExp(cleanSpecName, 'i') },
      appointmentDate: date,
      appointmentTime: timeSlot,
      status: { $nin: ['Cancelled'] }
    });
    if (appointmentConflict) {
      return { available: false, reason: 'Specialist already has an appointment booked at this exact date and time slot.' };
    }
  }

  return { available: true };
};

// Get Services (Reflects Admin Updates Live)
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: { $ne: false } }).sort({ category: 1, name: 1 });
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Service by ID, Slug, or Name
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    let service = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    }

    if (!service) {
      const cleanId = String(id).toLowerCase().trim();
      const slugId = cleanId.replace(/[^a-z0-9]+/g, '-');
      service = await Service.findOne({
        $or: [
          { slug: cleanId },
          { slug: slugId },
          { name: new RegExp(`^${cleanId}$`, 'i') },
          { name: new RegExp(`^${cleanId.replace(/-/g, ' ')}$`, 'i') }
        ]
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Selected service '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Specialists List
exports.getSpecialists = async (req, res) => {
  try {
    const specialists = await Employee.find({ status: 'Active' }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: specialists.length,
      data: specialists
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Customer Reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Customer Review
exports.submitReview = async (req, res) => {
  try {
    const { customerName, customerEmail, serviceName, rating, comment } = req.body;
    if (!customerName || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide name, rating, and comment.' });
    }

    const newReview = await Review.create({
      customerName,
      customerEmail,
      serviceName: serviceName || 'General Service',
      rating: Number(rating),
      comment
    });

    return res.status(201).json({ success: true, message: 'Thank you for your review!', data: newReview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Offers
exports.getOffers = async (req, res) => {
  try {
    const offers = [
      { id: 'o1', title: 'WELCOME LUXURY 20', code: 'SPYFIRST20', discountPercentage: 20, description: 'Get flat 20% off on your first salon service booking.', validUntil: '2026-12-31' },
      { id: 'o2', title: 'GOLD FACIAL SPECIAL', code: 'GOLDFACIAL', discountPercentage: 25, description: 'Save 25% on all 24K Gold & Diamond Skin Care treatments.', validUntil: '2026-12-31' },
      { id: 'o3', title: 'SPA WEEKEND RELAX', code: 'SPAWEEKEND', discountPercentage: 15, description: 'Special 15% discount on Aromatherapy & Deep Tissue Massage packages.', validUntil: '2026-12-31' }
    ];
    return res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Booked Time Slots for a Given Date and Specialist
exports.getBookedSlots = async (req, res) => {
  try {
    const { date, specialist } = req.query;
    let query = { status: { $nin: ['Cancelled'] } };

    if (date) {
      query.appointmentDate = date;
    }

    if (specialist && specialist !== 'Any Available Specialist') {
      const cleanName = specialist.split('(')[0].trim();
      query.specialistName = { $regex: new RegExp(cleanName, 'i') };
    }

    const matches = await Appointment.find(query);
    const bookedTimeSlots = matches.map(a => a.appointmentTime);
    
    return res.status(200).json({
      success: true,
      date: date || 'All',
      specialist: specialist || 'All',
      bookedSlots: bookedTimeSlots
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
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

    // Service Validation & Price Resolution
    const serviceDoc = await Service.findOne({
      $or: [
        { name: new RegExp(`^${service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { _id: mongoose.Types.ObjectId.isValid(service) ? service : null }
      ],
      isActive: true
    });

    if (!serviceDoc) {
      return res.status(400).json({ success: false, message: `Requested service "${service}" is currently unavailable or not found.` });
    }

    const validatedPrice = Number(serviceDoc.discountPrice || serviceDoc.price || 0);

    const inputSpecialistName = specialistName || staffPreference || 'Any Available Specialist';
    let chosenSpecialist = null;
    let specialistDoc = null;

    if (inputSpecialistName === 'Any Available Specialist') {
      // 1. Find all active specialists across Employee and User collections
      const specialists = await Employee.find({ status: { $ne: 'Inactive' } });
      const userSpecialists = await User.find({ role: 'employee', status: { $ne: 'Inactive' } });
      const allSpecs = [...specialists, ...userSpecialists];

      // 2. Loop through and check availability
      for (const spec of allSpecs) {
        const check = await verifySpecialistAvailability(spec, appointmentDate, appointmentTime);
        if (check.available) {
          chosenSpecialist = `${spec.name} (Specialist)`;
          specialistDoc = spec;
          break;
        }
      }

      if (!chosenSpecialist) {
        return res.status(409).json({
          success: false,
          message: `No specialist is available for ${appointmentDate} at ${appointmentTime}. Please select another time slot.`
        });
      }
    } else {
      const cleanName = inputSpecialistName.split('(')[0].trim();
      const firstWord = cleanName.split(/\s+/)[0];

      specialistDoc = await Employee.findOne({
        $or: [
          { name: new RegExp(`^${cleanName}$`, 'i') },
          { name: new RegExp(firstWord, 'i') }
        ]
      }) || await User.findOne({
        $or: [
          { name: new RegExp(`^${cleanName}$`, 'i') },
          { name: new RegExp(firstWord, 'i') }
        ],
        role: { $in: ['employee', 'admin', 'receptionist'] }
      });

      if (specialistDoc) {
        const check = await verifySpecialistAvailability(specialistDoc, appointmentDate, appointmentTime);
        if (!check.available) {
          return res.status(409).json({
            success: false,
            message: check.reason
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Specialist "${inputSpecialistName}" could not be found.`
        });
      }
      chosenSpecialist = inputSpecialistName;
    }

    // Branch ID mapping & validation
    const branchDoc = await Branch.findOne({
      $or: [
        { name: new RegExp(branch.split('-').pop().trim(), 'i') },
        { _id: mongoose.Types.ObjectId.isValid(branch) ? branch : null }
      ],
      isActive: true
    });

    if (!branchDoc) {
      return res.status(400).json({ success: false, message: `Requested branch "${branch}" is invalid or inactive.` });
    }
    const branchId = branchDoc._id.toString();

    const bookingId = 'SPY-' + Math.floor(100000 + Math.random() * 900000);
    const chosenPayment = paymentMethod || 'Cash';
    
    // Server-Authoritative Cryptographic Payment & Amount Verification Logic
    let initialPaymentStatus = 'Pending';
    if (chosenPayment === 'Razorpay' && paymentDetails?.razorpay_order_id && paymentDetails?.razorpay_payment_id && paymentDetails?.razorpay_signature) {
      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
      const clientProvidedAmount = paymentDetails?.amount !== undefined ? Number(paymentDetails.amount) : null;
      const isAmountValid = clientProvidedAmount === null || clientProvidedAmount === validatedPrice;
      
      if (razorpaySecret && isAmountValid) {
        const hmac = crypto.createHmac('sha256', razorpaySecret);
        hmac.update(`${paymentDetails.razorpay_order_id}|${paymentDetails.razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');
        if (generatedSignature === paymentDetails.razorpay_signature) {
          initialPaymentStatus = 'Paid';
        }
      }
    } else if (chosenPayment === 'UPI') {
      // UPI payments require explicit verification by salon cashier/receptionist
      initialPaymentStatus = 'Pending';
    }
    
    const now = new Date();
    const bookingDateTime = now.toISOString();
    const bookingDateStr = now.toISOString().split('T')[0];
    const bookingTimeFormattedStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Link customer ID if registered user matches
    const customer = await User.findOne({
      $or: [
        { email: customerEmail },
        { phone: customerPhone }
      ]
    });

    const newAppointment = await Appointment.create({
      bookingId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      branch,
      branchId,
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
      customerId: customer ? customer._id.toString() : null
    });

    // Dispatch Targeted Notification to Assigned Employee or Broadcast to All Employees
    try {
      const notificationController = require('./notificationController');
      const notifMsg = `${customerName} has booked a ${service} appointment.\n\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nBranch: ${branch}\nBooking ID: ${bookingId}`;

      let targetUserId = null;
      let targetEmail = null;

      if (specialistDoc) {
        targetEmail = specialistDoc.email ? specialistDoc.email.toLowerCase().trim() : null;
        const userAccount = await User.findOne({
          $or: [
            { _id: specialistDoc._id },
            ...(targetEmail ? [{ email: targetEmail }] : [])
          ]
        });
        if (userAccount) {
          targetUserId = userAccount._id.toString();
        } else {
          targetUserId = specialistDoc._id.toString();
        }
      }

      await notificationController.dispatchNotification(req.app, {
        userId: targetUserId,
        email: targetEmail,
        role: 'employee',
        title: 'New Appointment Booked 📅',
        message: notifMsg,
        type: 'appointment',
        priority: 'high',
        bookingId: bookingId,
        appointmentId: newAppointment._id.toString(),
        link: '/employee?tab=queue'
      });
    } catch (notifErr) {
      console.error('[PublicController] Employee notification dispatch error:', notifErr);
    }

    // Dispatch Notification to Admin Desk
    try {
      const notificationController = require('./notificationController');
      await notificationController.dispatchNotification(req.app, {
        role: 'admin',
        title: 'New Salon Appointment 📅',
        message: `${customerName} booked ${service} with ${chosenSpecialist} for ${appointmentDate} ${appointmentTime} (#${bookingId}).`,
        type: 'appointment',
        bookingId: bookingId,
        appointmentId: newAppointment._id.toString(),
      });
    } catch (adminNotifErr) {
      console.error('[PublicController] Admin notification error:', adminNotifErr);
    }
    try {
      const notificationController = require('./notificationController');
      const custUserId = customer ? customer._id.toString() : null;
      const custEmail = customerEmail ? customerEmail.toLowerCase().trim() : null;

      // 1. Confirmed Notification for Customer
      await notificationController.dispatchNotification(req.app, {
        userId: custUserId,
        email: custEmail,
        role: 'user',
        title: 'Appointment Confirmed! 🎉',
        message: `Dear ${customerName}, your appointment for ${service} (#${bookingId}) with ${chosenSpecialist} on ${appointmentDate} at ${appointmentTime} has been successfully booked.`,
        type: 'appointment',
        priority: 'high',
        bookingId: bookingId,
        appointmentId: newAppointment._id.toString(),
        link: '/appointments'
      });

      // 2. Time Alert Notification for Customer
      await notificationController.dispatchNotification(req.app, {
        userId: custUserId,
        email: custEmail,
        role: 'user',
        title: 'Upcoming Appointment Alert ⏰',
        message: `Time Alert: Your ${service} appointment is scheduled for ${appointmentDate} at ${appointmentTime} at ${branch || 'SPY Salon Jubilee Hills'}.`,
        type: 'appointment',
        priority: 'normal',
        bookingId: bookingId,
        appointmentId: newAppointment._id.toString(),
        link: '/appointments'
      });
    } catch (custNotifErr) {
      console.error('[PublicController] Customer notification error:', custNotifErr);
    }

    // Emit live socket event to all staff & admin dashboards
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      io.to('room:employee').emit('appointment:updated', { appointment: newAppointment });
      io.to('room:admin').emit('appointment:updated', { appointment: newAppointment });
    }

    // Create entry in ActivityLog
    await ActivityLog.create({
      action: 'New Appointment Booked',
      details: `Client ${customerName} booked appointment #${bookingId} for ${service}.`,
      user: customerName,
      branchId
    });

    // Create entry in Transaction with Idempotency check if paid
    if (initialPaymentStatus === 'Paid') {
      const existingTxn = await Transaction.findOne({
        $or: [
          { description: { $regex: bookingId } },
          { appointmentId: newAppointment._id.toString() }
        ]
      });

      if (!existingTxn) {
        await Transaction.create({
          txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          appointmentId: newAppointment._id.toString(),
          type: 'Credited',
          category: 'Appointment Booking',
          description: `Appointment Payment #${bookingId} (${customerName})`,
          amount: validatedPrice,
          paymentMethod: chosenPayment,
          status: 'Completed',
          branchId
        });
      }
    }

    // Async Guest Booking processing in background (auto-creation of accounts)
    setImmediate(async () => {
      try {
        await guestBookingService.processGuestBooking({
          appointment: newAppointment,
          customerName,
          customerEmail,
          customerPhone,
          service,
          branch,
          specialistName: chosenSpecialist,
          appointmentDate,
          appointmentTime,
          paymentMethod: chosenPayment,
          paymentStatus: initialPaymentStatus,
          price: 0
        });
      } catch (gErr) {
        console.error('[PublicController] Guest booking async error:', gErr);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: newAppointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete appointment booking.', error: error.message });
  }
};

// Contact Us submit endpoint
exports.submitContact = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    
    // Delegate to Enquiry Service
    const enquiryRecord = await enquiryService.createEnquiry(req.body, req.app, clientIp);
    const defaultAdminMsg = `Hello SPY Salon Concierge,\n\nI have submitted an enquiry.\n\n🆔 Enquiry ID: ${enquiryRecord.enquiryId}\n👤 Name: ${enquiryRecord.name}\n📞 Phone: ${enquiryRecord.phone || 'Not Provided'}\n📧 Email: ${enquiryRecord.email}`;

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
      message: 'Failed to process inquiry submission.',
      error: error.message 
    });
  }
};
