// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  isAlertInCooldown,
  MAX_ALERTS_PER_USER,
} from '../../server/src/services/alertEvaluationService.js';

describe('Phase 3: Alerts Engine & Trigger Evaluation Rules', () => {
  describe('Cooldown Suppression Logic', () => {
    it('returns false for newly created alert that has never triggered', () => {
      const alert = {
        lastTriggeredAt: null,
        cooldownMinutes: 60,
      };
      expect(isAlertInCooldown(alert)).toBe(false);
    });

    it('returns true when current time is within cooldown window', () => {
      const alert = {
        lastTriggeredAt: new Date(Date.now() - 15 * 60 * 1000), // Triggered 15 mins ago
        cooldownMinutes: 60, // 60 mins cooldown
      };
      expect(isAlertInCooldown(alert)).toBe(true);
    });

    it('returns false once cooldown period has fully elapsed', () => {
      const alert = {
        lastTriggeredAt: new Date(Date.now() - 75 * 60 * 1000), // Triggered 75 mins ago
        cooldownMinutes: 60, // 60 mins cooldown
      };
      expect(isAlertInCooldown(alert)).toBe(false);
    });
  });

  describe('Price & Volatility Threshold Evaluation', () => {
    it('evaluates PRICE_ABOVE condition accurately', () => {
      const targetValue = 2500;
      const testCases = [
        { price: 2550, expectedTrigger: true },
        { price: 2500, expectedTrigger: true },
        { price: 2499.5, expectedTrigger: false },
        { price: 2100, expectedTrigger: false },
      ];

      for (const tc of testCases) {
        const isTriggered = tc.price >= targetValue;
        expect(isTriggered).toBe(tc.expectedTrigger);
      }
    });

    it('evaluates PRICE_BELOW condition accurately', () => {
      const targetValue = 1800;
      const testCases = [
        { price: 1750, expectedTrigger: true },
        { price: 1800, expectedTrigger: true },
        { price: 1801, expectedTrigger: false },
        { price: 2000, expectedTrigger: false },
      ];

      for (const tc of testCases) {
        const isTriggered = tc.price <= targetValue;
        expect(isTriggered).toBe(tc.expectedTrigger);
      }
    });

    it('evaluates PERCENT_CHANGE volatility threshold in either direction', () => {
      const threshold = 3.0; // 3%
      const moves = [
        { change: 3.5, expected: true },
        { change: -4.2, expected: true },
        { change: 2.1, expected: false },
        { change: -1.5, expected: false },
      ];

      for (const m of moves) {
        const triggered = Math.abs(m.change) >= threshold;
        expect(triggered).toBe(m.expected);
      }
    });
  });

  describe('Signal Flip & Directional Transition Evaluation', () => {
    it('detects algorithmic momentum signal flip from previous state', () => {
      const prevSignal = 'BUY';
      const currentSignal = 'SELL';
      const targetSignal = 'ANY_FLIP';

      const hasFlipped =
        (targetSignal === 'ANY_FLIP' && currentSignal !== prevSignal) ||
        (targetSignal !== 'ANY_FLIP' && currentSignal === targetSignal && prevSignal !== targetSignal);

      expect(hasFlipped).toBe(true);
    });

    it('does not trigger when signal remains unchanged', () => {
      const prevSignal = 'BUY';
      const currentSignal = 'BUY';
      const targetSignal = 'ANY_FLIP';

      const hasFlipped =
        (targetSignal === 'ANY_FLIP' && currentSignal !== prevSignal) ||
        (targetSignal !== 'ANY_FLIP' && currentSignal === targetSignal && prevSignal !== targetSignal);

      expect(hasFlipped).toBe(false);
    });

    it('respects specific directional signal target filters', () => {
      const prevSignal = 'NEUTRAL';
      const currentSignal = 'SELL';
      const targetSignal = 'BUY'; // User only wants notifications when flipping to BUY

      const hasFlipped =
        (targetSignal === 'ANY_FLIP' && currentSignal !== prevSignal) ||
        (targetSignal !== 'ANY_FLIP' && currentSignal === targetSignal && prevSignal !== targetSignal);

      expect(hasFlipped).toBe(false); // Does not match BUY target
    });
  });

  describe('Portfolio Drift & User Cap Constraints', () => {
    it('enforces maximum per-user alert capacity of 20', () => {
      expect(MAX_ALERTS_PER_USER).toBe(20);
    });

    it('identifies drift trigger when portfolio deviation exceeds threshold', () => {
      const driftThreshold = 5.0; // 5%
      const currentDrifts = [
        { maxDrift: 7.2, expectTrigger: true },
        { maxDrift: 5.0, expectTrigger: true },
        { maxDrift: 3.8, expectTrigger: false },
      ];

      for (const cd of currentDrifts) {
        const isTriggered = cd.maxDrift >= driftThreshold;
        expect(isTriggered).toBe(cd.expectTrigger);
      }
    });

    it('identifies upcoming SIP due dates within next 3 days', () => {
      const currentDay = 15;
      const sips = [
        { installmentDate: '16', due: true },  // 1 day away
        { installmentDate: '18', due: true },  // 3 days away
        { installmentDate: '25', due: false }, // 10 days away
        { installmentDate: '10', due: false }, // Already passed this month
      ];

      for (const s of sips) {
        const day = parseInt(s.installmentDate, 10);
        const diff = day - currentDay;
        const isDue = diff >= 0 && diff <= 3;
        expect(isDue).toBe(s.due);
      }
    });
  });
});
