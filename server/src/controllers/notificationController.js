import { Notification } from '../models/Notification.js';

/**
 * GET /api/notifications
 * List notifications for current user with unread count
 */
export async function getNotifications(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const unreadOnly = req.query.unread === 'true';

    const query = { userId: req.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      meta: {
        unreadCount,
        total: notifications.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark single notification as read
 */
export async function markNotificationRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (error) {
    next(error);
  }
}
