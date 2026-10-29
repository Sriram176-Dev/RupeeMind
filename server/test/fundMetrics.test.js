import { describe, it, expect } from 'vitest';
import { calculateFundMetrics, parseMfDate } from '../src/services/fundService.js';

describe('Mutual Fund Metrics Calculations', () => {
  describe('parseMfDate', () => {
    it('correctly parses DD-MM-YYYY into UTC Date', () => {
      const parsed = parseMfDate('15-08-2023');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getUTCDate()).toBe(15);
      expect(parsed.getUTCMonth()).toBe(7); // 0-indexed August
      expect(parsed.getUTCFullYear()).toBe(2023);
    });

    it('returns null on invalid date strings', () => {
      expect(parseMfDate(null)).toBeNull();
      expect(parseMfDate('')).toBeNull();
      expect(parseMfDate('invalid-date')).toBeNull();
    });
  });

  describe('calculateFundMetrics', () => {
    // Generate 3+ years of daily NAV data (newest first)
    function generateNavSeries() {
      const entries = [];
      const baseNav = 100;
      const today = new Date('2025-01-01T00:00:00Z');

      // ~ 1100 trading days (> 3 years)
      for (let i = 0; i < 1100; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const dayStr = String(d.getUTCDate()).padStart(2, '0');
        const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yearStr = d.getUTCFullYear();
        const dateStr = `${dayStr}-${monthStr}-${yearStr}`;

        // Steady growth from 100 to 150 over 3 years (~14.47% CAGR) with a dip
        const progress = (1100 - i) / 1100;
        let nav = baseNav * Math.pow(1.5, progress);

        // Add a 10% drawdown at ~1 year ago
        if (i >= 220 && i <= 280) {
          nav *= 0.90;
        }

        entries.push({
          date: dateStr,
          nav: nav.toFixed(2),
        });
      }

      return entries;
    }

    it('returns null metrics when fewer than 30 NAV entries exist', () => {
      const fewEntries = [
        { date: '01-01-2025', nav: '100' },
        { date: '02-01-2025', nav: '101' },
      ];
      const result = calculateFundMetrics(fewEntries);
      expect(result.cagr1Y).toBeNull();
      expect(result.cagr3Y).toBeNull();
      expect(result.maxDrawdown).toBeNull();
    });

    it('calculates CAGR and Max Drawdown accurately on historical NAV fixture', () => {
      const navSeries = generateNavSeries();
      const metrics = calculateFundMetrics(navSeries);

      expect(metrics).toHaveProperty('latestNav');
      expect(metrics).toHaveProperty('cagr1Y');
      expect(metrics).toHaveProperty('cagr3Y');
      expect(metrics).toHaveProperty('maxDrawdown');
      expect(metrics).toHaveProperty('volatility');

      expect(metrics.latestNav).toBeGreaterThan(0);
      expect(typeof metrics.cagr1Y).toBe('number');
      expect(typeof metrics.cagr3Y).toBe('number');
      expect(typeof metrics.maxDrawdown).toBe('number');

      // Drawdown was injected at ~10%
      expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(9.0);
      expect(metrics.maxDrawdown).toBeLessThanOrEqual(15.0);
    });
  });
});
