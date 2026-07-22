const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/services', publicController.getServices);
router.get('/specialists', publicController.getSpecialists);
router.get('/reviews', publicController.getReviews);
router.post('/reviews', publicController.submitReview);
router.get('/branches', publicController.getBranches);
router.get('/offers', publicController.getOffers);
router.get('/appointments/booked-slots', publicController.getBookedSlots);
router.post('/appointments/public-book', publicController.bookAppointment);
router.post('/contact', publicController.submitContact);

module.exports = router;
