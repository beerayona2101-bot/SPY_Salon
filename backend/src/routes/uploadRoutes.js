/**
 * Image Upload REST API Routes
 */
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/uploadController');

// POST /api/v1/upload/single
router.post('/single', upload.single('image'), uploadSingleImage);

// POST /api/v1/upload/multiple
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

module.exports = router;
