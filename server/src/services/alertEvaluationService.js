import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { TrackedSIP } from '../models/TrackedSIP.js';
import { getMarketQuotes } from './marketService.js';
import { calculateRebalancePlan } from './rebalancingService.js';
import { sendAlertTriggerEmail } from './emailService.js';
import { executeJob } from './jobRunner.js';

export const MAX_ALERTS_PER_USER = 20;

/**
 * Checks whether an alert is currently in cooldown suppression
 * @param {Object} alert 
 * @returns {boolean}
 */
export function isAlertInCooldown(alert) {
  if (!alert.lastTriggeredAt) return false;
  const cooldownMs = (alert.cooldownMinutes || 60) * 60 * 1000;
  const timeSinceLastTrigger = Date.now() - new Date(alert.lastTriggeredAt).getTime();
  return timeSinceLastTrigger < cooldownMs;
}

/**
 * Evaluates an individual alert rule against real-time financial data
 * @param {Object} alert Mongoose alert doc
 * @param {Object} [context] Optional preloaded context (quotes, user)
 * @returns {Promise<{ triggered: boolean, reason?: string, details?: any }>}
 */
export async function evaluateSingleAlert(alert, context = {}) {
  // Update lastEvaluatedAt
  alert.lastEvaluatedAt = new Date();

  // If already in cooldown, skip evaluation
  if (isAlertInCooldown(alert)) {
    await alert.save();
    return {
      triggered: false,
      reason: 'cooldown_active',
      remainingMinutes: Math.ceil(
        ((alert.cooldownMinutes || 60) * 60 * 1000 -
          (Date.now() - new Date(alert.lastTriggeredAt).getTime())) /
          60000
      ),
    };
  }

  let isTriggered = false;
  let headline = '';
  let message = '';
  let triggerData = {};
  let severity = 'INFO';

  try {
    switch (alert.type) {
      case 'PRICE_ABOVE':
      case 'PRICE_BELOW':
      case 'PERCENT_CHANGE': {
        const symbol = (alert.targetSymbol || '').toUpperCase();
        if (!symbol) break;

        const quotes = context.quotes || (await getMarketQuotes([symbol]));
        const quote = quotes.find((q) => q.symbol === symbol) || quotes[0];

        if (!quote || typeof quote.price !== 'number') {
          return { triggered: false, reason: 'quote_unavailable' };
        }

        const currentPrice = quote.price;
        const changePercent = quote.changePercent || 0;

        if (alert.type === 'PRICE_ABOVE') {
          if (currentPrice >= alert.targetValue) {
            isTriggered = true;
            headline = `${symbol} Crossed Above ₹${alert.targetValue.toLocaleString('en-IN')}`;
            message = `${symbol} is currently trading at ₹${currentPrice.toLocaleString('en-IN')}, exceeding your target threshold of ₹${alert.targetValue.toLocaleString('en-IN')}.`;
            severity = 'SUCCESS';
            triggerData = { symbol, currentPrice, targetValue: alert.targetValue, type: 'PRICE_ABOVE' };
          }
        } else if (alert.type === 'PRICE_BELOW') {
          if (currentPrice <= alert.targetValue) {
            isTriggered = true;
            headline = `${symbol} Dropped Below ₹${alert.targetValue.toLocaleString('en-IN')}`;
            message = `${symbol} is currently trading at ₹${currentPrice.toLocaleString('en-IN')}, dropping below your target threshold of ₹${alert.targetValue.toLocaleString('en-IN')}.`;
            severity = 'WARNING';
            triggerData = { symbol, currentPrice, targetValue: alert.targetValue, type: 'PRICE_BELOW' };
          }
        } else if (alert.type === 'PERCENT_CHANGE') {
          const absChange = Math.abs(changePercent);
          if (absChange >= alert.targetValue) {
            isTriggered = true;
            const dir = changePercent >= 0 ? 'gained' : 'lost';
            headline = `${symbol} Moved ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% Today`;
            message = `${symbol} has ${dir} ${absChange.toFixed(2)}% today (current price: ₹${currentPrice.toLocaleString('en-IN')}), exceeding your ±${alert.targetValue}% volatility threshold.`;
            severity = changePercent >= 0 ? 'SUCCESS' : 'WARNING';
            triggerData = { symbol, currentPrice, changePercent, targetValue: alert.targetValue };
          }
        }
        break;
      }

      case 'SIGNAL_FLIP': {
        const symbol = (alert.targetSymbol || '').toUpperCase();
        if (!symbol) break;

        // Fetch quote / technical indicator signal
        const quotes = context.quotes || (await getMarketQuotes([symbol]));
        const quote = quotes.find((q) => q.symbol === symbol);
        const currentSignal = quote?.technicalScore?.action || (quote?.changePercent > 0.5 ? 'BUY' : quote?.changePercent < -0.5 ? 'SELL' : 'NEUTRAL');

        const prevSignal = alert.metadata?.previousSignal || 'NEUTRAL';
        const targetSignal = alert.targetSignal || 'ANY_FLIP';

        const hasFlipped =
          (targetSignal === 'ANY_FLIP' && currentSignal !== prevSignal) ||
          (targetSignal !== 'ANY_FLIP' && currentSignal === targetSignal && prevSignal !== targetSignal);

        if (hasFlipped) {
          isTriggered = true;
          headline = `${symbol} Signal Flipped to ${currentSignal}`;
          message = `Algorithmic quant momentum for ${symbol} has flipped from ${prevSignal} to ${currentSignal} (current price: ₹${quote?.price || 0}).`;
          severity = currentSignal === 'BUY' ? 'SUCCESS' : currentSignal === 'SELL' ? 'WARNING' : 'INFO';
          triggerData = { symbol, currentSignal, prevSignal, targetSignal };

          // Update previous signal in metadata
          alert.metadata = { ...(alert.metadata || {}), previousSignal: currentSignal };
        }
        break;
      }

      case 'DRIFT_THRESHOLD': {
        const threshold = alert.targetValue || 5;
        const plan = await calculateRebalancePlan(alert.userId.toString(), threshold);

        if (plan.maxDrift >= threshold) {
          isTriggered = true;
          headline = `Portfolio Drift Exceeded (${plan.maxDrift.toFixed(1)}% vs ${threshold}% Target)`;
          message = `Your asset allocation has drifted beyond your ${threshold}% tolerance threshold (maximum drift: ${plan.maxDrift.toFixed(1)}%). Rebalancing recommended to protect risk parameters.`;
          severity = 'WARNING';
          triggerData = { maxDrift: plan.maxDrift, threshold, portfolioValue: plan.portfolioValue };
        }
        break;
      }

      case 'SIP_DUE': {
        // Find upcoming SIP installments for this user
        const sips = await TrackedSIP.find({ userId: alert.userId });
        const now = new Date();
        const currentDay = now.getDate();

        // Check if any SIP installment day is within next 3 days
        const dueSips = sips.filter((s) => {
          const installmentDay = parseInt(s.installmentDate || '1', 10);
          if (isNaN(installmentDay)) return false;
          const diff = installmentDay - currentDay;
          return diff >= 0 && diff <= 3;
        });

        if (dueSips.length > 0) {
          isTriggered = true;
          const totalDue = dueSips.reduce((sum, s) => sum + (s.amount || 0), 0);
          headline = `Upcoming SIP Installment Due: ₹${totalDue.toLocaleString('en-IN')}`;
          message = `You have ${dueSips.length} mutual fund SIP installment(s) totaling ₹${totalDue.toLocaleString('en-IN')} scheduled in the next 3 days. Ensure adequate bank balance to avoid NACH bounce fees.`;
          severity = 'INFO';
          triggerData = { dueCount: dueSips.length, totalDue, sips: dueSips.map((s) => s.fundName) };
        }
        break;
      }

      default:
        break;
    }

    if (isTriggered) {
      // 1. Update Alert state
      alert.triggerCount = (alert.triggerCount || 0) + 1;
      alert.lastTriggeredAt = new Date();
      alert.lastTriggerValue = triggerData;
      await alert.save();

      // 2. Create in-app Notification
      const notification = await Notification.create({
        userId: alert.userId,
        alertId: alert._id,
        title: headline,
        message,
        type:
          alert.type === 'DRIFT_THRESHOLD'
            ? 'DRIFT'
            : alert.type === 'SIP_DUE'
            ? 'SIP'
            : alert.type === 'SIGNAL_FLIP'
            ? 'SIGNAL'
            : 'PRICE',
        severity,
        metadata: triggerData,
        deliveryStatus: {
          inApp: { sent: true, sentAt: new Date() },
          email: { sent: false, sentAt: null, skipped: true },
          push: {
            status: 'TODO',
            note: 'Web push notification queued (service worker registration pending)',
          },
        },
      });

      // 3. Dispatch Email if channel enabled
      if (alert.deliveryChannels?.includes('EMAIL')) {
        const user = context.user || (await User.findById(alert.userId));
        if (user?.email) {
          const emailResult = await sendAlertTriggerEmail({
            to: user.email,
            alert,
            triggerDetails: { headline, message, ...triggerData },
          });

          await Notification.findByIdAndUpdate(notification._id, {
            'deliveryStatus.email': {
              sent: emailResult.success && !emailResult.skipped,
              sentAt: emailResult.success ? new Date() : null,
              skipped: Boolean(emailResult.skipped),
              error: emailResult.error || null,
            },
          });
        }
      }

      return {
        triggered: true,
        alertId: alert._id,
        headline,
        message,
        notificationId: notification._id,
      };
    } else {
      await alert.save();
      return { triggered: false, reason: 'threshold_not_met' };
    }
  } catch (err) {
    console.error(`[AlertEvaluation] Error evaluating alert ${alert._id}:`, err);
    await alert.save();
    return { triggered: false, error: err.message };
  }
}

/**
 * Evaluates all active alerts for a user or entire platform
 * @param {string} [userId] Optional user ID filter
 * @returns {Promise<{ evaluatedCount: number, triggeredCount: number, results: Array }>}
 */
export async function evaluateAlerts(userId = null) {
  const query = { status: 'ACTIVE' };
  if (userId) {
    query.userId = userId;
  }

  const activeAlerts = await Alert.find(query);
  if (activeAlerts.length === 0) {
    return { evaluatedCount: 0, triggeredCount: 0, results: [] };
  }

  // Pre-fetch quotes for any stock/symbol alerts in bulk
  const symbols = Array.from(
    new Set(activeAlerts.map((a) => a.targetSymbol).filter(Boolean))
  );
  let bulkQuotes = [];
  if (symbols.length > 0) {
    bulkQuotes = await getMarketQuotes(symbols);
  }

  const results = [];
  let triggeredCount = 0;

  for (const alert of activeAlerts) {
    const res = await evaluateSingleAlert(alert, { quotes: bulkQuotes });
    results.push(res);
    if (res.triggered) {
      triggeredCount++;
    }
  }

  return {
    evaluatedCount: activeAlerts.length,
    triggeredCount,
    results,
  };
}

/**
 * Background Job Runner task wrapper with lock and retry
 */
export async function evaluateAllAlertsJob() {
  return executeJob(
    'evaluate-alerts',
    async () => {
      const summary = await evaluateAlerts();
      return summary;
    },
    { maxAttempts: 2, baseDelayMs: 3000, trigger: 'cron' }
  );
}
