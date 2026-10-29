import { describe, it, expect } from 'vitest';
import { scorePointInTime } from '../src/services/signalService.js';
import { getCircuitStatus, checkMLServiceHealth } from '../src/services/mlService.js';
import { isMLAvailable } from '../src/services/mlProcessManager.js';

describe('ML Resilience & Fallback Tests', () => {
  it('gracefully reports ML availability state without throwing', () => {
    const available = isMLAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('circuit breaker initializes in a valid state', () => {
    const circuit = getCircuitStatus();
    expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(circuit.state);
    expect(circuit.failureThreshold).toBeGreaterThan(0);
  });

  it('checks ML health safely without uncaught exceptions', async () => {
    const healthy = await checkMLServiceHealth(true);
    expect(typeof healthy).toBe('boolean');
  });

  it('computes robust point-in-time technical scores directly via rule engine', () => {
    // Generate synthetic 210 bars
    const closes = [];
    const volumes = [];
    for (let i = 0; i < 220; i++) {
      closes.push(100 + Math.sin(i / 10) * 15 + i * 0.1);
      volumes.push(10000 + (i % 5) * 2000);
    }

    const evaluation = scorePointInTime(closes, volumes);
    expect(evaluation).toBeDefined();
    expect(evaluation).not.toBeNull();
    expect(['BUY', 'HOLD', 'SELL']).toContain(evaluation.signal);
    expect(typeof evaluation.score).toBe('number');
    expect(evaluation.indicators).toBeDefined();
    expect(evaluation.indicators.rsi).toBeGreaterThanOrEqual(0);
    expect(evaluation.indicators.rsi).toBeLessThanOrEqual(100);
  });

  it('handles insufficient history gracefully in scorePointInTime', () => {
    const shortCloses = [100, 102, 101];
    const shortVolumes = [5000, 4000, 6000];
    const evaluation = scorePointInTime(shortCloses, shortVolumes);
    expect(evaluation).toBeNull();
  });
});
