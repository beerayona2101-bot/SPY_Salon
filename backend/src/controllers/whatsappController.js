/**
 * SPY Salon Enterprise WhatsApp Controller
 * Webhook listeners, delivery status lookup, logs, and manual dispatches.
 */

const whatsappService = require('../services/whatsappService');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/whatsapp/status/:enquiryId
 * Fetch WhatsApp delivery status for a specific enquiry
 */
exports.getWhatsAppStatus = async (req, res, next) => {
  try {
    const { enquiryId } = req.params;
    if (!enquiryId) {
      return ApiResponse.badRequest(res, 'Enquiry ID is required.');
    }

    const statusRecord = whatsappService.getDeliveryStatus(enquiryId);
    return ApiResponse.success(res, statusRecord, 'WhatsApp delivery status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/whatsapp/webhook
 * Webhook Verification Endpoint for Meta Cloud API / Facebook Developers
 */
exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'spysalon_whatsapp_webhook_secret_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WhatsAppController] Webhook verified successfully by provider!');
      return res.status(200).send(challenge);
    }
    console.warn('[WhatsAppController] Webhook verification token mismatch');
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid verification token' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/v1/whatsapp/webhook
 * Handle incoming Webhook Delivery Status Callbacks
 */
exports.handleWebhook = async (req, res) => {
  try {
    const result = whatsappService.processWebhookStatus(req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[WhatsAppController] Error processing webhook:', error.message);
    // Respond 200 to webhook provider so they don't retry endlessly
    return res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/v1/whatsapp/logs
 * Retrieve recent WhatsApp activity logs for debugging
 */
exports.getWhatsAppLogs = async (req, res, next) => {
  try {
    const logs = whatsappService.getLogs();
    return ApiResponse.success(res, logs, 'WhatsApp activity logs retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/whatsapp/send-test
 * Trigger manual test WhatsApp alert
 */
exports.sendTestMessage = async (req, res, next) => {
  try {
    const { to, message, enquiryId } = req.body;
    const testEnquiryId = enquiryId || `TEST-${Date.now()}`;
    const targetPhone = to || process.env.ADMIN_WHATSAPP_NUMBER || '919490644434';
    const testMessage = message || whatsappService.formatEnquiryMessage({
      name: 'Test Customer',
      email: 'test@spysalon.com',
      phone: targetPhone,
      service: 'Gold Facial Special',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '02:00 PM',
      message: 'This is a test WhatsApp notification from SPY Salon Enterprise backend.',
      created_at: new Date().toLocaleString()
    });

    const result = await whatsappService.sendWhatsAppMessage({
      to: targetPhone,
      message: testMessage,
      enquiryId: testEnquiryId,
      type: 'test_notification'
    });

    return ApiResponse.success(res, { enquiryId: testEnquiryId, result }, 'Test WhatsApp message enqueued');
  } catch (error) {
    next(error);
  }
};
