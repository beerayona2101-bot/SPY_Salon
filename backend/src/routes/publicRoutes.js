const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

// Public catalog routes with 5-minute memory cache
router.get('/landing-settings', publicController.getLandingSettings);
router.get('/public/landing-settings', publicController.getLandingSettings);
router.get('/services', cacheMiddleware(300), publicController.getServices);
router.get('/services/:id', cacheMiddleware(300), publicController.getServiceById);
router.get('/specialists', cacheMiddleware(300), publicController.getSpecialists);
router.get('/reviews', cacheMiddleware(180), publicController.getReviews);
router.get('/branches', cacheMiddleware(600), publicController.getBranches);
router.get('/offers', cacheMiddleware(300), publicController.getOffers);

router.post('/reviews', validateRequest({ required: ['customerName', 'rating', 'comment'] }), publicController.submitReview);
router.get('/appointments/booked-slots', publicController.getBookedSlots);
router.post('/appointments/public-book', validateRequest({ required: ['customerName', 'customerPhone', 'service', 'appointmentDate', 'appointmentTime'] }), publicController.bookAppointment);
router.post('/contact', validateRequest({ required: ['name', 'phone'], phone: ['phone'], email: ['email'] }), publicController.submitContact);

module.exports = router;

