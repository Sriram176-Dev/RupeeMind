import { describe, it, expect } from 'vitest';
import { calculateSIP, calculateStepUpSIP, calculateLumpsum, calculateGoalPlanner, calculateInflationAdjusted } from '../lib/calculators';

describe('Client-side Calculators', () => {
  it('calculates standard SIP accurately (10k/mo at 12% for 10yr = ~23.23L)', () => {
    const result = calculateSIP(10000, 12, 10);
    expect(result.investedAmount).toBe(1200000);
    expect(result.totalValue).toBe(2323391);
    expect(result.estimatedReturns).toBe(1123391);
    expect(result.breakdown).toHaveLength(10);
  });

  it('calculates lumpsum accurately (1L at 12% for 5yr = ~1.76L)', () => {
    const result = calculateLumpsum(100000, 12, 5);
    expect(result.investedAmount).toBe(100000);
    expect(result.totalValue).toBe(176234);
    expect(result.estimatedReturns).toBe(76234);
  });

  it('calculates step-up SIP with annual increases', () => {
    const result = calculateStepUpSIP(10000, 10, 12, 10);
    expect(result.investedAmount).toBeGreaterThan(1200000);
    expect(result.totalValue).toBeGreaterThan(2323391);
  });

  it('calculates goal planner required SIP amount', () => {
    const targetAmount = 2500000; // 25 Lakh
    const years = 10;
    const rate = 12;

    const result = calculateGoalPlanner(targetAmount, years, rate);
    expect(result.requiredMonthlySIP).toBeGreaterThan(10000);
    expect(result.requiredMonthlySIP).toBeLessThan(12000);
    expect(result.calculationResult.totalValue).toBeGreaterThanOrEqual(targetAmount - 10000);
  });

  it('calculates inflation adjusted SIP real purchasing power', () => {
    const result = calculateInflationAdjusted(10000, 12, 6, 10);
    expect(result.nominalResult.totalValue).toBe(2323391);
    expect(result.realPurchasingPower).toBeLessThan(result.nominalResult.totalValue);
  });
});
