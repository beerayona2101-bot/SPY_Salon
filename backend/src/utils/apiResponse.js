/**
 * Standardized API Response Helper for SPY Salon Enterprise REST API
 */

class ApiResponse {
  static success(res, data = null, message = 'Operation completed successfully', statusCode = 200, meta = null) {
    const payload = {
      success: true,
      statusCode,
      message,
      data
    };
    if (meta) {
      payload.pagination = meta;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data: null,
      errors: errors || [message]
    });
  }

  static paginated(res, data, page, limit, total, message = 'Records retrieved successfully') {
    const totalPages = Math.ceil(total / limit) || 1;
    return this.success(res, data, message, 200, {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages
    });
  }
}

module.exports = ApiResponse;
