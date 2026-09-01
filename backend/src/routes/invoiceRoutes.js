/**
 * SPY Salon Enterprise PDF Invoice Routes
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

// Protect and expose download invoice route
router.get('/:id', protect, invoiceController.generateInvoicePDF);

module.exports = router;
