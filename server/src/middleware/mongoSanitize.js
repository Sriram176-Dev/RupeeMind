/**
 * Middleware to sanitize object keys and prevent NoSQL injection ($ and . keys)
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys starting with $ or containing .
    if (!key.startsWith('$') && !key.includes('.')) {
      cleaned[key] = cleanObject(value);
    }
  }
  return cleaned;
}

export function mongoSanitize(req, res, next) {
  if (req.body) {
    req.body = cleanObject(req.body);
  }
  if (req.query) {
    req.query = cleanObject(req.query);
  }
  if (req.params) {
    req.params = cleanObject(req.params);
  }
  next();
}
