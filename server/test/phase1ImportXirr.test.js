import { describe, it, expect } from 'vitest';
import {
  parseFlexibleDate,
  normalizeName,
  calculateTokenSimilarity,
  parseBrokerCSV,
} from '../src/services/importParserService.js';
import { calculateXIRR } from '../src/services/xirrService.js';
import { estimateHistoricalNiftyPrice } from '../src/services/benchmarkService.js';

describe('Phase 1: Portfolio Import, XIRR, and Benchmark Engine', () => {
  describe('Date Parsing & Name Normalization', () => {
    it('correctly parses varied date formats (DD-MMM-YYYY, DD/MM/YYYY, YYYY-MM-DD)', () => {
      const d1 = parseFlexibleDate('12-Jan-2023');
      expect(d1).not.toBeNull();
      expect(d1.getUTCFullYear()).toBe(2023);
      expect(d1.getUTCMonth()).toBe(0); // Jan
      expect(d1.getUTCDate()).toBe(12);

      const d2 = parseFlexibleDate('05/03/2024');
      expect(d2).not.toBeNull();
      expect(d2.getUTCFullYear()).toBe(2024);
      expect(d2.getUTCMonth()).toBe(2); // Mar
      expect(d2.getUTCDate()).toBe(5);

      const d3 = parseFlexibleDate('2023-11-20');
      expect(d3).not.toBeNull();
      expect(d3.getFullYear()).toBe(2023);
    });

    it('normalizes mutual fund scheme names by removing noise tokens', () => {
      const raw = 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth Option';
      const clean = normalizeName(raw);
      expect(clean).toContain('parag parikh flexi cap');
      expect(clean).not.toContain('direct');
      expect(clean).not.toContain('growth');
      expect(clean).not.toContain('option');
    });

    it('calculates token similarity for fuzzy scheme mapping', () => {
      const s1 = 'Mirae Asset Large Cap Fund - Direct Plan - Growth';
      const s2 = 'Mirae Asset Large Cap Fund';
      const sim = calculateTokenSimilarity(s1, s2);
      expect(sim).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('Broker CSV Parsing', () => {
    it('parses valid broker CSV tradebook into structured transactions', async () => {
      const sampleCsv = `Trade Date,Instrument,Trade Type,Quantity,Price,Amount,Folio
12-Jan-2023,HDFC Top 100 Fund - Direct Plan - Growth,BUY,100,55.20,5520,10293847
15-Feb-2023,HDFC Top 100 Fund - Direct Plan - Growth,SIP,50,56.10,2805,10293847
10-May-2023,RELIANCE,BUY,10,2500,25000,
20-Jun-2023,HDFC Top 100 Fund - Direct Plan - Growth,SELL,30,58.00,1740,10293847`;

      const result = await parseBrokerCSV(sampleCsv);

      expect(result.detectedType).toBe('BROKER_CSV');
      expect(result.totalTransactions).toBe(4);
      expect(result.totalFolios).toBe(1);

      // Verify individual transaction properties
      const buyTxn = result.transactions[0];
      expect(buyTxn.type).toBe('PURCHASE');
      expect(buyTxn.units).toBe(100);
      expect(buyTxn.price).toBe(55.2);
      expect(buyTxn.amount).toBe(-5520); // Outflow is negative
      expect(buyTxn.folio).toBe('10293847');

      // Verify SIP transaction
      const sipTxn = result.transactions[1];
      expect(sipTxn.type).toBe('SIP');
      expect(sipTxn.amount).toBe(-2805);

      // Verify Redemption transaction
      const sellTxn = result.transactions[3];
      expect(sellTxn.type).toBe('REDEMPTION');
      expect(sellTxn.units).toBe(-30);
      expect(sellTxn.amount).toBe(1740); // Inflow from redemption is positive
    });

    it('throws error on empty or malformed CSV input', async () => {
      await expect(parseBrokerCSV('')).rejects.toThrow('CSV text content is empty');
      await expect(parseBrokerCSV('Random Text without headers')).rejects.toThrow();
    });
  });

  describe('XIRR Engine (Server Implementation)', () => {
    it('computes 1-year annualized XIRR accurately with Newton-Raphson', () => {
      const cashFlows = [
        { amount: -100000, date: new Date('2023-01-01') },
        { amount: 115000, date: new Date('2024-01-01') },
      ];

      const xirr = calculateXIRR(cashFlows);
      expect(xirr).not.toBeNull();
      expect(xirr).toBeCloseTo(15.0, 1);
    });

    it('computes SIP installment XIRR with bisection robustness', () => {
      const cashFlows = [
        { amount: -10000, date: new Date('2023-01-01') },
        { amount: -10000, date: new Date('2023-02-01') },
        { amount: -10000, date: new Date('2023-03-01') },
        { amount: 33500, date: new Date('2023-07-01') },
      ];

      const xirr = calculateXIRR(cashFlows);
      expect(xirr).not.toBeNull();
      expect(xirr).toBeGreaterThan(10.0);
    });
  });

  describe('Benchmark Simulation Service', () => {
    it('interpolates historical NIFTY 50 prices reliably across anchor years', () => {
      const p2018 = estimateHistoricalNiftyPrice(new Date('2018-01-01'));
      expect(p2018).toBe(10860);

      const p2021 = estimateHistoricalNiftyPrice(new Date('2021-06-01'));
      expect(p2021).toBeGreaterThan(13981);
      expect(p2021).toBeLessThan(18105);

      const p2026 = estimateHistoricalNiftyPrice(new Date('2026-06-01'));
      expect(p2026).toBe(24340);
    });
  });
});
