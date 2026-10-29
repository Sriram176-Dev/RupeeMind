import type { UserProfile, RiskBand, HealthBand } from '../types';

export function calculateRiskScore(profile: Partial<UserProfile>): { score: number; band: RiskBand; breakdown: Record<string, number> } {
  // 1. Quiz score (0-100)
  const quiz = profile.quizScores && profile.quizScores.length > 0
    ? profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length
    : 3;
  const quizNormalized = Math.max(0, Math.min(100, ((quiz - 1) / 4) * 100));

  // 2. Horizon score
  const horizon = profile.horizonYears ?? 5;
  let horizonScore = 55;
  if (horizon < 1) horizonScore = 10;
  else if (horizon <= 3) horizonScore = 30;
  else if (horizon <= 5) horizonScore = 55;
  else if (horizon <= 10) horizonScore = 80;
  else horizonScore = 100;

  // 3. Age score
  const age = profile.age ?? 30;
  let ageScore = 85;
  if (age <= 25) ageScore = 100;
  else if (age <= 35) ageScore = 85;
  else if (age <= 45) ageScore = 65;
  else if (age <= 55) ageScore = 40;
  else ageScore = 20;

  // 4. Income stability
  const occ = profile.occupation ?? 'Private';
  let incomeStabilityScore = 75;
  switch (occ) {
    case 'Government': incomeStabilityScore = 100; break;
    case 'Private': incomeStabilityScore = 75; break;
    case 'Business': incomeStabilityScore = 55; break;
    case 'Freelance': incomeStabilityScore = 45; break;
    case 'Student': incomeStabilityScore = 35; break;
    default: incomeStabilityScore = 20; break;
  }

  // 5. Dependents
  const deps = profile.dependentsCount ?? 0;
  let dependentsScore = 100;
  if (deps === 0) dependentsScore = 100;
  else if (deps === 1) dependentsScore = 75;
  else if (deps === 2) dependentsScore = 50;
  else dependentsScore = 30;

  // 6. Experience
  const exp = profile.investingExperience ?? 'Beginner';
  let experienceScore = 50;
  switch (exp) {
    case 'None': experienceScore = 20; break;
    case 'Beginner': experienceScore = 50; break;
    case 'Intermediate': experienceScore = 75; break;
    case 'Experienced': experienceScore = 100; break;
  }

  const rawScore = (
    0.35 * quizNormalized +
    0.20 * horizonScore +
    0.15 * ageScore +
    0.10 * incomeStabilityScore +
    0.10 * dependentsScore +
    0.10 * experienceScore
  );

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let band: RiskBand = 'Moderate';
  if (score <= 30) band = 'Conservative';
  else if (score <= 50) band = 'Moderately Conservative';
  else if (score <= 70) band = 'Moderate';
  else if (score <= 85) band = 'Moderately Aggressive';
  else band = 'Aggressive';

  return {
    score,
    band,
    breakdown: {
      quizNormalized,
      horizonScore,
      ageScore,
      incomeStabilityScore,
      dependentsScore,
      experienceScore,
    },
  };
}

export function calculateFinancialHealthScore(profile: Partial<UserProfile>): { score: number; band: HealthBand; tips: string[]; breakdown: Record<string, number> } {
  const income = profile.monthlyIncome && profile.monthlyIncome > 0 ? profile.monthlyIncome : 50000;
  const expenses = profile.monthlyExpenses && profile.monthlyExpenses > 0 ? profile.monthlyExpenses : 30000;
  const emis = profile.monthlyEMIs ?? 0;
  const savings = profile.monthlySavings ?? Math.max(0, income - expenses - emis);
  const emergencyFund = profile.emergencyFundAmount ?? 0;

  // 1. Savings rate (savings / income)
  const savingsRateVal = savings / income;
  let savingsRateScore = 55;
  if (savingsRateVal >= 0.30) savingsRateScore = 100;
  else if (savingsRateVal >= 0.20) savingsRateScore = 80;
  else if (savingsRateVal >= 0.10) savingsRateScore = 55;
  else if (savingsRateVal >= 0.05) savingsRateScore = 30;
  else savingsRateScore = 10;

  // 2. Emergency fund in months (emergencyFund / expenses)
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  let emergencyScore = 40;
  if (emergencyMonths >= 6) emergencyScore = 100;
  else if (emergencyMonths >= 3) emergencyScore = 70;
  else if (emergencyMonths >= 1) emergencyScore = 40;
  else emergencyScore = 10;

  // 3. EMI ratio (emis / income)
  const emiRatioVal = emis / income;
  let emiScore = 100;
  if (emiRatioVal <= 0.20) emiScore = 100;
  else if (emiRatioVal <= 0.35) emiScore = 70;
  else if (emiRatioVal <= 0.50) emiScore = 40;
  else emiScore = 10;

  // 4. Insurance
  const hasLife = !!profile.hasLifeInsurance;
  const hasHealth = !!profile.hasHealthInsurance;
  let insuranceScore = 0;
  if (hasLife && hasHealth) insuranceScore = 100;
  else if (hasLife || hasHealth) insuranceScore = 50;
  else insuranceScore = 0;

  // 5. Investing habit score (Regularly: 100, Occasionally: 50, Not yet: 0)
  const habit = (profile as any).investingHabit || profile.investingRegularity || 'Occasionally';
  let habitScore = 50;
  if (habit === 'Regularly') habitScore = 100;
  else if (habit === 'Occasionally') habitScore = 50;
  else if (habit === 'Not yet') habitScore = 0;

  const rawScore = (
    0.30 * savingsRateScore +
    0.25 * emergencyScore +
    0.25 * emiScore +
    0.10 * insuranceScore +
    0.10 * habitScore
  );

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let band: HealthBand = 'Stable';
  if (score <= 40) band = 'Needs attention';
  else if (score <= 70) band = 'Stable';
  else band = 'Strong';

  // Actionable tips
  const tips: string[] = [];
  if (emergencyMonths < 6) {
    tips.push(`Build your emergency fund to 6 months of living expenses (₹${(expenses * 6).toLocaleString('en-IN')}). Currently at ${emergencyMonths.toFixed(1)} months.`);
  }
  if (!hasHealth) {
    tips.push('Secure a standalone comprehensive health insurance plan to protect your savings from medical emergencies.');
  }
  if (!hasLife && (profile.dependentsCount ?? 0) > 0) {
    tips.push('Get a pure term life insurance cover equivalent to 10-15x your annual income for dependent security.');
  }
  if (emiRatioVal > 0.35) {
    tips.push(`Your debt obligations (${(emiRatioVal * 100).toFixed(0)}% of income) are elevated. Prioritize pre-paying high-cost loans.`);
  }
  if (savingsRateVal < 0.20) {
    tips.push('Aim to boost your automated monthly savings rate to at least 20-30% by tracking discretionary spending.');
  }
  if (tips.length === 0) {
    tips.push('Great discipline! Consider stepping up your monthly SIP by 10% annually to beat inflation seamlessly.');
    tips.push('Review your asset allocation quarterly to maintain your target risk posture.');
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
