import { verifyAccessToken } from '../utils/token.js';

export async function protect(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]?.trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Authorization Bearer header is missing.',
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token. Please refresh your session.',
    });
  }

  req.user = { id: decoded.id, email: decoded.email };
  return next();
}
