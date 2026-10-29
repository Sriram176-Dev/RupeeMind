import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Log error
  logger.error(`Error in ${req.method} ${req.path}`, err, {
    requestId: req.id,
    statusCode,
  });

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Database validation error',
      errors: messages,
      timestamp: new Date().toISOString(),
    });
  }

  // Cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for ${err.path}`,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      timestamp: new Date().toISOString(),
    });
  }

  const response = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  if (ENV.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}
