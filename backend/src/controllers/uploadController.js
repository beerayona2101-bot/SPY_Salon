/**
 * Image Upload Controller
 * Processes images through Sharp compression and saves to Cloudinary.
 */
const { compressAndUploadImage } = require('../services/cloudinaryService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Handle Single Image Upload & Compression
 */
exports.uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file selected for upload');
    }

    const folderCategory = req.body.folder || 'services';
    const uploadResult = await compressAndUploadImage(req.file.buffer, folderCategory);

    return ApiResponse.success(res, {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      dimensions: { width: uploadResult.width, height: uploadResult.height },
      originalName: req.file.originalname,
      sizeBytes: uploadResult.bytes
    }, 'Image compressed and uploaded to Cloudinary successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Multiple Images Upload & Compression
 */
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('No image files uploaded');
    }

    const folderCategory = req.body.folder || 'gallery';
    const uploadPromises = req.files.map(file => compressAndUploadImage(file.buffer, folderCategory));
    const results = await Promise.all(uploadPromises);

    const uploadedUrls = results.map(r => r.url);

    return ApiResponse.success(res, {
      images: results,
      urls: uploadedUrls
    }, `${results.length} images compressed and uploaded to Cloudinary successfully`);
  } catch (error) {
    next(error);
  }
};
