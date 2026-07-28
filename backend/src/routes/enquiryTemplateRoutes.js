/**
 * Quick Enquiry Templates REST API Routes
 */
const express = require('express');
const router = express.Router();
const templateController = require('../controllers/enquiryTemplateController');

// Public REST Route
router.get('/', templateController.getPublicTemplates);

// Admin Management REST Routes
router.get('/admin', templateController.adminGetTemplates);
router.post('/admin', templateController.adminCreateTemplate);
router.put('/admin/:id', templateController.adminUpdateTemplate);
router.delete('/admin/:id', templateController.adminDeleteTemplate);

module.exports = router;
