/**
 * Cloudinary Image Upload & Pre-Upload Sharp Compression Service
 * SPY Salon Enterprise API
 */
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary SDK v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'cf1z70hh',
  api_key: process.env.CLOUDINARY_API_KEY || '744191426772643',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'AvhFb5JwgwyYPqxOMVAafltEUoY'
});

/**
 * Compress image buffer using Sharp and upload directly to Cloudinary
 * @param {Buffer} fileBuffer - Input image raw buffer from Multer
 * @param {String} folder - Cloudinary target directory (default 'spy_salon')
 * @returns {Promise<Object>} Object containing secure_url, public_id, and dimensions
 */
const compressAndUploadImage = async (fileBuffer, folder = 'spy_salon') => {
  try {
    // 1. Pre-upload image compression via Sharp
    // Resizes image to max width of 1200px, auto-orients, and converts to high-efficiency WebP (quality 82)
    const compressedBuffer = await sharp(fileBuffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // 2. Upload compressed image buffer to Cloudinary stream
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `spy_salon/${folder}`,
          resource_type: 'image',
          format: 'webp',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('[CloudinaryService] Upload stream error:', error);
            return reject(error);
          }
          console.log(`[CloudinaryService] Image successfully compressed & uploaded to Cloudinary: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
          });
        }
      );

      uploadStream.end(compressedBuffer);
    });
  } catch (error) {
    console.error('[CloudinaryService] Sharp compression or Cloudinary processing failed:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary by public ID
 */
const deleteCloudinaryImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`[CloudinaryService] Failed to delete image ${publicId}:`, error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  compressAndUploadImage,
  deleteCloudinaryImage
};
