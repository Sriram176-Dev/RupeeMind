import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendUserNotification } from '../socket.js';

export const updateNotificationPreferencesSchema = z.object({
  priceSignalAlerts: z.boolean().optional(),
  signalFlipAlerts: z.boolean().optional(),
  sipReminders: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
});

export const setPriceThresholdSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(30).trim(),
  upper: z.union([z.number(), z.string(), z.null()]).optional(),
  lower: z.union([z.number(), z.string(), z.null()]).optional(),
  active: z.boolean().optional(),
});

export const getNotificationsQuerySchema = z.object({
  type: z.string().optional(),
  read: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user with optional type filtering and pagination.
 */
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, read, limit = 50, page = 1 } = req.query;

    const filter = { userId };
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
export async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ success: true, notification, unreadCount });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user.
 */
export async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await Notification.findOneAndDelete({ _id: id, userId });
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ success: true, message: 'Notification deleted', unreadCount });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notifications/preferences
 * Get current user notification preferences & price thresholds.
 */
export async function getPreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('preferences').lean();

    const preferences = user?.preferences || {
      priceSignalAlerts: true,
      signalFlipAlerts: true,
      sipReminders: true,
      emailAlerts: false,
      priceThresholds: {},
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences.
 */
export async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const { priceSignalAlerts, signalFlipAlerts, sipReminders, emailAlerts } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    if (priceSignalAlerts !== undefined) user.preferences.priceSignalAlerts = !!priceSignalAlerts;
    if (signalFlipAlerts !== undefined) user.preferences.signalFlipAlerts = !!signalFlipAlerts;
    if (sipReminders !== undefined) user.preferences.sipReminders = !!sipReminders;
    if (emailAlerts !== undefined) user.preferences.emailAlerts = !!emailAlerts;

    await user.save();

    res.json({
      success: true,
      preferences: user.preferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notifications/preferences/threshold
 * Set or update a price threshold for a symbol.
 */
export async function setPriceThreshold(req, res, next) {
  try {
    const userId = req.user.id;
    const { symbol, upper, lower, active = true } = req.body;

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    const cleanSym = symbol.toUpperCase().trim();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.priceThresholds) {
      user.preferences.priceThresholds = new Map();
    }

    const thresholdData = {
      upper: upper !== undefined && upper !== null && upper !== '' ? Number(upper) : null,
      lower: lower !== undefined && lower !== null && lower !== '' ? Number(lower) : null,
      active: !!active,
    };

    if (user.preferences.priceThresholds instanceof Map) {
      user.preferences.priceThresholds.set(cleanSym, thresholdData);
    } else {
      user.preferences.priceThresholds[cleanSym] = thresholdData;
    }

    await user.save();

    res.json({
      success: true,
      symbol: cleanSym,
      threshold: thresholdData,
      message: `Price threshold updated for ${cleanSym}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notifications/preferences/threshold/:symbol
 * Remove a price threshold for a symbol.
 */
export async function deletePriceThreshold(req, res, next) {
  try {
    const userId = req.user.id;
    const cleanSym = req.params.symbol.toUpperCase().trim();

    const user = await User.findById(userId);
    if (!user || !user.preferences?.priceThresholds) {
      return res.json({ success: true, message: 'Threshold removed' });
    }

    if (user.preferences.priceThresholds instanceof Map) {
      user.preferences.priceThresholds.delete(cleanSym);
    } else {
      delete user.preferences.priceThresholds[cleanSym];
    }

    await user.save();

    res.json({
      success: true,
      message: `Price threshold deleted for ${cleanSym}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a notification for a specific user (internal helper, not an endpoint).
 */
export async function createNotification(userId, { type, title, body, severity = 'info', meta }) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      severity,
      meta: meta || {},
    });
    // Push in real-time via socket.io
    sendUserNotification(userId, notification);
    return notification;
  } catch (err) {
    console.error('[NotificationController] Failed to create notification:', err.message);
    return null;
  }
}
