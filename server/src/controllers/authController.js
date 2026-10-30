import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import NodeCache from 'node-cache';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Watchlist } from '../models/Watchlist.js';
import { Notification } from '../models/Notification.js';
import {
  generateTokens,
  hashToken,
  setRefreshTokenCookie,
  clearAuthCookies,
  verifyRefreshToken,
} from '../utils/token.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// 15-minute lockout for 5 failed attempts per email
const failedLoginCache = new NodeCache({ stdTTL: 900, checkperiod: 60 });

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

function addSessionToUser(user, refreshToken, userAgent = '') {
  const tokenHash = hashToken(refreshToken);
  const now = new Date();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Filter out expired sessions
  const activeSessions = (user.sessions || []).filter((s) => s.expiresAt > now);

  // Keep up to 4 existing active sessions and append new one (max 5 total)
  const trimmed = activeSessions.slice(-4);
  trimmed.push({
    tokenHash,
    previousTokenHash: null,
    rotatedAt: null,
    createdAt: now,
    expiresAt,
    userAgent: (userAgent || '').slice(0, 200),
  });

  user.sessions = trimmed;
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      passwordHash,
      onboardingDone: false,
      sessions: [],
    });

    const tokens = generateTokens({ id: user._id.toString(), email: user.email });
    addSessionToUser(user, tokens.refreshToken, req.headers['user-agent']);
    await user.save();

    // Create initial watchlist
    await Watchlist.create({
      userId: user._id,
      items: [],
    });

    // Create initial welcome notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to Rupee Mind! 🎉',
      body: 'Get started by completing your 5-step financial profiling questionnaire to evaluate your risk posture and unlock AI recommendations.',
      type: 'system',
      read: false,
    });

    setRefreshTokenCookie(res, tokens.refreshToken, tokens.accessToken);

    return res.status(201).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingDone: user.onboardingDone,
      },
      profile: null,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const emailKey = `failed_login:${email.toLowerCase().trim()}`;

    // Check failed login lockout
    const failedCount = failedLoginCache.get(emailKey) || 0;
    if (failedCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      failedLoginCache.set(emailKey, failedCount + 1, 900);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const newCount = failedCount + 1;
      failedLoginCache.set(emailKey, newCount, 900);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Successful login: reset failed login counter
    failedLoginCache.del(emailKey);

    const tokens = generateTokens({ id: user._id.toString(), email: user.email });
    addSessionToUser(user, tokens.refreshToken, req.headers['user-agent']);
    user.lastLoginAt = new Date();
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });

    setRefreshTokenCookie(res, tokens.refreshToken, tokens.accessToken);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingDone: user.onboardingDone,
        lastLoginAt: user.lastLoginAt,
      },
      profile: profile || null,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await User.findOneAndUpdate(
        { $or: [{ 'sessions.tokenHash': tokenHash }, { 'sessions.previousTokenHash': tokenHash }] },
        { $pull: { sessions: { $or: [{ tokenHash }, { previousTokenHash: tokenHash }] } } }
      );
    }

    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found',
    });
  }

  const incomingHash = hashToken(refreshToken);
  const decoded = verifyRefreshToken(refreshToken);

  // 1. Find user with this exact active session
  const user = await User.findOne({ 'sessions.tokenHash': incomingHash });

  if (user) {
    const sessionIndex = user.sessions.findIndex((s) => s.tokenHash === incomingHash);
    const newTokens = generateTokens({ id: user._id.toString(), email: user.email });
    const newTokenHash = hashToken(newTokens.refreshToken);

    if (sessionIndex > -1) {
      user.sessions[sessionIndex].previousTokenHash = incomingHash;
      user.sessions[sessionIndex].rotatedAt = new Date();
      user.sessions[sessionIndex].tokenHash = newTokenHash;
      user.sessions[sessionIndex].expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      user.sessions[sessionIndex].userAgent = (req.headers['user-agent'] || user.sessions[sessionIndex].userAgent || '').slice(0, 200);
    }

    await user.save();
    setRefreshTokenCookie(res, newTokens.refreshToken, newTokens.accessToken);

    return res.status(200).json({
      success: true,
      accessToken: newTokens.accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingDone: user.onboardingDone,
      },
    });
  }

  // 2. Refresh-token reuse tolerance check: Was this token rotated less than 15 seconds ago?
  const userWithPrevious = await User.findOne({ 'sessions.previousTokenHash': incomingHash });
  if (userWithPrevious) {
    const session = userWithPrevious.sessions.find((s) => s.previousTokenHash === incomingHash);
    const elapsedMs = session?.rotatedAt ? Date.now() - new Date(session.rotatedAt).getTime() : Infinity;

    if (elapsedMs <= 15000) {
      // Within 15-second grace window (concurrent requests or multiple tabs)
      const newTokens = generateTokens({ id: userWithPrevious._id.toString(), email: userWithPrevious.email });
      setRefreshTokenCookie(res, newTokens.refreshToken, newTokens.accessToken);
      return res.status(200).json({
        success: true,
        accessToken: newTokens.accessToken,
        user: {
          id: userWithPrevious._id.toString(),
          name: userWithPrevious.name,
          email: userWithPrevious.email,
          onboardingDone: userWithPrevious.onboardingDone,
        },
      });
    }

    // Reuse after 15-second grace window -> Potential Token Theft! Revoke all sessions.
    userWithPrevious.sessions = [];
    await userWithPrevious.save();
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: 'Security alert: Refresh token reuse detected outside grace window. All active sessions have been revoked. Please sign in again.',
    });
  }

  // 3. Fallback token reuse check: Token signature is valid with user id, but not found in any session
  if (decoded && decoded.id) {
    try {
      const compromisedUser = await User.findById(decoded.id);
      if (compromisedUser) {
        compromisedUser.sessions = [];
        await compromisedUser.save();
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: 'Security alert: Revoked refresh token presented. All active sessions have been revoked. Please sign in again.',
        });
      }
    } catch {}
  }

  clearAuthCookies(res);
  return res.status(401).json({
    success: false,
    message: 'Invalid or revoked refresh token. Please sign in again.',
  });
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);

    // Revoke all other sessions, keep only the current refreshToken if present
    const currentRefreshToken = req.cookies?.refreshToken;
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    if (currentHash) {
      user.sessions = (user.sessions || []).filter(
        (s) => s.tokenHash === currentHash || s.previousTokenHash === currentHash
      );
    } else {
      user.sessions = [];
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. All other active sessions have been logged out.',
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      // Generate 32-byte hex token
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordTokenHash = hashToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      try {
        await sendPasswordResetEmail({ to: user.email, resetToken: rawToken });
      } catch (err) {
        console.error('[Email Error] Failed to send password reset email:', err.message);
      }
    }

    // Always return generic success message to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    user.sessions = []; // Revoke all sessions on password reset
    await user.save();

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -sessions -resetPasswordTokenHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const profile = await Profile.findOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingDone: user.onboardingDone,
        lastLoginAt: user.lastLoginAt,
        preferences: user.preferences || { priceSignalAlerts: true, sipReminders: true },
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
}
