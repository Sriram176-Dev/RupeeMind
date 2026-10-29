import { describe, it, expect } from 'vitest';

export function calculateSipFutureValue(monthlyInvestment, annualRatePct, years) {
  const i = annualRatePct / 100 / 12;
  const n = years * 12;
  if (i === 0) return monthlyInvestment * n;
  return Math.round(monthlyInvestment * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
}

export function calculateStepUpSipFutureValue(initialMonthly, annualRatePct, years, stepUpPct = 10) {
  let totalWealth = 0;
  const i = annualRatePct / 100 / 12;

  let currentMonthly = initialMonthly;
  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      const remainingMonths = (years - year) * 12 + (12 - month) + 1;
      totalWealth += currentMonthly * Math.pow(1 + i, remainingMonths);
    }
    currentMonthly = currentMonthly * (1 + stepUpPct / 100);
  }

  return Math.round(totalWealth);
}

describe('SIP Mathematical Formulations', () => {
  it('correctly calculates standard SIP: 10,000/month at 12% for 10 years is approx 23.23 Lakh', () => {
    const monthlyAmount = 10000;
    const annualRate = 12;
    const years = 10;

    const totalValue = calculateSipFutureValue(monthlyAmount, annualRate, years);
    const totalInvested = monthlyAmount * years * 12; // 12,00,000
    const estimatedReturns = totalValue - totalInvested;

    // Expected value is 2,323,391 INR (approx 23.23 Lakh)
    expect(totalInvested).toBe(1200000);
    expect(totalValue).toBeGreaterThan(2320000);
    expect(totalValue).toBeLessThan(2330000);
    expect(totalValue).toBe(2323391);
    expect(estimatedReturns).toBe(1123391);
  });

  it('handles 0% return edge case correctly (simple principal sum)', () => {
    const totalValue = calculateSipFutureValue(5000, 0, 5);
    expect(totalValue).toBe(5000 * 60);
  });

  it('calculates 1-year short term SIP correctly', () => {
    const totalValue = calculateSipFutureValue(10000, 12, 1);
    expect(totalValue).toBe(128093); // Invested 1,20,000, gain ~8,093
  });

  it('calculates Step-Up SIP correctly', () => {
    const initial = 10000;
    const totalValue = calculateStepUpSipFutureValue(initial, 12, 10, 10);
    // Step up increases total accumulation beyond flat SIP (23.23L)
    expect(totalValue).toBeGreaterThan(2323391);
    expect(totalValue).toBeGreaterThan(3300000);
  });
});
