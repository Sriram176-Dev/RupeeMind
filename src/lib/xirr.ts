/**
 * XIRR (Extended Internal Rate of Return), CAGR, and Absolute Return Utilities
 * Newton-Raphson with Bisection fallback for robust financial calculations.
 */

export interface CashFlow {
  amount: number; // Negative for investment/outflow, positive for redemption/current value
  date: Date | string;
}

/**
 * Calculates XIRR from a series of cash flows.
 * @param cashFlows Array of { amount, date }
 * @param guess Initial rate guess (default 0.1 for 10%)
 * @returns Annualized percentage rate (e.g. 14.85 for 14.85%), or null if unsolvable
 */
export function calculateXIRR(cashFlows: CashFlow[], guess = 0.1): number | null {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) {
    return null;
  }

  // Parse and sort chronologically
  const parsed = cashFlows
    .map((cf) => ({
      amount: Number(cf.amount),
      date: cf.date instanceof Date ? cf.date : new Date(cf.date),
    }))
    .filter((cf) => !isNaN(cf.amount) && !isNaN(cf.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (parsed.length < 2) return null;

  const hasNegative = parsed.some((cf) => cf.amount < 0);
  const hasPositive = parsed.some((cf) => cf.amount > 0);
  if (!hasNegative || !hasPositive) return null;

  const d0 = parsed[0].date.getTime();
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

  const flows = parsed.map((cf) => ({
    c: cf.amount,
    t: (cf.date.getTime() - d0) / MS_PER_YEAR,
  }));

  // Net Present Value function: sum(C_i * (1 + r)^(-t_i))
  const npv = (rate: number): number => {
    if (rate <= -1) return Infinity;
    return flows.reduce((sum, f) => sum + f.c * Math.pow(1 + rate, -f.t), 0);
  };

  // Derivative of NPV with respect to rate
  const dNpv = (rate: number): number => {
    if (rate <= -1) return Infinity;
    return flows.reduce((sum, f) => {
      if (f.t === 0) return sum;
      return sum - f.t * f.c * Math.pow(1 + rate, -f.t - 1);
    }, 0);
  };

  // 1. Newton-Raphson iteration
  let rate = guess;
  const maxIterations = 60;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    if (rate <= -0.999) rate = -0.99;
    const f = npv(rate);
    const df = dNpv(rate);

    if (Math.abs(f) < tolerance) {
      return Number((rate * 100).toFixed(2));
    }

    if (Math.abs(df) < 1e-10) {
      break; // Derivative too small, fall through to bisection
    }

    const nextRate = rate - f / df;
    if (isNaN(nextRate) || !isFinite(nextRate)) {
      break; // Diverged, switch to bisection
    }

    if (Math.abs(nextRate - rate) < tolerance) {
      return Number((nextRate * 100).toFixed(2));
    }

    rate = nextRate;
  }

  // 2. Fallback: Bisection Method
  let low = -0.99;
  let high = 10.0; // 1000%
  let fLow = npv(low);
  let fHigh = npv(high);

  if (fLow * fHigh > 0) {
    high = 50.0;
    fHigh = npv(high);
    if (fLow * fHigh > 0) {
      // Approximate fallback via simple CAGR if duration > 1 month
      const totalInvested = parsed.filter((c) => c.amount < 0).reduce((s, c) => s + Math.abs(c.amount), 0);
      const finalVal = parsed.filter((c) => c.amount > 0).reduce((s, c) => s + c.amount, 0);
      const totalYears = flows[flows.length - 1].t;
      if (totalInvested > 0 && totalYears > 0.08) {
        const simpleCagr = (Math.pow(finalVal / totalInvested, 1 / totalYears) - 1) * 100;
        return isNaN(simpleCagr) ? null : Number(simpleCagr.toFixed(2));
      }
      return null;
    }
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);

    if (Math.abs(fMid) < tolerance || (high - low) / 2 < tolerance) {
      return Number((mid * 100).toFixed(2));
    }

    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return Number((((low + high) / 2) * 100).toFixed(2));
}

/**
 * Calculates Absolute Return (%) = ((Current Value - Total Invested) / Total Invested) * 100
 */
export function calculateAbsoluteReturn(invested: number, currentValue: number): number {
  if (invested <= 0) return 0;
  return Number((((currentValue - invested) / invested) * 100).toFixed(2));
}

/**
 * Calculates Compound Annual Growth Rate (CAGR) (%)
 * CAGR = ((Current Value / Total Invested) ^ (1 / years) - 1) * 100
 */
export function calculateCAGR(invested: number, currentValue: number, years: number): number | null {
  if (invested <= 0 || currentValue <= 0 || years <= 0) return null;
  const val = (Math.pow(currentValue / invested, 1 / years) - 1) * 100;
  return isNaN(val) ? null : Number(val.toFixed(2));
}
