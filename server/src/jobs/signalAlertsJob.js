/**
 * Smart Signal Alerts Job (Job B)
 * Checks watchlist stocks for signal changes (flips), strong BUY/SELL signals,
 * and price threshold breaches. Emits real-time notifications via WebSocket.
 */
import { Watchlist } from '../models/Watchlist.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { SignalHistory } from '../models/SignalHistory.js';
import * as signalService from '../services/signalService.js';
import * as marketService from '../services/marketService.js';
import { sendUserNotification } from '../socket.js';

export async function runSignalAlertsJob() {
  const today = new Date().toISOString().split('T')[0];
  let notificationsCreated = 0;
  let signalFlipsDetected = 0;
  let thresholdBreachesDetected = 0;
  let errors = 0;

  // Get all watchlists
  const watchlists = await Watchlist.find({}).lean();

  for (const wl of watchlists) {
    if (!wl.items || wl.items.length === 0) continue;

    // Check user preferences
    const user = await User.findById(wl.userId);
    if (!user) continue;

    const priceSignalAlerts = user.preferences?.priceSignalAlerts !== false;
    const signalFlipAlerts = user.preferences?.signalFlipAlerts !== false;

    if (!priceSignalAlerts && !signalFlipAlerts) continue;

    const userThresholds = user.preferences?.priceThresholds || new Map();

    for (const item of wl.items) {
      const symbol = item.symbol;

      try {
        // 1. Fetch signal computation (with ML or rule fallback)
        const data = await signalService.computeStockSignal(symbol);
        if (!data) continue;

        const { signal, score, mlModel, indicators } = data;

        // 2. Flip Detection using SignalHistory
        let historyRecord = await SignalHistory.findOne({ userId: wl.userId, symbol });

        if (!historyRecord) {
          historyRecord = new SignalHistory({
            userId: wl.userId,
            symbol,
            previousSignal: 'HOLD',
            currentSignal: signal,
            previousScore: 0,
            currentScore: score,
            mlUsed: !!mlModel?.used,
            mlConfidence: mlModel?.confidence ?? null,
            checkedAt: new Date(),
          });
          await historyRecord.save();
        } else {
          const oldSignal = historyRecord.currentSignal;
          const isFlip = oldSignal !== signal;

          if (isFlip && signalFlipAlerts) {
            signalFlipsDetected++;
            const dedupeKey = `signal_flip_${symbol}_${oldSignal}_to_${signal}_${today}`;
            const severity = signal === 'BUY' ? 'success' : signal === 'SELL' ? 'critical' : 'info';

            try {
              const notif = await Notification.create({
                userId: wl.userId,
                type: 'signal_alert',
                severity,
                title: `Signal Flip: ${symbol} (${oldSignal} → ${signal})`,
                body: `${symbol} shifted from ${oldSignal} to ${signal} (Signal Score: ${score > 0 ? '+' : ''}${score}). Engine: ${mlModel?.used ? 'ML Pattern Recognition' : 'Technical Indicator Ensemble'}.`,
                meta: {
                  symbol,
                  oldSignal,
                  newSignal: signal,
                  score,
                  source: mlModel?.used ? 'ml' : 'rule',
                  route: `/market/${symbol}`,
                },
                dedupeKey,
              });

              sendUserNotification(wl.userId, notif);
              notificationsCreated++;
            } catch (dupErr) {
              // Duplicate within same day is fine
              if (dupErr.code !== 11000) errors++;
            }

            // Update history
            historyRecord.previousSignal = oldSignal;
            historyRecord.currentSignal = signal;
            historyRecord.previousScore = historyRecord.currentScore;
            historyRecord.currentScore = score;
            historyRecord.flippedAt = new Date();
            historyRecord.mlUsed = !!mlModel?.used;
            historyRecord.mlConfidence = mlModel?.confidence ?? null;
            historyRecord.checkedAt = new Date();
            await historyRecord.save();
          } else {
            // Update checkedAt and scores
            historyRecord.currentScore = score;
            historyRecord.checkedAt = new Date();
            await historyRecord.save();
          }
        }

        // 3. Strong BUY / SELL threshold alert (if not a flip or flip alert disabled)
        if (priceSignalAlerts && (signal === 'BUY' || signal === 'SELL')) {
          const dedupeKey = `signal_alert_${symbol}_${signal}_${today}`;
          try {
            const notif = await Notification.create({
              userId: wl.userId,
              type: 'signal_alert',
              severity: signal === 'BUY' ? 'success' : 'warning',
              title: `${signal} Signal: ${symbol}`,
              body: `${symbol} has sustained an algorithmic ${signal} signal (score: ${score >= 0 ? '+' : ''}${score}). Computed educational suggestion.`,
              meta: {
                symbol,
                score,
                route: `/market/${symbol}`,
              },
              dedupeKey,
            });
            sendUserNotification(wl.userId, notif);
            notificationsCreated++;
          } catch (dupErr) {
            if (dupErr.code !== 11000) errors++;
          }
        }

        // 4. Price Threshold Alerts (Upper / Lower Bounds)
        const threshold = userThresholds instanceof Map
          ? userThresholds.get(symbol)
          : userThresholds[symbol];

        if (threshold && threshold.active !== false) {
          const currentPrice = indicators?.sma50 || null; // fallback or from quote
          let quotePrice = currentPrice;

          try {
            const quotes = await marketService.getQuotes([symbol]);
            if (quotes?.data?.[0]?.price) {
              quotePrice = quotes.data[0].price;
            }
          } catch {
            // quote fetch failure is non-fatal
          }

          if (quotePrice) {
            if (threshold.upper && quotePrice >= threshold.upper) {
              thresholdBreachesDetected++;
              const dedupeKey = `price_alert_upper_${symbol}_${today}`;
              try {
                const notif = await Notification.create({
                  userId: wl.userId,
                  type: 'price_alert',
                  severity: 'warning',
                  title: `Price Alert: ${symbol} reached ₹${quotePrice}`,
                  body: `${symbol} crossed above your target threshold of ₹${threshold.upper}.`,
                  meta: {
                    symbol,
                    price: quotePrice,
                    targetPrice: threshold.upper,
                    route: `/market/${symbol}`,
                  },
                  dedupeKey,
                });
                sendUserNotification(wl.userId, notif);
                notificationsCreated++;
              } catch (dupErr) {
                if (dupErr.code !== 11000) errors++;
              }
            }

            if (threshold.lower && quotePrice <= threshold.lower) {
              thresholdBreachesDetected++;
              const dedupeKey = `price_alert_lower_${symbol}_${today}`;
              try {
                const notif = await Notification.create({
                  userId: wl.userId,
                  type: 'price_alert',
                  severity: 'warning',
                  title: `Price Dip Alert: ${symbol} dropped to ₹${quotePrice}`,
                  body: `${symbol} fell below your stop threshold of ₹${threshold.lower}.`,
                  meta: {
                    symbol,
                    price: quotePrice,
                    targetPrice: threshold.lower,
                    route: `/market/${symbol}`,
                  },
                  dedupeKey,
                });
                sendUserNotification(wl.userId, notif);
                notificationsCreated++;
              } catch (dupErr) {
                if (dupErr.code !== 11000) errors++;
              }
            }
          }
        }
      } catch (err) {
        if (err.code !== 11000) {
          errors++;
          if (!err.message?.includes('Insufficient historical data')) {
            console.error(`[SignalAlerts] Error for ${symbol}:`, err.message);
          }
        }
      }
    }
  }

  console.log(
    `[SignalAlerts] Finished: ${notificationsCreated} notifications created, ${signalFlipsDetected} flips, ${thresholdBreachesDetected} price breaches (${errors} errors).`
  );

  return {
    notificationsCreated,
    signalFlipsDetected,
    thresholdBreachesDetected,
    errors,
  };
}
