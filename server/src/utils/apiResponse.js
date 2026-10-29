/**
 * Standardized API response formatter
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Created response (201)
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Error response
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Bad request response (400)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Not found response (404)
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Conflict response (409)
   */
  static conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  }

  /**
   * Validation error response (422)
   */
  static validationError(res, message = 'Validation failed', errors = null) {
    return this.error(res, message, 422, errors);
  }

  /**
   * Rate limit response (429)
   */
  static rateLimit(res, message = 'Too many requests') {
    return this.error(res, message, 429);
  }

  /**
   * Internal server error response (500)
   */
  static internalError(res, message = 'Internal server error') {
    return this.error(res, message, 500);
  }

  /**
   * Service unavailable response (503)
   */
  static serviceUnavailable(res, message = 'Service temporarily unavailable') {
    return this.error(res, message, 503);
  }

  /**
   * Paginated response
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
