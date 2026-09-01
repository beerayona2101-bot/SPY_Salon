/**
 * SPY Salon Enterprise WhatsApp Routes
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Status & Logs
router.get('/status/:enquiryId', whatsappController.getWhatsAppStatus);
router.get('/logs', whatsappController.getWhatsAppLogs);

// Webhook endpoints (Meta Cloud API / Webhook Callbacks)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

// Test endpoint
router.post('/send-test', whatsappController.sendTestMessage);

module.exports = router;
