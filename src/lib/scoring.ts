import type {
  UserProfile,
  RiskBand,
  HealthBand,
  CapacityBand,
  FinancialGoalItem,
  GoalsAssessmentSummary,
} from '../types';

export interface RiskToleranceResult {
  score: number;
  band: RiskBand;
  breakdown: {
    quizAverage: number;
    quizNormalized: number;
    answersCount: number;
  };
  narrative: string;
}

export interface RiskCapacityResult {
  score: number;
  band: CapacityBand;
  breakdown: {
    emergencyFundScore: number;
    debtBurdenScore: number;
    savingsRateScore: number;
    insuranceScore: number;
    runwayScore: number;
    emergencyMonths: number;
    debtToIncomeRatio: number;
    savingsRatePercent: number;
  };
  limitingFactors: string[];
}

export interface EffectiveRiskResult {
  effectiveScore: number;
  effectiveBand: RiskBand;
  isConstrained: boolean;
  constraintReason: string;
  tolerance: RiskToleranceResult;
  capacity: RiskCapacityResult;
}

export interface ExplainableAllocation {
  equity: number;
  debt: number;
  gold: number;
  primaryDrivers: string[];
  constraintsApplied: string[];
  protectionDirectives: string[];
}

// ============================================================================
// 1. RISK TOLERANCE (PSYCHOLOGICAL & BEHAVIORAL WILLINGNESS)
// ============================================================================
export function calculateRiskTolerance(profile: Partial<UserProfile>): RiskToleranceResult {
  const scores = profile.quizScores && profile.quizScores.length > 0 ? profile.quizScores : [3, 3, 3, 3, 3];
  const validScores = scores.filter((s) => typeof s === 'number' && s >= 1 && s <= 5);
  const quizAverage = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : 3;

  // Normalized to 0 - 100 scale (1 -> 0, 5 -> 100)
  const quizNormalized = Math.round(Math.max(0, Math.min(100, ((quizAverage - 1) / 4) * 100)));

  let band: RiskBand = 'Moderate';
  let narrative = 'Balanced approach between capital preservation and steady market growth.';

  if (quizNormalized <= 25) {
    band = 'Conservative';
    narrative = 'Strong psychological preference for capital safety with minimal tolerance for portfolio drawdowns.';
  } else if (quizNormalized <= 45) {
    band = 'Moderately Conservative';
    narrative = 'Prefers predictable returns with limited exposure to equity market swings.';
  } else if (quizNormalized <= 65) {
    band = 'Moderate';
    narrative = 'Comfortable with standard market volatility in exchange for inflation-beating long-term growth.';
  } else if (quizNormalized <= 85) {
    band = 'Moderately Aggressive';
    narrative = 'High willingness to accept interim 15-20% corrections to capture higher long-term compounding.';
  } else {
    band = 'Aggressive';
    narrative = 'Opportunistic investor willing to endure severe market volatility for maximum capital appreciation.';
  }

  return {
    score: quizNormalized,
    band,
    breakdown: {
      quizAverage: Number(quizAverage.toFixed(2)),
      quizNormalized,
      answersCount: validScores.length,
    },
    narrative,
  };
}

// ============================================================================
// 2. RISK CAPACITY (BALANCE SHEET ABILITY TO ABSORB LOSS)
// ============================================================================
export function calculateRiskCapacity(profile: Partial<UserProfile>): RiskCapacityResult {
  const income = profile.monthlyIncome && profile.monthlyIncome > 0 ? profile.monthlyIncome : 50000;
  const expenses = profile.monthlyExpenses && profile.monthlyExpenses > 0 ? profile.monthlyExpenses : 30000;
  const emis = profile.monthlyEMIs ?? 0;
  const surplus = Math.max(0, income - expenses - emis);
  const emergencyFund = profile.emergencyFundAmount ?? 0;

  const limitingFactors: string[] = [];

  // A. Emergency Fund Cushion (Months of living expenses)
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  let emergencyFundScore = 15;
  if (emergencyMonths >= 6) {
    emergencyFundScore = 100;
  } else if (emergencyMonths >= 3) {
    emergencyFundScore = 75;
    limitingFactors.push(`Emergency cushion is ${emergencyMonths.toFixed(1)} months (ideal: 6+ months).`);
  } else if (emergencyMonths >= 1) {
    emergencyFundScore = 40;
    limitingFactors.push(`Low emergency reserve of only ${emergencyMonths.toFixed(1)} months leaves you vulnerable to forced selling.`);
  } else {
    emergencyFundScore = 10;
    limitingFactors.push(`Critically low emergency reserve (< 1 month of living expenses).`);
  }

  // B. Debt Burden / Fixed Commitments (EMI-to-Income)
  const debtToIncomeRatio = emis / income;
  let debtBurdenScore = 100;
  if (debtToIncomeRatio <= 0.20) {
    debtBurdenScore = 100;
  } else if (debtToIncomeRatio <= 0.35) {
    debtBurdenScore = 75;
  } else if (debtToIncomeRatio <= 0.50) {
    debtBurdenScore = 40;
    limitingFactors.push(`Fixed loan EMIs consume ${(debtToIncomeRatio * 100).toFixed(0)}% of your monthly income.`);
  } else {
    debtBurdenScore = 15;
    limitingFactors.push(`High debt burden: EMIs exceed 50% of monthly income, constraining investment risk.`);
  }

  // C. Net Savings Rate
  const savingsRatePercent = (surplus / income) * 100;
  let savingsRateScore = 20;
  if (savingsRatePercent >= 35) {
    savingsRateScore = 100;
  } else if (savingsRatePercent >= 20) {
    savingsRateScore = 80;
  } else if (savingsRatePercent >= 10) {
    savingsRateScore = 55;
  } else if (savingsRatePercent >= 5) {
    savingsRateScore = 30;
    limitingFactors.push(`Narrow monthly surplus (${savingsRatePercent.toFixed(0)}% savings rate).`);
  } else {
    savingsRateScore = 10;
    limitingFactors.push(`Minimal investible cash flow surplus.`);
  }

  // D. Insurance Shield & Dependents
  const dependents = profile.dependentsCount ?? 0;
  const hasLife = !!profile.hasLifeInsurance;
  const hasHealth = !!profile.hasHealthInsurance;
  let insuranceScore = 50;

  if (dependents > 0) {
    if (hasLife && hasHealth) {
      insuranceScore = 100;
    } else if (hasHealth && !hasLife) {
      insuranceScore = 45;
      limitingFactors.push(`${dependents} dependent(s) without term life insurance creates high balance sheet vulnerability.`);
    } else if (hasLife && !hasHealth) {
      insuranceScore = 50;
      limitingFactors.push(`Missing health insurance risks liquidating investments for medical shocks.`);
    } else {
      insuranceScore = 15;
      limitingFactors.push(`Severe protection gap: Dependents present with neither health nor term life insurance.`);
    }
  } else {
    if (hasHealth) {
      insuranceScore = 100;
    } else {
      insuranceScore = 40;
      limitingFactors.push(`No health insurance exposes liquid investments to sudden medical bills.`);
    }
  }

  // E. Career Runway & Sector Stability
  const age = profile.age ?? 30;
  let runwayScore = 80;
  if (age <= 30) runwayScore = 100;
  else if (age <= 40) runwayScore = 85;
  else if (age <= 50) runwayScore = 65;
  else if (age <= 60) runwayScore = 45;
  else runwayScore = 25;

  const occ = profile.occupation ?? 'Private';
  if (occ === 'Government') runwayScore = Math.min(100, runwayScore + 10);
  else if (occ === 'Freelance' || occ === 'Student') runwayScore = Math.max(20, runwayScore - 15);

  // Composite Risk Capacity Score (0 - 100)
  const compositeScore = Math.round(
    0.25 * emergencyFundScore +
    0.25 * debtBurdenScore +
    0.20 * savingsRateScore +
    0.15 * insuranceScore +
    0.15 * runwayScore
  );

  let band: CapacityBand = 'Moderate';
  if (compositeScore < 45) {
    band = 'Low';
  } else if (compositeScore <= 75) {
    band = 'Moderate';
  } else {
    band = 'High';
  }

  return {
    score: compositeScore,
    band,
    breakdown: {
      emergencyFundScore,
      debtBurdenScore,
      savingsRateScore,
      insuranceScore,
      runwayScore,
      emergencyMonths: Number(emergencyMonths.toFixed(1)),
      debtToIncomeRatio: Number(debtToIncomeRatio.toFixed(2)),
      savingsRatePercent: Number(savingsRatePercent.toFixed(1)),
    },
    limitingFactors,
  };
}

// ============================================================================
// 3. SYNTHESIS ENGINE (FIDUCIARY RISK CONSTRAINT)
// ============================================================================
export function synthesizeEffectiveRisk(
  tolerance: RiskToleranceResult,
  capacity: RiskCapacityResult,
  profile: Partial<UserProfile>
): EffectiveRiskResult {
  const toleranceBand = tolerance.band;
  const capacityBand = capacity.band;

  let effectiveBand: RiskBand = toleranceBand;
  let isConstrained = false;
  let constraintReason = 'Your psychological risk tolerance and structural balance sheet capacity are harmoniously aligned.';

  // Strict Fiduciary Constraint Matrix:
  // Risk Capacity is an absolute ceiling. An investor CANNOT take on more risk than their balance sheet permits.
  if (capacityBand === 'Low') {
    if (toleranceBand === 'Aggressive' || toleranceBand === 'Moderately Aggressive') {
      effectiveBand = 'Moderately Conservative';
      isConstrained = true;
      constraintReason = `Constrained by Low Risk Capacity: While your behavioral tolerance is ${toleranceBand}, your financial capacity is constrained by ${
        capacity.limitingFactors[0] || 'low liquidity reserves and debt commitments'
      }. To prevent forced capital loss during emergencies, your equity exposure is strictly capped.`;
    } else if (toleranceBand === 'Moderate') {
      effectiveBand = 'Moderately Conservative';
      isConstrained = true;
      constraintReason = `Constrained by Low Risk Capacity: Your portfolio is tilted toward capital preservation because your liquidity cushion (${capacity.breakdown.emergencyMonths} months) requires rebuilding before taking market drawdown risk.`;
    } else {
      effectiveBand = 'Conservative';
      constraintReason = 'Conservative alignment: Low financial capacity matches your preference for steady capital preservation.';
    }
  } else if (capacityBand === 'Moderate') {
    if (toleranceBand === 'Aggressive') {
      effectiveBand = 'Moderately Aggressive';
      isConstrained = true;
      constraintReason = 'Fiduciary Moderation: While your behavioral appetite is Aggressive, your moderate emergency cushion and debt load cap pure equity exposure to maintain financial resilience.';
    }
  } else {
    // High Capacity
    if (toleranceBand === 'Conservative' || toleranceBand === 'Moderately Conservative') {
      effectiveBand = toleranceBand; // Respect investor comfort! Never force equity volatility on an anxious investor.
      constraintReason = `Psychological Priority: Your financial capacity is High, but we strictly respect your ${toleranceBand} comfort level to prevent panic selling during volatile market cycles.`;
    }
  }

  // Calculate synthetic score aligned with the effective band
  let bandBaseScore = 55;
  switch (effectiveBand) {
    case 'Conservative': bandBaseScore = 20; break;
    case 'Moderately Conservative': bandBaseScore = 40; break;
    case 'Moderate': bandBaseScore = 60; break;
    case 'Moderately Aggressive': bandBaseScore = 78; break;
    case 'Aggressive': bandBaseScore = 92; break;
  }

  const effectiveScore = isConstrained
    ? Math.round(bandBaseScore * 0.7 + capacity.score * 0.3)
    : Math.round(tolerance.score * 0.6 + capacity.score * 0.4);

  return {
    effectiveScore,
    effectiveBand,
    isConstrained,
    constraintReason,
    tolerance,
    capacity,
  };
}

// ============================================================================
// 4. INDIVIDUAL GOAL ASSESSMENT ENGINE
// ============================================================================
export function assessIndividualGoals(
  goals: FinancialGoalItem[],
  monthlySurplus: number
): GoalsAssessmentSummary {
  if (!goals || goals.length === 0) {
    return {
      totalMonthlySIPRequired: 0,
      investibleSurplus: monthlySurplus,
      surplusGap: monthlySurplus,
      isFullyFundable: true,
      goals: [],
    };
  }

  // Priority ranking: Critical > Important > Flexible
  const priorityOrder: Record<string, number> = {
    Critical: 1,
    Important: 2,
    Flexible: 3,
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 2;
    const pB = priorityOrder[b.priority] || 2;
    if (pA !== pB) return pA - pB;
    return a.horizonYears - b.horizonYears;
  });

  let cumulativeSIP = 0;
  const assessedGoals: FinancialGoalItem[] = [];

  for (const goal of sortedGoals) {
    const horizonYears = Math.max(1, goal.horizonYears || 5);
    const months = horizonYears * 12;
    const targetAmount = Math.max(10000, goal.targetAmount || 500000);

    // Expected annual return based on time horizon
    let expectedAnnualReturn = 0.10;
    let recommendedAllocation = { equity: 50, debt: 40, gold: 10 };

    if (horizonYears <= 2) {
      // Capital preservation (Ultra short / Arbitrage / Liquid)
      expectedAnnualReturn = 0.065;
      recommendedAllocation = { equity: 0, debt: 90, gold: 10 };
    } else if (horizonYears <= 4) {
      // Conservative hybrid / Short duration
      expectedAnnualReturn = 0.085;
      recommendedAllocation = { equity: 30, debt: 60, gold: 10 };
    } else if (horizonYears <= 7) {
      // Multi-Asset / Balanced Advantage
      expectedAnnualReturn = 0.11;
      recommendedAllocation = { equity: 60, debt: 30, gold: 10 };
    } else {
      // Aggressive Long-Term Compounding
      expectedAnnualReturn = 0.13;
      recommendedAllocation = { equity: 75, debt: 15, gold: 10 };
    }

    // Solve for monthly PMT: FV = PMT * [((1 + i)^n - 1) / i]
    const monthlyRate = expectedAnnualReturn / 12;
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    const requiredSIP = Math.round(targetAmount / factor);

    cumulativeSIP += requiredSIP;
    const feasible = cumulativeSIP <= monthlySurplus;
    const deficitAmount = feasible ? 0 : Math.max(0, cumulativeSIP - monthlySurplus);

    assessedGoals.push({
      ...goal,
      requiredMonthlySIP: requiredSIP,
      feasible,
      recommendedAllocation,
      deficitAmount,
    });
  }

  const surplusGap = monthlySurplus - cumulativeSIP;

  return {
    totalMonthlySIPRequired: cumulativeSIP,
    investibleSurplus: monthlySurplus,
    surplusGap,
    isFullyFundable: surplusGap >= 0,
    goals: assessedGoals,
  };
}

// ============================================================================
// 5. EXPLAINABLE ASSET ALLOCATION ENGINE
// ============================================================================
export function generateExplainableAssetAllocation(
  effectiveRisk: EffectiveRiskResult,
  goalsSummary: GoalsAssessmentSummary,
  profile: Partial<UserProfile>
): ExplainableAllocation {
  const primaryDrivers: string[] = [];
  const constraintsApplied: string[] = [];
  const protectionDirectives: string[] = [];

  // Base allocation from Effective Risk Band
  let equity = 50;
  let debt = 40;
  let gold = 10;

  switch (effectiveRisk.effectiveBand) {
    case 'Conservative':
      equity = 20;
      debt = 70;
      gold = 10;
      primaryDrivers.push('Allocated 70% to Fixed Income/Arbitrage for capital protection and near-zero volatility.');
      break;
    case 'Moderately Conservative':
      equity = 35;
      debt = 55;
      gold = 10;
      primaryDrivers.push('Allocated 35% to large-cap equities for inflation hedging with 55% debt anchor.');
      break;
    case 'Moderate':
      equity = 55;
      debt = 35;
      gold = 10;
      primaryDrivers.push('Balanced 55/35 equity-debt structure to capture growth while dampening cyclical market drawdowns.');
      break;
    case 'Moderately Aggressive':
      equity = 70;
      debt = 20;
      gold = 10;
      primaryDrivers.push('Growth-oriented 70% equity allocation across large, flexi, and mid-cap sectors.');
      break;
    case 'Aggressive':
      equity = 80;
      debt = 12;
      gold = 8;
      primaryDrivers.push('Maximized 80% equity compounding across multi-cap leaders and mid/small-cap alpha generators.');
      break;
  }

  // Apply Real Financial Constraints:
  // Constraint 1: Emergency Reserve Liquidity Gate
  if (effectiveRisk.capacity.breakdown.emergencyMonths < 3) {
    const shift = 10;
    equity = Math.max(15, equity - shift);
    debt += shift;
    constraintsApplied.push(
      `Emergency Reserve Gate: Equity allocation reduced by ${shift}% to prioritize liquid debt/savings until 3+ months of emergency runway is secured.`
    );
  }

  // Constraint 2: Debt-to-Income Overburden Gate
  if (effectiveRisk.capacity.breakdown.debtToIncomeRatio > 0.40) {
    const shift = 10;
    equity = Math.max(15, equity - shift);
    debt += shift;
    constraintsApplied.push(
      `High Debt Service Gate: With loan EMIs at ${(effectiveRisk.capacity.breakdown.debtToIncomeRatio * 100).toFixed(0)}% of income, equity exposure is derisked to protect liquidity.`
    );
  }

  // Constraint 3: Short-Term Priority Goal Horizon Gate
  const hasShortTermCriticalGoal = goalsSummary.goals.some(
    (g) => g.priority === 'Critical' && g.horizonYears <= 3
  );
  if (hasShortTermCriticalGoal) {
    const shift = 10;
    equity = Math.max(15, equity - shift);
    debt += shift;
    constraintsApplied.push(
      'Short-Term Capital Preservation Gate: Increased debt allocation to lock in funds for near-term critical milestones (< 3 years).'
    );
  }

  // Protection Directives:
  if (!profile.hasHealthInsurance) {
    protectionDirectives.push('Urgent: Procure a comprehensive standalone health cover to prevent medical emergencies from depleting investment capital.');
  }
  if (!profile.hasLifeInsurance && (profile.dependentsCount ?? 0) > 0) {
    protectionDirectives.push(`Critical: With ${profile.dependentsCount} dependent(s), obtain a pure term life insurance policy covering 10-15x annual income.`);
  }
  if (!goalsSummary.isFullyFundable) {
    protectionDirectives.push(
      `Goal Deficit: Required monthly SIP (₹${goalsSummary.totalMonthlySIPRequired.toLocaleString('en-IN')}) exceeds available investible surplus by ₹${Math.abs(goalsSummary.surplusGap).toLocaleString('en-IN')}. Focus on Critical goals first.`
    );
  }

  // Normalize percentages to exactly 100%
  const total = equity + debt + gold;
  equity = Math.round((equity / total) * 100);
  debt = Math.round((debt / total) * 100);
  gold = 100 - (equity + debt);

  return {
    equity,
    debt,
    gold,
    primaryDrivers,
    constraintsApplied,
    protectionDirectives,
  };
}

// ============================================================================
// 6. OVERALL FINANCIAL HEALTH SCORE
// ============================================================================
export function calculateFinancialHealthScore(profile: Partial<UserProfile>): {
  score: number;
  band: HealthBand;
  tips: string[];
  breakdown: Record<string, number>;
} {
  const income = profile.monthlyIncome && profile.monthlyIncome > 0 ? profile.monthlyIncome : 50000;
  const expenses = profile.monthlyExpenses && profile.monthlyExpenses > 0 ? profile.monthlyExpenses : 30000;
  const emis = profile.monthlyEMIs ?? 0;
  const savings = Math.max(0, income - expenses - emis);
  const emergencyFund = profile.emergencyFundAmount ?? 0;

  // 1. Savings rate
  const savingsRateVal = savings / income;
  let savingsRateScore = 55;
  if (savingsRateVal >= 0.35) savingsRateScore = 100;
  else if (savingsRateVal >= 0.20) savingsRateScore = 80;
  else if (savingsRateVal >= 0.10) savingsRateScore = 55;
  else if (savingsRateVal >= 0.05) savingsRateScore = 30;
  else savingsRateScore = 10;

  // 2. Emergency fund in months
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  let emergencyScore = 40;
  if (emergencyMonths >= 6) emergencyScore = 100;
  else if (emergencyMonths >= 3) emergencyScore = 75;
  else if (emergencyMonths >= 1) emergencyScore = 40;
  else emergencyScore = 10;

  // 3. EMI ratio
  const emiRatioVal = emis / income;
  let emiScore = 100;
  if (emiRatioVal <= 0.20) emiScore = 100;
  else if (emiRatioVal <= 0.35) emiScore = 75;
  else if (emiRatioVal <= 0.50) emiScore = 40;
  else emiScore = 10;

  // 4. Insurance
  const hasLife = !!profile.hasLifeInsurance;
  const hasHealth = !!profile.hasHealthInsurance;
  const deps = profile.dependentsCount ?? 0;
  let insuranceScore = 0;
  if (deps > 0) {
    if (hasLife && hasHealth) insuranceScore = 100;
    else if (hasHealth || hasLife) insuranceScore = 45;
    else insuranceScore = 15;
  } else {
    if (hasHealth) insuranceScore = 100;
    else insuranceScore = 35;
  }

  // 5. Investing habit
  const habit = profile.investingRegularity || 'Occasionally';
  let habitScore = 50;
  if (habit === 'Regularly') habitScore = 100;
  else if (habit === 'Occasionally') habitScore = 50;
  else habitScore = 15;

  const rawScore =
    0.30 * savingsRateScore +
    0.25 * emergencyScore +
    0.25 * emiScore +
    0.10 * insuranceScore +
    0.10 * habitScore;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let band: HealthBand = 'Stable';
  if (score <= 45) band = 'Needs attention';
  else if (score <= 75) band = 'Stable';
  else band = 'Strong';

  const tips: string[] = [];
  if (emergencyMonths < 6) {
    tips.push(`Strengthen your liquid emergency reserve to ₹${(expenses * 6).toLocaleString('en-IN')} (6 months of living costs). Currently at ${emergencyMonths.toFixed(1)} months.`);
  }
  if (!hasHealth) {
    tips.push('Procure a comprehensive personal/family floater health insurance plan to shield wealth from medical inflation.');
  }
  if (!hasLife && deps > 0) {
    tips.push(`Ensure dependent financial security with a pure term life insurance cover of ₹${(income * 12 * 12).toLocaleString('en-IN')} (10-15x annual salary).`);
  }
  if (emiRatioVal > 0.35) {
    tips.push(`Debt-to-income is elevated at ${(emiRatioVal * 100).toFixed(0)}%. Prioritize prepaying high-interest personal loans or credit debt.`);
  }
  if (savingsRateVal < 0.20) {
    tips.push('Target an automated 20%+ monthly savings rate by auditing discretionary and recurring subscription spending.');
  }
  if (tips.length === 0) {
    tips.push('Outstanding financial discipline! Consider setting up an annual 10% SIP step-up to accelerate wealth compounding.');
    tips.push('Rebalance your asset allocation semi-annually to stay aligned with your target risk profile.');
  }

  return {
    score,
    band,
    tips: tips.slice(0, 3),
    breakdown: {
      savingsRateScore,
      emergencyScore,
      emiScore,
      insuranceScore,
      habitScore,
    },
  };
}

// ============================================================================
// 7. BACKWARDS-COMPATIBLE WRAPPER
// ============================================================================
export function calculateRiskScore(profile: Partial<UserProfile>): {
  score: number;
  band: RiskBand;
  breakdown: Record<string, number>;
  tolerance: RiskToleranceResult;
  capacity: RiskCapacityResult;
  effective: EffectiveRiskResult;
} {
  const tolerance = calculateRiskTolerance(profile);
  const capacity = calculateRiskCapacity(profile);
  const effective = synthesizeEffectiveRisk(tolerance, capacity, profile);

  return {
    score: effective.effectiveScore,
    band: effective.effectiveBand,
    breakdown: {
      toleranceScore: tolerance.score,
      capacityScore: capacity.score,
      effectiveScore: effective.effectiveScore,
      quizNormalized: tolerance.breakdown.quizNormalized,
      emergencyFundScore: capacity.breakdown.emergencyFundScore,
      debtBurdenScore: capacity.breakdown.debtBurdenScore,
      savingsRateScore: capacity.breakdown.savingsRateScore,
      insuranceScore: capacity.breakdown.insuranceScore,
    },
    tolerance,
    capacity,
    effective,
  };
}
