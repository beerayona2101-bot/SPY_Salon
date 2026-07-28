const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

// Public catalog routes with 5-minute memory cache
router.get('/services', cacheMiddleware(300), publicController.getServices);
router.get('/specialists', cacheMiddleware(300), publicController.getSpecialists);
router.get('/reviews', cacheMiddleware(180), publicController.getReviews);
router.get('/branches', cacheMiddleware(600), publicController.getBranches);
router.get('/offers', cacheMiddleware(300), publicController.getOffers);

router.post('/reviews', publicController.submitReview);
router.get('/appointments/booked-slots', publicController.getBookedSlots);
router.post('/appointments/public-book', publicController.bookAppointment);
router.post('/contact', publicController.submitContact);

module.exports = router;

