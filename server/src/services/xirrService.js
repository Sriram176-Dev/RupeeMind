/**
 * XIRR (Extended Internal Rate of Return) Calculator
 * Implements Newton-Raphson method with Bisection fallback
 */

/**
 * Calculate XIRR from a series of cash flows.
 * @param {Array<{ amount: number, date: Date | string }>} cashFlows
 * @param {number} [guess=0.1] Initial guess (10% = 0.10)
 * @returns {number|null} Annualized rate as percentage (e.g., 14.85 for 14.85%), or null if unsolvable
 */
export function calculateXIRR(cashFlows, guess = 0.1) {
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

  // Net Present Value function
  const npv = (rate) => {
    if (rate <= -1) return Infinity;
    return flows.reduce((sum, f) => sum + f.c * Math.pow(1 + rate, -f.t), 0);
  };

  // Derivative of NPV with respect to rate
  const dNpv = (rate) => {
    if (rate <= -1) return Infinity;
    return flows.reduce((sum, f) => {
      if (f.t === 0) return sum;
      return sum - f.t * f.c * Math.pow(1 + rate, -f.t - 1);
    }, 0);
  };

  // 1. Try Newton-Raphson
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
      break; // Derivative too small, switch to bisection
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

  // If bounds don't bracket the root, expand or return approximate
  if (fLow * fHigh > 0) {
    // Try wider range
    high = 50.0;
    fHigh = npv(high);
    if (fLow * fHigh > 0) {
      // Total return fallback if duration is very short
      const totalInvested = parsed.filter((c) => c.amount < 0).reduce((s, c) => s + Math.abs(c.amount), 0);
      const finalVal = parsed.filter((c) => c.amount > 0).reduce((s, c) => s + c.amount, 0);
      const totalYears = flows[flows.length - 1].t;
      if (totalInvested > 0 && totalYears > 0.08) { // > 1 month
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
