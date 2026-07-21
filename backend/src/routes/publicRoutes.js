const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/services', publicController.getServices);
router.get('/branches', publicController.getBranches);
router.get('/offers', publicController.getOffers);
router.post('/appointments/public-book', publicController.bookAppointment);
router.post('/contact', publicController.submitContact);

module.exports = router;
