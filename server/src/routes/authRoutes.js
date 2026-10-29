import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  signupSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), signup);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

// Account Password Management
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
