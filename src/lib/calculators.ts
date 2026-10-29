import type { CalculationResult, CalculationYearBreakdown } from '../types';

export function calculateSIP(
  monthlyInvestment: number,
  expectedReturnRate: number, // in % (e.g. 12)
  durationYears: number
): CalculationResult {
  const i = expectedReturnRate / 12 / 100;
  const n = durationYears * 12;

  let totalValue = 0;
  if (i === 0) {
    totalValue = monthlyInvestment * n;
  } else {
    totalValue = monthlyInvestment * (((Math.pow(1 + i, n) - 1) / i)) * (1 + i);
  }

  const investedAmount = monthlyInvestment * n;
  const estimatedReturns = Math.max(0, totalValue - investedAmount);

  // Yearly Breakdown
  const breakdown: CalculationYearBreakdown[] = [];
  for (let year = 1; year <= durationYears; year++) {
    const months = year * 12;
    const yearInvested = monthlyInvestment * months;
    let yearTotal = 0;
    if (i === 0) {
      yearTotal = yearInvested;
    } else {
      yearTotal = monthlyInvestment * (((Math.pow(1 + i, months) - 1) / i)) * (1 + i);
    }
    breakdown.push({
      year,
      invested: Math.round(yearInvested),
      returns: Math.round(Math.max(0, yearTotal - yearInvested)),
      total: Math.round(yearTotal),
    });
  }

  return {
    investedAmount: Math.round(investedAmount),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
    breakdown,
  };
}

export function calculateStepUpSIP(
  initialMonthlyInvestment: number,
  annualStepUpPercent: number, // e.g. 10%
  expectedReturnRate: number, // in %
  durationYears: number
): CalculationResult {
  const monthlyRate = expectedReturnRate / 12 / 100;
  let totalInvested = 0;
  let currentMonthly = initialMonthlyInvestment;
  let accumulatedValue = 0;

  const breakdown: CalculationYearBreakdown[] = [];

  for (let y = 1; y <= durationYears; y++) {
    for (let m = 1; m <= 12; m++) {
      totalInvested += currentMonthly;
      accumulatedValue = (accumulatedValue + currentMonthly) * (1 + monthlyRate);
    }

    breakdown.push({
      year: y,
      invested: Math.round(totalInvested),
      returns: Math.round(Math.max(0, accumulatedValue - totalInvested)),
      total: Math.round(accumulatedValue),
    });

    // Step up for next year
    currentMonthly = currentMonthly * (1 + annualStepUpPercent / 100);
  }

  return {
    investedAmount: Math.round(totalInvested),
    estimatedReturns: Math.round(Math.max(0, accumulatedValue - totalInvested)),
    totalValue: Math.round(accumulatedValue),
    breakdown,
  };
}

export function calculateLumpsum(
  totalInvestment: number,
  expectedReturnRate: number, // in %
  durationYears: number
): CalculationResult {
  const r = expectedReturnRate / 100;
  const totalValue = totalInvestment * Math.pow(1 + r, durationYears);
  const estimatedReturns = Math.max(0, totalValue - totalInvestment);

  const breakdown: CalculationYearBreakdown[] = [];
  for (let year = 1; year <= durationYears; year++) {
    const yearTotal = totalInvestment * Math.pow(1 + r, year);
    breakdown.push({
      year,
      invested: Math.round(totalInvestment),
      returns: Math.round(Math.max(0, yearTotal - totalInvestment)),
      total: Math.round(yearTotal),
    });
  }

  return {
    investedAmount: Math.round(totalInvestment),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
    breakdown,
  };
}

export function calculateGoalPlanner(
  targetAmount: number,
  durationYears: number,
  expectedReturnRate: number // in %
): { requiredMonthlySIP: number; calculationResult: CalculationResult; futureCostWithInflation: number } {
  const i = expectedReturnRate / 12 / 100;
  const n = durationYears * 12;

  let requiredMonthlySIP = 0;
  if (i === 0) {
    requiredMonthlySIP = targetAmount / n;
  } else {
    requiredMonthlySIP = targetAmount / ((((Math.pow(1 + i, n) - 1) / i)) * (1 + i));
  }

  const roundedSIP = Math.ceil(requiredMonthlySIP / 100) * 100; // round to nearest 100
  const calculationResult = calculateSIP(roundedSIP, expectedReturnRate, durationYears);

  // Assuming typical 6% Indian inflation for goal value future projection
  const inflationRate = 0.06;
  const futureCostWithInflation = Math.round(targetAmount * Math.pow(1 + inflationRate, durationYears));

  return {
    requiredMonthlySIP: roundedSIP,
    calculationResult,
    futureCostWithInflation,
  };
}

export function calculateInflationAdjusted(
  monthlyInvestment: number,
  expectedReturnRate: number,
  inflationRate: number,
  durationYears: number
): { nominalResult: CalculationResult; realPurchasingPower: number; realReturnRate: number } {
  const nominalResult = calculateSIP(monthlyInvestment, expectedReturnRate, durationYears);
  
  // Fisher equation for real rate
  const rNominal = expectedReturnRate / 100;
  const rInflation = inflationRate / 100;
  const rReal = (1 + rNominal) / (1 + rInflation) - 1;
  const realReturnRatePercent = rReal * 100;

  // Real value = Nominal / (1 + inflation)^years
  const realPurchasingPower = Math.round(nominalResult.totalValue / Math.pow(1 + rInflation, durationYears));

  return {
    nominalResult,
    realPurchasingPower,
    realReturnRate: Number(realReturnRatePercent.toFixed(2)),
  };
}
