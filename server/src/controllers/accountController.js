import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Watchlist } from '../models/Watchlist.js';
import { Holding } from '../models/Holding.js';
import { TrackedSIP } from '../models/TrackedSIP.js';
import { SavedCalculation } from '../models/SavedCalculation.js';
import { Recommendation } from '../models/Recommendation.js';
import { Notification } from '../models/Notification.js';
import { clearAuthCookies } from '../utils/token.js';

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required'),
});

export const updatePreferencesSchema = z.object({
  priceSignalAlerts: z.boolean().optional(),
  sipReminders: z.boolean().optional(),
});

/**
 * DELETE /api/account
 * Delete User and all associated collections
 */
export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password confirmation.' });
    }

    // Cascade delete all user documents
    await Promise.all([
      User.findByIdAndDelete(userId),
      Profile.deleteMany({ userId }),
      Watchlist.deleteMany({ userId }),
      Holding.deleteMany({ userId }),
      TrackedSIP.deleteMany({ userId }),
      SavedCalculation.deleteMany({ userId }),
      Recommendation.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
    ]);

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated financial data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/account/export
 * Export full user data in structured JSON
 */
export async function exportUserData(req, res, next) {
  try {
    const userId = req.user.id;

    const [user, profile, watchlist, holdings, sips, calculations, recommendations, notifications] = await Promise.all([
      User.findById(userId).select('-passwordHash -sessions -resetPasswordTokenHash -resetPasswordExpires -__v').lean(),
      Profile.findOne({ userId }).select('-__v').lean(),
      Watchlist.findOne({ userId }).select('-__v').lean(),
      Holding.find({ userId }).select('-__v').lean(),
      TrackedSIP.find({ userId }).select('-__v').lean(),
      SavedCalculation.find({ userId }).select('-__v').lean(),
      Recommendation.find({ userId }).select('-__v').lean(),
      Notification.find({ userId }).select('-__v').lean(),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        preferences: user?.preferences,
      },
      profile: profile || null,
      watchlist: watchlist?.items || [],
      holdings: holdings || [],
      trackedSIPs: sips || [],
      savedCalculations: calculations || [],
      recommendations: recommendations || [],
      notifications: notifications || [],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=rupeemind_data_export_${new Date().toISOString().split('T')[0]}.json`);

    return res.status(200).json(exportBundle);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/account/preferences
 * Update notification and alert preferences
 */
export async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const { priceSignalAlerts, sipReminders } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = { priceSignalAlerts: true, sipReminders: true };
    }

    if (priceSignalAlerts !== undefined) user.preferences.priceSignalAlerts = priceSignalAlerts;
    if (sipReminders !== undefined) user.preferences.sipReminders = sipReminders;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
}
