import { z } from 'zod';
import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import {
  evaluateAlerts,
  evaluateSingleAlert,
  MAX_ALERTS_PER_USER,
} from '../services/alertEvaluationService.js';

export const createAlertSchema = z.object({
  name: z.string().trim().min(1, 'Alert name is required').max(100),
  type: z.enum([
    'PRICE_ABOVE',
    'PRICE_BELOW',
    'PERCENT_CHANGE',
    'SIGNAL_FLIP',
    'DRIFT_THRESHOLD',
    'SIP_DUE',
  ]),
  targetSymbol: z.string().trim().toUpperCase().optional().default(''),
  targetName: z.string().trim().optional().default(''),
  targetValue: z.number().default(0),
  comparator: z
    .enum([
      'GREATER_THAN',
      'LESS_THAN',
      'PERCENT_CHANGE_ABS',
      'FLIPS_TO',
      'DRIFT_EXCEEDED',
      'IS_DUE',
    ])
    .optional(),
  targetSignal: z
    .enum(['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL', 'ANY_FLIP'])
    .optional()
    .default('ANY_FLIP'),
  deliveryChannels: z
    .array(z.enum(['IN_APP', 'EMAIL', 'PUSH']))
    .min(1, 'Select at least one delivery channel')
    .default(['IN_APP', 'EMAIL']),
  cooldownMinutes: z.number().min(1).max(10080).default(60),
});

export const updateAlertSchema = createAlertSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PAUSED', 'TRIGGERED', 'DISABLED']).optional(),
});

/**
 * GET /api/alerts
 * List all user alerts
 */
export async function getAlerts(req, res, next) {
  try {
    const alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
    const pausedCount = alerts.filter((a) => a.status === 'PAUSED').length;

    return res.json({
      success: true,
      data: alerts,
      meta: {
        total: alerts.length,
        active: activeCount,
        paused: pausedCount,
        maxLimit: MAX_ALERTS_PER_USER,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/alerts
 * Create a new user alert with cap enforcement
 */
export async function createAlert(req, res, next) {
  try {
    const validated = createAlertSchema.parse(req.body);

    // Enforce per-user alert cap
    const currentAlertCount = await Alert.countDocuments({
      userId: req.user.id,
      status: { $ne: 'DISABLED' },
    });

    if (currentAlertCount >= MAX_ALERTS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum allowed limit of ${MAX_ALERTS_PER_USER} alerts. Delete or pause unused alerts to create new ones.`,
      });
    }

    const alert = await Alert.create({
      userId: req.user.id,
      ...validated,
    });

    return res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/alerts/:id
 * Update or pause/resume an alert
 */
export async function updateAlert(req, res, next) {
  try {
    const validated = updateAlertSchema.parse(req.body);

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: validated },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    return res.json({
      success: true,
      data: alert,
      message: 'Alert updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
export async function deleteAlert(req, res, next) {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    return res.json({
      success: true,
      message: 'Alert deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/alerts/history
 * List notification trigger history for user's alerts
 */
export async function getAlertHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('alertId', 'name type targetSymbol')
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/alerts/evaluate-now
 * Manually evaluate active alerts for current user
 */
export async function evaluateUserAlertsNow(req, res, next) {
  try {
    const result = await evaluateAlerts(req.user.id);
    return res.json({
      success: true,
      data: result,
      message: `Evaluated ${result.evaluatedCount} rules (${result.triggeredCount} triggered).`,
    });
  } catch (error) {
    next(error);
  }
}
