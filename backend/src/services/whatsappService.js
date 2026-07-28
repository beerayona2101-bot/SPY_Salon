/**
 * SPY Salon Enterprise WhatsApp Service
 * Production-ready asynchronous WhatsApp dispatch & notification management.
 * Supports Meta Cloud API, Twilio, UltraMsg, and Mock mode fallback.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Delivery status and message deduplication state storage
const deliveryStatusMap = new Map();
const processedEnquiries = new Set();
const logsStore = [];

/**
 * Log WhatsApp activity with timestamp and structured details
 */
const logWhatsApp = (level, event, message, details = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    details
  };
  logsStore.unshift(logEntry);
  if (logsStore.length > 500) logsStore.pop();

  const prefix = `[WhatsAppService][${level.toUpperCase()}][${event}]`;
  if (level === 'error') {
    console.error(`${prefix} ${message}`, details ? JSON.stringify(details) : '');
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`, details ? JSON.stringify(details) : '');
  } else {
    console.log(`${prefix} ${message}`, details ? JSON.stringify(details) : '');
  }
};

/**
 * Format phone number into clean E.164 / International format (e.g., 919490644434)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  // Default to India country code (91) if 10 digits provided
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Validate phone number format before dispatch
 */
const validatePhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) {
    return { valid: false, reason: 'Phone number is empty' };
  }
  if (formatted.length < 10 || formatted.length > 15) {
    return { valid: false, reason: `Invalid digit count (${formatted.length}). Expected 10 to 15 digits.` };
  }
  return { valid: true, formatted };
};

/**
 * Get Admin WhatsApp Numbers array (Supports multiple comma-separated numbers)
 */
const getAdminWhatsAppNumbers = () => {
  const rawNumbers = process.env.ADMIN_WHATSAPP_NUMBER || process.env.WHATSAPP_ADMIN_NUMBER || '919490644434';
  const list = rawNumbers.split(',').map(num => formatPhoneNumber(num.trim())).filter(Boolean);
  return list.length > 0 ? list : ['919490644434'];
};

/**
 * Format WhatsApp Enquiry Message template strictly as requested
 */
const formatEnquiryMessage = (enquiryData = {}) => {
  const customerName = enquiryData.name || enquiryData.customer_name || 'Valued Customer';
  const phone = enquiryData.phone || 'Not Provided';
  const email = enquiryData.email || 'Not Provided';
  const service = enquiryData.service || enquiryData.serviceName || 'General Enquiry';
  const date = enquiryData.date || enquiryData.preferredDate || enquiryData.appointmentDate || 'N/A';
  const time = enquiryData.time || enquiryData.preferredTime || enquiryData.appointmentTime || 'N/A';
  const message = enquiryData.message || enquiryData.notes || 'No message provided.';
  
  let createdAtFormatted = 'N/A';
  if (enquiryData.created_at) {
    createdAtFormatted = enquiryData.created_at;
  } else if (enquiryData.createdAt) {
    createdAtFormatted = new Date(enquiryData.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  } else {
    createdAtFormatted = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  }

  return `🔔 NEW ENQUIRY RECEIVED

👤 Customer:
${customerName}

📞 Phone:
${phone}

📧 Email:
${email}

💇 Service:
${service}

📅 Preferred Date:
${date}

⏰ Preferred Time:
${time}

💬 Message:
${message}

🌐 Source:
Website Enquiry

🕒 Submitted:
${createdAtFormatted}`;
};

/**
 * Update delivery status for an enquiry
 */
const updateDeliveryStatus = (enquiryId, status, details = {}) => {
  if (!enquiryId) return;
  const current = deliveryStatusMap.get(enquiryId) || {
    enquiryId,
    status: 'Pending',
    attempts: 0,
    history: [],
    createdAt: new Date().toISOString()
  };

  current.status = status;
  current.updatedAt = new Date().toISOString();
  if (details.messageId) current.messageId = details.messageId;
  if (details.error) current.lastError = details.error;
  if (details.attempt) current.attempts = details.attempt;
  
  current.history.push({
    status,
    timestamp: current.updatedAt,
    note: details.note || ''
  });

  deliveryStatusMap.set(enquiryId, current);
  logWhatsApp('info', 'DELIVERY_STATUS_UPDATED', `Status updated to [${status}] for Enquiry #${enquiryId}`, { status, enquiryId, details });
};

/**
 * Get delivery status for an enquiry
 */
const getDeliveryStatus = (enquiryId) => {
  return deliveryStatusMap.get(enquiryId) || {
    enquiryId,
    status: 'Pending',
    attempts: 0,
    history: [],
    createdAt: new Date().toISOString()
  };
};

/**
 * Core HTTP Request Helper for WhatsApp Provider APIs (Meta Cloud API / UltraMsg)
 */
const makeHttpRequest = (targetUrl, method, headers, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl);
      const transport = parsedUrl.protocol === 'https:' ? https : http;
      const dataStr = payload ? JSON.stringify(payload) : '';

      const req = transport.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr),
          ...headers
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = { raw: body };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: parsed });
          } else {
            reject({ statusCode: res.statusCode, body: parsed, message: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('WhatsApp API HTTP Request Timeout'));
      });

      if (dataStr) req.write(dataStr);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Provider-specific message dispatches
 */
const dispatchToProvider = async ({ recipientPhone, textBody }) => {
  const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();
  const apiKey = process.env.WHATSAPP_API_KEY;
  const fromNumber = process.env.WHATSAPP_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || process.env.WHATSAPP_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || process.env.WHATSAPP_AUTH_TOKEN;

  logWhatsApp('info', 'API_REQUEST', `Initiating WhatsApp dispatch via provider [${provider}] to +${recipientPhone}`);

  // 1. Meta Cloud API Provider
  if (provider === 'meta') {
    if (!apiKey || !fromNumber) {
      throw new Error('Meta Cloud API requires WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER (Phone Number ID)');
    }
    const metaUrl = `https://graph.facebook.com/v18.0/${fromNumber}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: { body: textBody }
    };
    const res = await makeHttpRequest(metaUrl, 'POST', { 'Authorization': `Bearer ${apiKey}` }, payload);
    const messageId = res.body?.messages?.[0]?.id || `meta_${Date.now()}`;
    return { success: true, provider: 'meta', messageId, response: res.body };
  }

  // 2. Twilio Provider
  if (provider === 'twilio' || (twilioSid && twilioToken && fromNumber)) {
    if (!twilioSid || !twilioToken || !fromNumber) {
      throw new Error('Twilio WhatsApp API requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER');
    }
    const twilio = require('twilio')(twilioSid, twilioToken);
    const fromFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toFormatted = `whatsapp:+${recipientPhone}`;
    const result = await twilio.messages.create({
      from: fromFormatted,
      to: toFormatted,
      body: textBody
    });
    return { success: true, provider: 'twilio', messageId: result.sid, response: { status: result.status, sid: result.sid } };
  }

  // 3. UltraMsg Provider
  if (provider === 'ultramsg') {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = apiKey || process.env.ULTRAMSG_TOKEN;
    if (!instanceId || !token) {
      throw new Error('UltraMsg requires ULTRAMSG_INSTANCE_ID and WHATSAPP_API_KEY/ULTRAMSG_TOKEN');
    }
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    const payload = {
      token,
      to: recipientPhone,
      body: textBody,
      priority: 10
    };
    const res = await makeHttpRequest(url, 'POST', {}, payload);
    return { success: true, provider: 'ultramsg', messageId: res.body?.id || `ultramsg_${Date.now()}`, response: res.body };
  }

  // 4. Mock / Development Fallback Mode
  logWhatsApp('info', 'MOCK_DISPATCH', `Simulating WhatsApp dispatch to +${recipientPhone} (Mock Provider)`);
  const mockMessageId = `mock_wa_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    success: true,
    provider: 'mock',
    messageId: mockMessageId,
    response: { status: 'mock_sent', recipient: recipientPhone, timestamp: new Date().toISOString() }
  };
};

/**
 * Asynchronous Worker Queue for WhatsApp Messaging
 */
class WhatsAppQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelayMs = 1000;
  }

  enqueue(task) {
    this.queue.push(task);
    logWhatsApp('info', 'QUEUE_ENQUEUE', `Task enqueued for Enquiry #${task.enquiryId}. Queue depth: ${this.queue.length}`);
    this.processNext();
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const task = this.queue.shift();

    try {
      await this.executeTaskWithRetry(task);
    } catch (err) {
      logWhatsApp('error', 'TASK_FINAL_FAILURE', `WhatsApp processing permanently failed for Enquiry #${task.enquiryId}: ${err.message}`);
    } finally {
      this.processing = false;
      // Slight delay to handle API rate limits gracefully
      setTimeout(() => this.processNext(), 500);
    }
  }

  async executeTaskWithRetry(task) {
    const { enquiryId, recipientPhone, messageText } = task;
    let attempt = 0;
    let success = false;
    let lastError = null;

    while (attempt < this.maxRetries && !success) {
      attempt++;
      try {
        logWhatsApp('info', 'RETRY_ATTEMPT', `Executing WhatsApp send attempt ${attempt}/${this.maxRetries} for Enquiry #${enquiryId}`);
        updateDeliveryStatus(enquiryId, 'Pending', { attempt, note: `Attempt ${attempt} in progress` });

        const result = await dispatchToProvider({ recipientPhone, textBody: messageText });
        success = true;

        updateDeliveryStatus(enquiryId, 'Sent', {
          attempt,
          messageId: result.messageId,
          note: `Successfully sent via ${result.provider}`
        });

        logWhatsApp('info', 'API_RESPONSE', `WhatsApp dispatch successful for Enquiry #${enquiryId}`, result);

        // Auto-simulate webhook delivery for Mock mode after 1s
        if (result.provider === 'mock') {
          setTimeout(() => {
            updateDeliveryStatus(enquiryId, 'Delivered', { note: 'Mock delivery confirmed' });
          }, 1000);
        }

      } catch (err) {
        lastError = err.message || err;
        logWhatsApp('warn', 'RETRY_FAILURE', `Attempt ${attempt}/${this.maxRetries} failed for Enquiry #${enquiryId}: ${lastError}`);
        
        if (attempt < this.maxRetries) {
          const backoff = this.retryDelayMs * Math.pow(2, attempt - 1);
          logWhatsApp('info', 'RETRY_BACKOFF', `Waiting ${backoff}ms before retry...`);
          await new Promise(res => setTimeout(res, backoff));
        }
      }
    }

    if (!success) {
      updateDeliveryStatus(enquiryId, 'Failed', {
        attempt,
        error: lastError,
        note: 'All retry attempts exhausted'
      });
      throw new Error(lastError);
    }
  }
}

const whatsappQueue = new WhatsAppQueue();

/**
 * Primary Core Reusable Function: sendWhatsAppMessage()
 */
const sendWhatsAppMessage = async ({ to, message, enquiryId, type = 'general' }) => {
  logWhatsApp('info', 'REQUEST_RECEIVED', `Received WhatsApp send request to [${to}] for Enquiry #${enquiryId || 'N/A'}`);

  const phoneCheck = validatePhoneNumber(to);
  if (!phoneCheck.valid) {
    logWhatsApp('warn', 'INVALID_PHONE', `Phone validation failed for [${to}]: ${phoneCheck.reason}`);
    if (enquiryId) {
      updateDeliveryStatus(enquiryId, 'Failed', { error: phoneCheck.reason });
    }
    return { success: false, error: phoneCheck.reason };
  }

  const formattedPhone = phoneCheck.formatted;

  // Deduplication check if enquiryId provided
  if (enquiryId && processedEnquiries.has(`${enquiryId}_${formattedPhone}`)) {
    logWhatsApp('warn', 'DUPLICATE_PREVENTED', `Duplicate WhatsApp request ignored for Enquiry #${enquiryId}`);
    return { success: true, skipped: true, message: 'Notification already queued or dispatched.' };
  }

  if (enquiryId) {
    processedEnquiries.add(`${enquiryId}_${formattedPhone}`);
    updateDeliveryStatus(enquiryId, 'Pending', { note: 'Notification queued for delivery' });
  }

  // Queue task for asynchronous execution
  whatsappQueue.enqueue({
    enquiryId: enquiryId || `gen_${Date.now()}`,
    recipientPhone: formattedPhone,
    messageText: message,
    type
  });

  return {
    success: true,
    status: 'Pending',
    recipient: formattedPhone,
    enquiryId
  };
};

/**
 * Primary Core Reusable Function: sendAdminEnquiryNotification()
 */
const sendAdminEnquiryNotification = async (enquiryData) => {
  const enquiryId = enquiryData.enquiryId || enquiryData.id;
  logWhatsApp('info', 'ADMIN_ALERT_TRIGGERED', `Triggering admin WhatsApp notification for Enquiry #${enquiryId}`);

  if (!enquiryId) {
    logWhatsApp('error', 'MISSING_ENQUIRY_ID', 'Cannot send admin notification without enquiryId');
    return { success: false, error: 'Enquiry ID is required' };
  }

  const messageText = formatEnquiryMessage(enquiryData);
  const adminNumbers = getAdminWhatsAppNumbers();
  const results = [];

  for (const adminPhone of adminNumbers) {
    const res = await sendWhatsAppMessage({
      to: adminPhone,
      message: messageText,
      enquiryId,
      type: 'admin_enquiry_alert'
    });
    results.push({ adminPhone, ...res });
  }

  return {
    success: true,
    enquiryId,
    dispatches: results
  };
};

/**
 * Process Webhook Status Callbacks from WhatsApp Providers
 */
const processWebhookStatus = (webhookPayload = {}) => {
  logWhatsApp('info', 'WEBHOOK_RECEIVED', 'Received WhatsApp provider webhook update', webhookPayload);

  // Meta Cloud API Webhook schema
  const entry = webhookPayload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const statusObject = value?.statuses?.[0];

  if (statusObject) {
    const messageId = statusObject.id;
    const rawStatus = statusObject.status; // e.g., 'sent', 'delivered', 'read', 'failed'
    
    let normalizedStatus = 'Pending';
    if (rawStatus === 'delivered' || rawStatus === 'read') normalizedStatus = 'Delivered';
    else if (rawStatus === 'sent') normalizedStatus = 'Sent';
    else if (rawStatus === 'failed') normalizedStatus = 'Failed';

    // Find matching enquiry from deliveryStatusMap
    for (const [enqId, record] of deliveryStatusMap.entries()) {
      if (record.messageId === messageId) {
        updateDeliveryStatus(enqId, normalizedStatus, { note: `Webhook status update: ${rawStatus}` });
        return { success: true, enquiryId: enqId, status: normalizedStatus };
      }
    }
  }

  return { success: true, processed: true };
};

/**
 * Format Customer Confirmation WhatsApp Message
 */
const formatCustomerConfirmationMessage = (enquiryData = {}) => {
  const customerName = enquiryData.name || enquiryData.customer_name || 'Valued Client';
  const enquiryId = enquiryData.enquiryId || enquiryData.id || 'N/A';
  const service = enquiryData.service || enquiryData.serviceName || 'General Enquiry';
  const date = enquiryData.date || enquiryData.preferredDate || 'N/A';
  const time = enquiryData.time || enquiryData.preferredTime || 'N/A';
  const message = enquiryData.message || enquiryData.notes || 'N/A';

  return `✨ *SPY SALON — ENQUIRY CONFIRMATION*

Hello *${customerName}*,

Thank you for reaching out to **SPY Salon**. We have received your enquiry and our senior concierge team is reviewing it.

🆔 *Enquiry ID:* ${enquiryId}
💇 *Requested Service:* ${service}
📅 *Preferred Date:* ${date}
⏰ *Preferred Time:* ${time}

💬 *Your Message:*
"${message}"

----------------------------------------
📞 For immediate assistance, call our Jubilee Hills Concierge Desk at **+91 98765 43210**.

✨ *SPY Salon Luxury Studio & Botanical Spa*`;
};

/**
 * Send WhatsApp Confirmation Message to Customer
 */
const sendCustomerWhatsAppConfirmation = async (enquiryData) => {
  const customerPhone = enquiryData.phone;
  const enquiryId = enquiryData.enquiryId;

  if (!customerPhone) {
    logWhatsApp('info', 'CUSTOMER_CONFIRMATION_SKIPPED', `No phone provided for customer in Enquiry #${enquiryId}`);
    return { success: false, reason: 'No customer phone provided' };
  }

  const phoneCheck = validatePhoneNumber(customerPhone);
  if (!phoneCheck.valid) {
    logWhatsApp('warn', 'CUSTOMER_PHONE_INVALID', `Customer phone invalid for Enquiry #${enquiryId}: ${phoneCheck.reason}`);
    return { success: false, reason: phoneCheck.reason };
  }

  const textMessage = formatCustomerConfirmationMessage(enquiryData);
  const custEnquiryKey = `cust_${enquiryId}`;

  return await sendWhatsAppMessage({
    to: phoneCheck.formatted,
    message: textMessage,
    enquiryId: custEnquiryKey,
    type: 'customer_confirmation'
  });
};

const sendEmployeeWhatsAppNotification = async ({ employeePhone, message }) => {
  return await sendWhatsAppMessage({ to: employeePhone, message, type: 'employee_alert' });
};

const sendBroadcastWhatsAppMessage = async ({ recipients = [], message }) => {
  const results = [];
  for (const phone of recipients) {
    const res = await sendWhatsAppMessage({ to: phone, message, type: 'broadcast' });
    results.push(res);
  }
  return { success: true, total: recipients.length, results };
};

module.exports = {
  // Required core functions
  sendWhatsAppMessage,
  sendAdminEnquiryNotification,
  sendCustomerWhatsAppConfirmation,
  formatEnquiryMessage,
  formatCustomerConfirmationMessage,
  // Helper & status functions
  formatPhoneNumber,
  validatePhoneNumber,
  getDeliveryStatus,
  updateDeliveryStatus,
  processWebhookStatus,
  // Future expansion functions
  sendEmployeeWhatsAppNotification,
  sendBroadcastWhatsAppMessage,
  // Inspection helpers
  getLogs: () => logsStore
};
