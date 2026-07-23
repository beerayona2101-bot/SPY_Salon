/**
 * Custom ApiError Exception Class for SPY Salon REST API
 */

class ApiError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors || [message];
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = null) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden resource access') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(message, 409);
  }

  static unprocessable(message = 'Unprocessable Entity', errors = null) {
    return new ApiError(message, 422, errors);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(message, 500);
  }
}

module.exports = ApiError;
