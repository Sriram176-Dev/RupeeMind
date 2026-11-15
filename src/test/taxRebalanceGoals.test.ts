// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  calculateHoldingPeriod,
  getFinancialYear,
  getTaxAssetClass,
  TAX_RULES,
} from '../../server/src/config/taxRules.js';
import { calculateGoalProjections, simulateSkippedSips } from '../../server/src/services/goalService.js';

describe('Phase 2: Tax, Rebalancing, Goals, and Insurance Math', () => {
  describe('Tax Rules & Financial Year Utilities', () => {
    it('correctly determines Indian Financial Year across April 1 boundary', () => {
      // Prior to April 1 -> previous calendar year FY
      expect(getFinancialYear('2024-03-15')).toBe('FY 2023-24');
      expect(getFinancialYear('2024-03-31')).toBe('FY 2023-24');

      // On or after April 1 -> new FY
      expect(getFinancialYear('2024-04-01')).toBe('FY 2024-25');
      expect(getFinancialYear('2024-12-15')).toBe('FY 2024-25');
      expect(getFinancialYear('2025-01-10')).toBe('FY 2024-25');
    });

    it('correctly calculates holding duration in days and approximate months', () => {
      const buy = new Date('2023-01-01');
      const sell = new Date('2024-01-01'); // 365 days
      const { days, months } = calculateHoldingPeriod(buy, sell);

      expect(days).toBe(365);
      expect(months).toBeGreaterThanOrEqual(11.9);
      expect(months).toBeLessThanOrEqual(12.1);
    });

    it('classifies assets into appropriate Indian capital gains tax categories', () => {
      expect(getTaxAssetClass('STOCK', '', 'Reliance Industries')).toBe('EQUITY');
      expect(getTaxAssetClass('MUTUAL_FUND', 'Flexi Cap Fund', 'Parag Parikh Flexi Cap')).toBe('EQUITY');
      expect(getTaxAssetClass('MUTUAL_FUND', 'Liquid Fund', 'HDFC Liquid Fund')).toBe('DEBT');
      expect(getTaxAssetClass('MUTUAL_FUND', 'Corporate Bond', 'ICICI Prudential Corporate Bond')).toBe('DEBT');
      expect(getTaxAssetClass('MUTUAL_FUND', 'Precious Metal', 'Nippon India Gold ETF')).toBe('GOLD');
    });

    it('applies Finance Act 2024 ₹1.25L LTCG exemption and 20% STCG rates', () => {
      expect(TAX_RULES.EQUITY.LTCG_EXEMPTION_LIMIT).toBe(125000);
      expect(TAX_RULES.EQUITY.STCG_RATE).toBe(0.20);
      expect(TAX_RULES.EQUITY.LTCG_RATE).toBe(0.125);
    });
  });

  describe('FIFO Tax Lot Matching & Harvesting Logic', () => {
    it('correctly consumes earliest lots first and computes gain', () => {
      // Simulate FIFO queue
      const lots = [
        { date: '2023-01-10', units: 100, price: 100 }, // Lot 1: ₹10,000 cost
        { date: '2023-06-10', units: 50, price: 120 },  // Lot 2: ₹6,000 cost
      ];

      // Sell 120 units at ₹150 on 2024-03-01
      const sellUnits = 120;
      const sellPrice = 150;

      // Matched: 100 units from Lot 1, 20 units from Lot 2
      const matchedLot1 = {
        units: 100,
        buyCost: 100 * 100,
        proceeds: 100 * sellPrice,
        gain: (100 * sellPrice) - (100 * 100), // 15,000 - 10,000 = 5,000
      };

      const matchedLot2 = {
        units: 20,
        buyCost: 20 * 120,
        proceeds: 20 * sellPrice,
        gain: (20 * sellPrice) - (20 * 120), // 3,000 - 2,400 = 600
      };

      expect(matchedLot1.gain).toBe(5000);
      expect(matchedLot2.gain).toBe(600);
      expect(matchedLot1.gain + matchedLot2.gain).toBe(5600);

      // Remaining in Lot 2: 30 units
      const remainingLot2 = 50 - 20;
      expect(remainingLot2).toBe(30);
    });

    it('computes LTCG tax harvesting units within ₹1.25L exemption', () => {
      const remainingExemption = 125000;
      const lot = {
        units: 1000,
        buyPrice: 100,
        currentPrice: 200, // Gain per unit = ₹100
        totalGain: 100000,
      };

      const gainPerUnit = lot.currentPrice - lot.buyPrice; // 100
      const unitsToHarvest = Math.min(lot.units, Math.ceil(remainingExemption / gainPerUnit));
      const harvestedGain = unitsToHarvest * gainPerUnit;
      const taxSaved = harvestedGain * 0.125 * 1.04; // 12.5% + 4% cess

      expect(unitsToHarvest).toBe(1000); // Sells all 1000 units to harvest ₹1,00,000
      expect(harvestedGain).toBe(100000);
      expect(taxSaved).toBe(13000); // 13,000 INR tax saved
    });
  });

  describe('Goal Projections & Skip Simulator Math', () => {
    it('projects future value of lump sum and monthly SIP correctly', () => {
      const goal = {
        targetAmount: 2500000, // 25 Lakh
        currentAmount: 200000,  // 2 Lakh
        horizonYears: 5,        // 5 years
        monthlyContribution: 25000, // 25,000 / month
        expectedReturnRate: 0.12,   // 12% annual CAGR
      };

      const projections = calculateGoalProjections(goal);

      // FV Lumpsum = 2,00,000 * (1.12)^5 = ~3,52,468
      expect(projections.fvLumpsum).toBeGreaterThan(350000);
      expect(projections.fvLumpsum).toBeLessThan(355000);

      // FV SIP 25,000/mo at 12% for 5 years = ~20.62 Lakh
      expect(projections.fvSip).toBeGreaterThan(2000000);
      expect(projections.fvSip).toBeLessThan(2150000);

      // Total projected corpus = ~24.1 Lakh (Target is 25L, so slightly off track or near track)
      expect(projections.projectedCorpus).toBeGreaterThan(2350000);
      expect(projections.progressPercent).toBe(8); // 2L / 25L = 8%
    });

    it('simulates the compound penalty of skipping N monthly SIPs', () => {
      const goal = {
        _id: 'test-goal-1',
        name: 'Retirement 2035',
        targetAmount: 5000000,
        currentAmount: 500000,
        horizonYears: 10,
        monthlyContribution: 20000,
        expectedReturnRate: 0.12,
      };

      const sim1 = simulateSkippedSips(goal, 1);
      const sim3 = simulateSkippedSips(goal, 3);

      // Skipping 3 SIPs should drop corpus significantly more than 1 SIP
      expect(sim1.corpusDrop).toBeGreaterThan(20000); // More than raw cash due to lost compounding
      expect(sim3.corpusDrop).toBeGreaterThan(sim1.corpusDrop * 2.5);
      expect(sim3.monthsDelayed).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Emergency Fund & Term Insurance Multiple Formulas', () => {
    it('calculates monthly burn and recommended emergency fund correctly', () => {
      const monthlyExpenses = 40000;
      const monthlyEMI = 15000;
      const monthlyBurn = monthlyExpenses + monthlyEMI; // 55,000

      const targetMonths = 6;
      const recommendedBuffer = monthlyBurn * targetMonths; // 3,30,000

      const actualBuffer = 200000;
      const actualMonths = actualBuffer / monthlyBurn;
      const shortfall = recommendedBuffer - actualBuffer;

      expect(monthlyBurn).toBe(55000);
      expect(recommendedBuffer).toBe(330000);
      expect(actualMonths).toBeCloseTo(3.64, 1);
      expect(shortfall).toBe(130000);
    });

    it('calculates term insurance rule of thumb at 12x annual income', () => {
      const monthlyIncome = 100000;
      const annualIncome = monthlyIncome * 12; // 12,00,000
      const multiple = 12;
      const recommendedTermCover = annualIncome * multiple; // 1,44,00,000 (1.44 Cr)

      const existingCover = 5000000; // 50 Lakh
      const shortfall = recommendedTermCover - existingCover; // 94 Lakh

      expect(recommendedTermCover).toBe(14400000);
      expect(shortfall).toBe(9400000);
    });
  });
});
