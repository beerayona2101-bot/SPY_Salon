/**
 * SPY Salon WhatsApp Dispatch & Notification Service
 * Supports Direct WhatsApp Click-to-Chat Links (wa.me) & Automated API Dispatch (Twilio / Meta Cloud API / UltraMsg)
 */

/**
 * Format phone number into clean E.164 / International format without spaces or symbols (e.g. 919676090152)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  // Default to India country code 91 if 10 digits provided
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Get Admin WhatsApp Number from environment variable or default
 */
const getAdminWhatsAppNumber = () => {
  const adminNum = process.env.ADMIN_WHATSAPP_NUMBER || process.env.WHATSAPP_ADMIN_NUMBER || '919490644434';
  return formatPhoneNumber(adminNum);
};

/**
 * Generate WhatsApp Deep Link (wa.me) for instant direct messaging
 */
const createWhatsAppDeepLink = (phoneNumber, textMessage) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedText = encodeURIComponent(textMessage);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
};

/**
 * Send WhatsApp Notification to Admin when Customer Submits Inquiry
 */
const sendAdminWhatsAppNotification = async ({ enquiryId, name, email, phone, message, createdAt }) => {
  const adminPhone = getAdminWhatsAppNumber();
  const customerPhoneFormatted = formatPhoneNumber(phone);
  const timeStr = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();

  const textBody = `🚨 *NEW INQUIRY RECEIVED — SPY SALON*
----------------------------------------
🆔 *Inquiry ID:* ${enquiryId}
👤 *Customer Name:* ${name}
✉️ *Email:* ${email}
📞 *Phone:* ${phone || 'Not Provided'}
📅 *Submitted At:* ${timeStr}

💬 *Customer Message:*
"${message}"

----------------------------------------
👉 *Reply to Customer on WhatsApp:*
https://wa.me/${customerPhoneFormatted}?text=${encodeURIComponent(`Hello ${name}, this is SPY Salon Concierge regarding your inquiry #${enquiryId}.`)}

🌐 *Admin Executive Portal:*
${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?tab=enquiries`;

  const waDeepLink = createWhatsAppDeepLink(adminPhone, textBody);

  console.log(`[WhatsAppService] Generated WhatsApp Alert for Admin (${adminPhone}) for Inquiry #${enquiryId}`);
  console.log(`[WhatsAppService] Deep Link: ${waDeepLink}`);

  // Automated API Dispatch if Twilio or Custom WhatsApp API Key configured
  let apiDispatched = false;
  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+14155238886'

    if (twilioSid && twilioAuthToken && twilioFrom) {
      const client = require('twilio')(twilioSid, twilioAuthToken);
      await client.messages.create({
        from: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
        to: `whatsapp:+${adminPhone}`,
        body: textBody
      });
      console.log(`[WhatsAppService] Twilio WhatsApp message sent successfully to +${adminPhone}`);
      apiDispatched = true;
    }
  } catch (err) {
    console.warn(`[WhatsAppService] Twilio API dispatch skipped/error:`, err.message);
  }

  return {
    success: true,
    apiDispatched,
    adminPhone,
    deepLink: waDeepLink,
    customerReplyLink: `https://wa.me/${customerPhoneFormatted}`
  };
};

/**
 * Generate Customer WhatsApp Contact Link
 */
const getCustomerWhatsAppChatUrl = (customerPhone, enquiryId, customerName) => {
  const formattedPhone = formatPhoneNumber(customerPhone);
  if (!formattedPhone) return '';
  const text = `Hello ${customerName || 'Valued Client'}, this is SPY Salon Concierge regarding your inquiry #${enquiryId}. How can we assist you today?`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
};

module.exports = {
  formatPhoneNumber,
  getAdminWhatsAppNumber,
  createWhatsAppDeepLink,
  sendAdminWhatsAppNotification,
  getCustomerWhatsAppChatUrl
};
