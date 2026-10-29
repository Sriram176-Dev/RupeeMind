import { describe, it, expect } from 'vitest';
import { calculateRiskScore, calculateFinancialHealthScore } from '../src/services/scoreService.js';
import { conservativeProfile, aggressiveProfile } from './fixtures/testFixtures.js';

describe('Risk & Financial Health Scoring', () => {
  describe('calculateRiskScore', () => {
    it('correctly scores a conservative profile with low risk tolerance', () => {
      const result = calculateRiskScore(conservativeProfile);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('band');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      // Low risk tolerance profile should score lower than aggressive profile
      expect(result.score).toBeLessThan(50);
      expect(['Conservative', 'Moderately Conservative']).toContain(result.band);
    });

    it('correctly scores an aggressive profile with high risk tolerance', () => {
      const result = calculateRiskScore(aggressiveProfile);

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(['Aggressive', 'Moderately Aggressive', 'Moderate']).toContain(result.band);
    });

    it('handles empty / default profile gracefully', () => {
      const result = calculateRiskScore({});
      expect(result).toHaveProperty('score');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('evaluates healthy finances (high savings ratio, low debt, good emergency fund)', () => {
      const result = calculateFinancialHealthScore(aggressiveProfile);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('band');
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(['Strong', 'Excellent', 'Good', 'Moderate']).toContain(result.band);
    });

    it('penalizes high debt and lack of insurance', () => {
      const unhealthyProfile = {
        monthlyIncome: 50000,
        monthlyExpenses: 30000,
        monthlyEMIs: 25000, // 50% DTI
        monthlySavings: 0,
        emergencyFundAmount: 10000, // Less than 1 month
        hasLifeInsurance: false,
        hasHealthInsurance: false,
        dependentsCount: 3,
      };

      const result = calculateFinancialHealthScore(unhealthyProfile);
      expect(result.score).toBeLessThan(50);
    });
  });
});
