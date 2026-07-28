/**
 * SPY Salon Enterprise Enquiry Service
 * Encapsulates core business logic for processing customer enquiry submissions.
 * Standardizes validation, database saving, socket emissions, and notification pipeline dispatching.
 */

const Enquiry = require('../models/Enquiry');
const store = require('../data/store');
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

  // 3. Save Enquiry Data to Database with Memory Store Fallback
  let enquiryRecord;
  try {
    enquiryRecord = await Enquiry.create({
      enquiryId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
      status: 'New',
      ipAddress
    });
  } catch (dbErr) {
    console.warn('[EnquiryService] MongoDB Enquiry save fallback to memory store:', dbErr.message);
    enquiryRecord = {
      _id: 'enq_' + Date.now(),
      enquiryId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
      status: 'New',
      ipAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!store.enquiries) store.enquiries = [];
    store.enquiries.unshift(enquiryRecord);
  }

  // Ensure record contains passed optional service/date/time for WhatsApp template
  const enquiryObj = enquiryRecord.toObject ? enquiryRecord.toObject() : { ...enquiryRecord };
  enquiryObj.service = service || enquiryData.serviceName || 'General Enquiry';
  enquiryObj.preferredDate = date || enquiryData.preferredDate || 'N/A';
  enquiryObj.preferredTime = time || enquiryData.preferredTime || 'N/A';

  // Sync memory store
  if (!store.enquiries) store.enquiries = [];
  const existsInMemory = store.enquiries.some(e => e.enquiryId === enquiryId);
  if (!existsInMemory) {
    store.enquiries.unshift(enquiryObj);
  }

  // 4. Emit Real-Time Socket.io Alert to Connected Admin Clients
  const io = app ? app.get('io') : null;
  if (io) {
    io.emit('new_enquiry', enquiryObj);
    io.emit('enquiry_created', enquiryObj);
    console.log(`[Socket] Broadcasted new_enquiry event for ID: ${enquiryId}`);
  }

  // 5. Trigger Multi-Channel Notifications (Emails -> Dashboard -> WhatsApp)
  // Processed asynchronously using setImmediate so HTTP response is instant & non-blocking
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
 * Get Enquiry by ID (Database + Store lookup)
 */
const getEnquiryById = async (enquiryId) => {
  try {
    const fromDb = await Enquiry.findOne({ enquiryId });
    if (fromDb) return fromDb;
  } catch (err) {}
  
  if (store.enquiries) {
    return store.enquiries.find(e => e.enquiryId === enquiryId);
  }
  return null;
};

module.exports = {
  validateEnquiryInput,
  createEnquiry,
  getEnquiryById
};
