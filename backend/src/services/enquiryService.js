/**
 * SPY Salon Enterprise Enquiry Service
 * Runs exclusively on MongoDB Mongoose Enquiry model.
 */
const Enquiry = require('../models/Enquiry');
const notificationService = require('./notificationService');
const { validatePhoneNumber } = require('./whatsappService');

/**
 * Validate customer enquiry input payload
 */
const validateEnquiryInput = ({ name, email, phone, message }) => {
  if (!name || !String(name).trim()) {
    return { valid: false, message: 'Please provide your name.' };
  }
  
  if (!email || !String(email).trim()) {
    return { valid: false, message: 'Please provide a valid email address.' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return { valid: false, message: 'Please enter a valid email format.' };
  }

  if (!message || !String(message).trim()) {
    return { valid: false, message: 'Please write your inquiry message.' };
  }

  if (phone) {
    const phoneCheck = validatePhoneNumber(phone);
    if (!phoneCheck.valid) {
      console.warn(`[EnquiryService] Phone validation warning for ${phone}: ${phoneCheck.reason}`);
    }
  }

  return { valid: true };
};

/**
 * Process a new customer enquiry submission end-to-end
 */
const createEnquiry = async (enquiryData, app = null, clientIp = '') => {
  const { name, email, phone, message, service, date, time } = enquiryData;

  // 1. Form Validation
  const validation = validateEnquiryInput({ name, email, phone, message });
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.statusCode = 400;
    throw err;
  }

  // 2. Generate Unique Enquiry ID (e.g. ENQ-849201)
  const enquiryId = 'ENQ-' + Math.floor(100000 + Math.random() * 900000);
  const ipAddress = clientIp || '';

  // 3. Save Enquiry Data to Mongoose
  const enquiryRecord = await Enquiry.create({
    enquiryId,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : '',
    message: String(message).trim(),
    status: 'New',
    ipAddress
  });

  // Ensure record contains passed optional service/date/time for WhatsApp template
  const enquiryObj = enquiryRecord.toObject();
  enquiryObj.service = service || enquiryData.serviceName || 'General Enquiry';
  enquiryObj.preferredDate = date || enquiryData.preferredDate || 'N/A';
  enquiryObj.preferredTime = time || enquiryData.preferredTime || 'N/A';

  // 4. Emit Real-Time Socket.io Alert to Connected Admin Clients
  const io = app ? app.get('io') : null;
  if (io) {
    io.emit('new_enquiry', enquiryObj);
    io.emit('enquiry_created', enquiryObj);
  }

  // 5. Trigger Multi-Channel Notifications
  setImmediate(() => {
    notificationService.handleEnquiryNotifications({
      enquiryRecord: enquiryObj,
      app
    }).catch(notifErr => {
      console.error(`[EnquiryService] Background notification processing failed for #${enquiryId}:`, notifErr.message);
    });
  });

  return enquiryObj;
};

/**
 * Get Enquiry by ID (Database lookup)
 */
const getEnquiryById = async (enquiryId) => {
  return await Enquiry.findOne({ enquiryId });
};

module.exports = {
  validateEnquiryInput,
  createEnquiry,
  getEnquiryById
};
