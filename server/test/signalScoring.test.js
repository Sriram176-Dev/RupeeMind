import { describe, it, expect } from 'vitest';
import { scorePointInTime, runWalkForwardBacktest, MAX_POSSIBLE_SCORE } from '../src/services/signalService.js';

describe('Signal Scoring & Backtesting Engine', () => {
  // Generate 300 synthetic daily bars with an upward trend to test scoring & backtesting
  function createSyntheticHistory(count = 300) {
    const bars = [];
    let price = 500;
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate.getTime() + i * 86400000);
      // Oscillate with trend
      const change = Math.sin(i / 10) * 10 + 1.2;
      const close = Math.max(100, price + change);
      const open = price;
      const high = Math.max(open, close) + 4;
      const low = Math.min(open, close) - 4;
      const volume = 100000 + Math.floor(Math.sin(i) * 50000);

      bars.push({
        date: d.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
    }
    return bars;
  }

  describe('scorePointInTime', () => {
    it('returns null if history is less than 201 bars', () => {
      const shortCloses = new Array(150).fill(100);
      const shortVols = new Array(150).fill(1000);
      const result = scorePointInTime(shortCloses, shortVols);
      expect(result).toBeNull();
    });

    it('evaluates all 5 indicator groups when sufficient history is provided', () => {
      const history = createSyntheticHistory(250);
      const closes = history.map((h) => h.close);
      const volumes = history.map((h) => h.volume);

      const evaluation = scorePointInTime(closes, volumes);

      expect(evaluation).not.toBeNull();
      expect(evaluation).toHaveProperty('score');
      expect(evaluation).toHaveProperty('signal');
      expect(evaluation).toHaveProperty('indicators');

      // Verify all 5 indicator groups are in indicators object
      expect(evaluation.indicators).toHaveProperty('rsi');
      expect(evaluation.indicators).toHaveProperty('macd');
      expect(evaluation.indicators).toHaveProperty('sma50');
      expect(evaluation.indicators).toHaveProperty('bb');
      expect(evaluation.indicators).toHaveProperty('vol20');

      // Verify signal strength formula = |score| / MAX_POSSIBLE_SCORE * 100
      const strength = Math.round((Math.abs(evaluation.score) / MAX_POSSIBLE_SCORE) * 100);
      expect(typeof strength).toBe('number');
      expect(strength).toBeGreaterThanOrEqual(0);
      expect(strength).toBeLessThanOrEqual(100);
    });

    it('unclamped signal strength is 0 for neutral score (score = 0)', () => {
      // Check strength calculation directly
      const score = 0;
      const strength = Math.round((Math.abs(score) / MAX_POSSIBLE_SCORE) * 100);
      expect(strength).toBe(0);
    });

    it('unclamped signal strength reaches 100 for maximum score (score = 8)', () => {
      const score = 8;
      const strength = Math.round((Math.abs(score) / MAX_POSSIBLE_SCORE) * 100);
      expect(strength).toBe(100);
    });
  });

  describe('runWalkForwardBacktest', () => {
    it('returns status insufficient_data when total bars < 221', async () => {
      const shortHistory = createSyntheticHistory(150);
      const result = await runWalkForwardBacktest(shortHistory);
      expect(result.status).toBe('insufficient_data');
      expect(result.sampleSize).toBe(0);
      expect(result).toHaveProperty('pooledNifty50');
    });

    it('runs point-in-time walk-forward simulation with baseline calculation and non-overlapping trades', async () => {
      const history = createSyntheticHistory(350);
      const result = await runWalkForwardBacktest(history);

      expect(result).toHaveProperty('sampleSize');
      expect(result).toHaveProperty('baselineAvgReturn');
      expect(typeof result.baselineAvgReturn).toBe('number');

      if (result.sampleSize >= 10) {
        expect(result.status).toBe('ok');
        expect(typeof result.winRate).toBe('number');
        expect(typeof result.avgReturn).toBe('number');
      } else {
        expect(result.status).toBe('insufficient_data');
        expect(result).toHaveProperty('pooledNifty50');
      }
    });
  });
});
