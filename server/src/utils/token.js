import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    ENV.JWT_REFRESH_SECRET,
    {
      expiresIn: ENV.REFRESH_TOKEN_EXPIRY,
    }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

export function setRefreshTokenCookie(res, refreshToken, accessToken = null) {
  const isProduction = ENV.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    });
  }
}

export function clearAuthCookies(res) {
  const isProduction = ENV.NODE_ENV === 'production';

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}
