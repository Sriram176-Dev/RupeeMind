/**
 * Security middleware for Express
 */

/**
 * Security headers middleware
 */
export function securityHeaders(req, res, next) {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Additional security headers (already handled by helmet, but ensuring extras)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Request size limiter
 */
export function requestSizeLimit(maxSize = '1mb') {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        timestamp: new Date().toISOString(),
      });
    }
    
    next();
  };
}

/**
 * Parse size string to bytes
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 1024 * 1024; // Default to 1MB
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  return value * (units[unit] || 1);
}

/**
 * Request ID middleware
 */
export function requestId(req, res, next) {
  req.id = req.get('x-request-id') || generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/**
 * Hide server information
 */
export function hideServerInfo(req, res, next) {
  res.removeHeader('Server');
  next();
}
