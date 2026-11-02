import { Watchlist } from '../models/Watchlist.js';
import { SignalHistory } from '../models/SignalHistory.js';
import * as signalService from '../services/signalService.js';

export async function runSignalHistoryJob() {
  let signalFlipsDetected = 0;
  let errors = 0;
  const watchlists = await Watchlist.find({}).lean();

  for (const watchlist of watchlists) {
    if (!watchlist.items?.length) continue;

    for (const item of watchlist.items) {
      try {
        const data = await signalService.computeStockSignal(item.symbol);
        if (!data) continue;

        const { signal, score, mlModel } = data;
        let historyRecord = await SignalHistory.findOne({
          userId: watchlist.userId,
          symbol: item.symbol,
        });

        if (!historyRecord) {
          historyRecord = new SignalHistory({
            userId: watchlist.userId,
            symbol: item.symbol,
            previousSignal: 'HOLD',
            currentSignal: signal,
            previousScore: 0,
            currentScore: score,
            mlUsed: !!mlModel?.used,
            mlConfidence: mlModel?.confidence ?? null,
            checkedAt: new Date(),
          });
        } else {
          const previousSignal = historyRecord.currentSignal;
          if (previousSignal !== signal) {
            signalFlipsDetected++;
            historyRecord.previousSignal = previousSignal;
            historyRecord.currentSignal = signal;
            historyRecord.previousScore = historyRecord.currentScore;
            historyRecord.currentScore = score;
            historyRecord.flippedAt = new Date();
            historyRecord.mlUsed = !!mlModel?.used;
            historyRecord.mlConfidence = mlModel?.confidence ?? null;
          } else {
            historyRecord.currentScore = score;
          }
          historyRecord.checkedAt = new Date();
        }

        await historyRecord.save();
      } catch (error) {
        if (error.code !== 11000) {
          errors++;
          if (!error.message?.includes('Insufficient historical data')) {
            console.error(`[SignalHistory] Error for ${item.symbol}:`, error.message);
          }
        }
      }
    }
  }

  console.log(`[SignalHistory] Finished: ${signalFlipsDetected} signal flips (${errors} errors).`);
  return { signalFlipsDetected, errors };
}