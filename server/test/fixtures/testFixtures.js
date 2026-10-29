/**
 * Test fixtures for unit and integration testing
 */

// Profile fixture for risk scoring and financial health
export const conservativeProfile = {
  age: 55,
  monthlyIncome: 100000,
  monthlyExpenses: 40000,
  monthlyEMIs: 10000,
  monthlySavings: 50000,
  emergencyFundAmount: 600000, // 15 months of expenses
  hasLifeInsurance: true,
  hasHealthInsurance: true,
  dependentsCount: 1,
  investingExperience: 'beginner',
  horizonYears: 3,
  riskAnswers: [1, 1, 1, 1, 1], // Lowest risk answers
};

export const aggressiveProfile = {
  age: 26,
  monthlyIncome: 150000,
  monthlyExpenses: 50000,
  monthlyEMIs: 15000,
  monthlySavings: 85000,
  emergencyFundAmount: 400000, // 8 months of expenses
  hasLifeInsurance: true,
  hasHealthInsurance: true,
  dependentsCount: 0,
  investingExperience: 'advanced',
  horizonYears: 15,
  riskAnswers: [5, 5, 5, 5, 5], // Highest risk answers
};

// 70-day stock price fixture with realistic trend and volatility
export function generateStockFixture() {
  const candles = [];
  let price = 1000;
  const baseDate = new Date('2025-01-01T09:15:00Z');

  for (let i = 0; i < 70; i++) {
    const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    // Upward trend with oscillations
    const change = Math.sin(i / 5) * 15 + (i > 30 ? 4 : 1);
    const open = price;
    const close = Math.max(500, price + change);
    const high = Math.max(open, close) + 8;
    const low = Math.min(open, close) - 8;
    const volume = 500000 + Math.floor(Math.sin(i) * 200000);

    candles.push({
      date: d.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

// 5-year NAV fixture for mutual fund metric calculation
export function generateNavFixture() {
  const navHistory = [];
  let nav = 100; // Start at 100
  const startDate = new Date('2020-01-01T00:00:00Z');
  // 5 years ~ 1250 trading days
  // End at ~ 200 (approx 14.87% CAGR over 5 years)
  for (let i = 0; i < 1260; i++) {
    const d = new Date(startDate.getTime() + i * (5 * 365.25 * 24 * 3600 * 1000 / 1260));
    // Create a dip at i = 400 for drawdown testing
    let dailyReturn = 0.0006;
    if (i >= 300 && i <= 350) {
      dailyReturn = -0.005; // 25% drop over 50 days
    } else if (i > 350 && i <= 450) {
      dailyReturn = 0.0035; // Recovery
    }

    nav = nav * (1 + dailyReturn);

    navHistory.push({
      date: d.toISOString().split('T')[0],
      nav: Math.round(nav * 100) / 100,
    });
  }

  return navHistory;
}
