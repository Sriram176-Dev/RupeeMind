import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
