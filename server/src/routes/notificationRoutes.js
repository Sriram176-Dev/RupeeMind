import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  setPriceThreshold,
  deletePriceThreshold,
  updateNotificationPreferencesSchema,
  setPriceThresholdSchema,
  getNotificationsQuerySchema,
} from '../controllers/notificationController.js';
import { validate, validateQuery } from '../middleware/validate.js';

const router = Router();

// All notification routes require authentication
router.use(protect);

// Preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', validate(updateNotificationPreferencesSchema), updatePreferences);
router.post('/preferences/threshold', validate(setPriceThresholdSchema), setPriceThreshold);
router.delete('/preferences/threshold/:symbol', deletePriceThreshold);

// Notifications list & manipulation
router.get('/', validateQuery(getNotificationsQuerySchema), getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
