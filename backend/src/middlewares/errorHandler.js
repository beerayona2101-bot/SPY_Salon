/**
 * Centralized Error Handler Middleware for SPY Salon REST API
 */
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(message, statusCode, error.errors || [message]);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Record';
    error = ApiError.conflict(`Duplicate entry for ${field}. A record with this value already exists.`);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    error = ApiError.badRequest('Validation failed', errors);
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authorization token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authorization token has expired. Please refresh session.');
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error Log] ${req.method} ${req.originalUrl}:`, err);
  }

  return ApiResponse.error(res, error.message, error.statusCode, error.errors);
};

module.exports = errorHandler;
