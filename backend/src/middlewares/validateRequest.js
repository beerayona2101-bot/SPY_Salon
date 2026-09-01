/**
 * SPY Salon Express Request Validation Middleware
 */
const ApiError = require('../utils/apiError');
const { isValidEmail, isValidPhone, isValidName, isValidPassword, isNonNegativeNumber } = require('../utils/validators');

/**
 * Deep trim string properties in payload
 */
const sanitizePayload = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = val.trim();
      } else if (val !== null && typeof val === 'object') {
        sanitized[key] = sanitizePayload(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
};

/**
 * Express middleware factory to sanitize body and validate payload against rules
 */
const validateRequest = (rules = {}) => {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizePayload(req.body);
      }

      const errors = {};

      if (rules.required) {
        for (const field of rules.required) {
          const val = req.body[field];
          if (val === undefined || val === null || val === '') {
            errors[field] = `${field} is required.`;
          }
        }
      }

      if (rules.email) {
        for (const field of rules.email) {
          const val = req.body[field];
          if (val && !isValidEmail(val)) {
            errors[field] = 'Please provide a valid email address.';
          }
        }
      }

      if (rules.phone) {
        for (const field of rules.phone) {
          const val = req.body[field];
          if (val && !isValidPhone(val)) {
            errors[field] = 'Mobile number must start with 6, 7, 8, or 9 and be 10 digits.';
          }
        }
      }

      if (rules.name) {
        for (const field of rules.name) {
          const val = req.body[field];
          if (val && !isValidName(val)) {
            errors[field] = `${field} must be between 2 and 60 characters.`;
          }
        }
      }

      if (rules.password) {
        for (const field of rules.password) {
          const val = req.body[field];
          if (val && !isValidPassword(val)) {
            errors[field] = 'Password must be at least 6 characters long.';
          }
        }
      }

      if (rules.nonNegativeNumber) {
        for (const field of rules.nonNegativeNumber) {
          const val = req.body[field];
          if (val !== undefined && val !== null && val !== '' && !isNonNegativeNumber(val)) {
            errors[field] = `${field} must be a non-negative number.`;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        const firstErrorMessage = Object.values(errors)[0];
        throw ApiError.badRequest(firstErrorMessage);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  sanitizePayload,
  validateRequest
};
