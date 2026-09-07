/**
 * Cloudinary Image Upload & Pre-Upload Sharp Compression Service with Local Storage Fallback
 * SPY Salon Enterprise API
 */
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary SDK v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Fallback handler: Save compressed WebP image directly to local backend disk (uploads/ directory)
 */
const saveToLocalStorage = async (compressedBuffer) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, compressedBuffer);

  const relativeUrl = `/uploads/${filename}`;
  console.log(`[LocalStorage] Image compressed with Sharp & saved locally: ${relativeUrl}`);
  return {
    url: relativeUrl,
    publicId: filename,
    width: 1200,
    height: 800,
    format: 'webp',
    bytes: compressedBuffer.length
  };
};

/**
 * Compress image buffer using Sharp and upload to Cloudinary (or local fallback)
 * @param {Buffer} fileBuffer - Input image raw buffer from Multer
 * @param {String} folder - Target directory (default 'spy_salon')
 * @returns {Promise<Object>} Object containing url, publicId, and dimensions
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

    // 2. Try Cloudinary upload if cloud_name is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `spy_salon/${folder}`,
              resource_type: 'image',
              format: 'webp',
              transformation: [
                { quality: 'auto', fetch_format: 'auto' }
              ]
            },
            (error, res) => {
              if (error) return reject(error);
              resolve(res);
            }
          );
          uploadStream.end(compressedBuffer);
        });

        console.log(`[CloudinaryService] Image compressed & uploaded to Cloudinary: ${result.secure_url}`);
        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        };
      } catch (cloudErr) {
        console.warn('[CloudinaryService] Cloudinary stream failed, using local storage fallback:', cloudErr?.message || cloudErr);
        return await saveToLocalStorage(compressedBuffer);
      }
    } else {
      // Cloudinary credentials not configured, save to local static uploads folder
      return await saveToLocalStorage(compressedBuffer);
    }
  } catch (error) {
    console.error('[CloudinaryService] Sharp compression or image processing failed:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary by public ID
 */
const deleteCloudinaryImage = async (publicId) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    }
    return { result: 'ok' };
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

