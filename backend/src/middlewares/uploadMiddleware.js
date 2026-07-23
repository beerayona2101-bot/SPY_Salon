/**
 * Multer Memory Storage Middleware for Image Uploads
 * Buffers uploaded files into memory for Sharp compression before streaming to Cloudinary.
 */
const multer = require('multer');
const ApiError = require('../utils/apiError');

// Memory storage engine keeps files in Buffer memory
const storage = multer.memoryStorage();

// File filter: accept image types only
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files (JPEG, PNG, WebP, GIF, AVIF) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB Max File Size Limit
  }
});

module.exports = upload;
