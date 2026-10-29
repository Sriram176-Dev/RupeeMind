/**
 * Ported exact scoring logic from frontend (src/lib/scoring.ts)
 */

export function calculateRiskScore(profile = {}) {
  const quizScores = profile.quizScores || profile.riskAnswers || [];
  const quiz = quizScores.length > 0
    ? quizScores.reduce((a, b) => Number(a) + Number(b), 0) / quizScores.length
    : 3;
  const quizNormalized = Math.max(0, Math.min(100, ((quiz - 1) / 4) * 100));

  const horizon = profile.horizonYears ?? (profile.goals?.[0]?.horizonYears ?? 5);
  let horizonScore = 55;
  if (horizon < 1) horizonScore = 10;
  else if (horizon <= 3) horizonScore = 30;
  else if (horizon <= 5) horizonScore = 55;
  else if (horizon <= 10) horizonScore = 80;
  else horizonScore = 100;

  const age = profile.age ?? 30;
  let ageScore = 85;
  if (age <= 25) ageScore = 100;
  else if (age <= 35) ageScore = 85;
  else if (age <= 45) ageScore = 65;
  else if (age <= 55) ageScore = 40;
  else ageScore = 20;

  const occ = profile.occupationType || profile.occupation || 'Private';
  let incomeStabilityScore = 75;
  switch (occ) {
    case 'Government': incomeStabilityScore = 100; break;
    case 'Private': incomeStabilityScore = 75; break;
    case 'Business': incomeStabilityScore = 55; break;
    case 'Freelance': incomeStabilityScore = 45; break;
    case 'Student': incomeStabilityScore = 35; break;
    default: incomeStabilityScore = 20; break;
  }

  const deps = profile.dependentsCount ?? (profile.dependents ?? 0);
  let dependentsScore = 100;
  if (deps === 0) dependentsScore = 100;
  else if (deps === 1) dependentsScore = 75;
  else if (deps === 2) dependentsScore = 50;
  else dependentsScore = 30;

  const exp = profile.investingExperience || profile.experienceLevel || 'Beginner';
  let experienceScore = 50;
  switch (exp) {
    case 'None': experienceScore = 20; break;
    case 'Beginner': experienceScore = 50; break;
    case 'Intermediate': experienceScore = 75; break;
    case 'Experienced': experienceScore = 100; break;
    default: experienceScore = 50; break;
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

  let band = 'Moderate';
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

export function calculateFinancialHealthScore(profile = {}) {
  const income = profile.monthlyIncome && profile.monthlyIncome > 0 ? Number(profile.monthlyIncome) : 50000;
  const expenses = profile.monthlyExpenses && profile.monthlyExpenses > 0 ? Number(profile.monthlyExpenses) : 30000;
  const emis = Number(profile.monthlyEMIs ?? (profile.monthlyEMI ?? 0));
  const savings = profile.monthlySavings !== undefined && profile.monthlySavings !== null
    ? Number(profile.monthlySavings)
    : Math.max(0, income - expenses - emis);
  const emergencyFund = Number(profile.emergencyFundAmount ?? 0);

  const savingsRateVal = savings / income;
  let savingsRateScore = 55;
  if (savingsRateVal >= 0.30) savingsRateScore = 100;
  else if (savingsRateVal >= 0.20) savingsRateScore = 80;
  else if (savingsRateVal >= 0.10) savingsRateScore = 55;
  else if (savingsRateVal >= 0.05) savingsRateScore = 30;
  else savingsRateScore = 10;

  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  let emergencyScore = 40;
  if (emergencyMonths >= 6) emergencyScore = 100;
  else if (emergencyMonths >= 3) emergencyScore = 70;
  else if (emergencyMonths >= 1) emergencyScore = 40;
  else emergencyScore = 10;

  const emiRatioVal = emis / income;
  let emiScore = 100;
  if (emiRatioVal <= 0.20) emiScore = 100;
  else if (emiRatioVal <= 0.35) emiScore = 70;
  else if (emiRatioVal <= 0.50) emiScore = 40;
  else emiScore = 10;

  const hasLife = Boolean(profile.hasLifeInsurance);
  const hasHealth = Boolean(profile.hasHealthInsurance);
  let insuranceScore = 0;
  if (hasLife && hasHealth) insuranceScore = 100;
  else if (hasLife || hasHealth) insuranceScore = 50;
  else insuranceScore = 0;

  // 5. Investing habit score (Regularly: 100, Occasionally: 50, Not yet: 0)
  const habit = profile.investingHabit || profile.investingRegularity || 'Occasionally';
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

  let band = 'Stable';
  if (score <= 40) band = 'Needs attention';
  else if (score <= 70) band = 'Stable';
  else band = 'Strong';

  return {
    score,
    band,
    breakdown: {
      savingsRateScore,
      emergencyScore,
      emiScore,
      insuranceScore,
      habitScore,
    },
  };
}
