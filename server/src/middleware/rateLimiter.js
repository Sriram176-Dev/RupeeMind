import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

const isTest = () => ENV.NODE_ENV === 'test';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Search rate limit reached. Please slow down.',
  },
});

export const readOnlyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Read request rate limit exceeded. Please slow down.',
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 15 minutes.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});
