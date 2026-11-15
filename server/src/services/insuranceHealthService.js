import { Profile } from '../models/Profile.js';

/**
 * Evaluates emergency fund adequacy, term life insurance sufficiency,
 * and health cover adequacy based on user profile and standard Indian financial rules.
 *
 * @param {string} userId
 */
export async function evaluateInsuranceAndEmergency(userId) {
  const profile = await Profile.findOne({ userId });

  const monthlyIncome = profile?.monthlyIncome || 60000;
  const monthlyExpenses = profile?.monthlyExpenses || 30000;
  const monthlyEMI = profile?.monthlyEMI || profile?.monthlyEMIs || 0;
  const monthlyBurn = Math.max(1000, monthlyExpenses + monthlyEMI);
  const annualIncome = monthlyIncome * 12;

  const dependents = profile?.dependents || profile?.dependentsCount || 0;
  const actualEmergencyFund = profile?.emergencyFundAmount || 0;
  const hasLifeInsurance = Boolean(profile?.hasLifeInsurance);
  const actualTermCover = profile?.termInsuranceCover || (hasLifeInsurance ? annualIncome * 5 : 0);
  const hasHealthInsurance = Boolean(profile?.hasHealthInsurance);
  const actualHealthCover = profile?.healthInsuranceCover || (hasHealthInsurance ? 500000 : 0);

  // 1. Emergency Fund Assessment
  // Target: 6 months for salaried with low dependents, 9-12 months for freelancers or 2+ dependents
  let targetEmergencyMonths = 6;
  if (dependents >= 2 || (profile?.occupationType || '').toLowerCase().includes('business')) {
    targetEmergencyMonths = 9;
  }
  const recommendedEmergencyFund = monthlyBurn * targetEmergencyMonths;
  const actualEmergencyMonths = Number((actualEmergencyFund / monthlyBurn).toFixed(1));
  const emergencyShortfall = Math.max(0, recommendedEmergencyFund - actualEmergencyFund);
  const isEmergencyFundAdequate = actualEmergencyMonths >= targetEmergencyMonths;

  let emergencyFundStatus = 'HEALTHY';
  let emergencyReason = '';
  if (actualEmergencyMonths === 0) {
    emergencyFundStatus = 'CRITICAL';
    emergencyReason = `You currently have no emergency liquidity parked. At your monthly burn rate of ₹${monthlyBurn.toLocaleString('en-IN')}, an unexpected medical emergency or job disruption could force you into high-interest debt.`;
  } else if (actualEmergencyMonths < targetEmergencyMonths) {
    emergencyFundStatus = 'INADEQUATE';
    emergencyReason = `Your emergency fund covers ${actualEmergencyMonths} months of expenses and EMIs, below the recommended ${targetEmergencyMonths} months (₹${recommendedEmergencyFund.toLocaleString('en-IN')}). You have a shortfall of ₹${emergencyShortfall.toLocaleString('en-IN')}.`;
  } else {
    emergencyReason = `Your emergency fund covers ${actualEmergencyMonths} months (₹${actualEmergencyFund.toLocaleString('en-IN')}), exceeding your target of ${targetEmergencyMonths} months. Your basic buffer is solid.`;
  }

  // 2. Term Life Insurance Assessment
  // Rule of thumb: 10x to 15x annual income if dependents > 0
  let recommendedTermCover = 0;
  let termCoverMultiple = 12; // 12x annual income
  if (dependents > 0) {
    recommendedTermCover = annualIncome * termCoverMultiple;
  } else {
    recommendedTermCover = annualIncome * 5; // Minimal liability buffer
  }

  const termShortfall = Math.max(0, recommendedTermCover - actualTermCover);
  const isTermAdequate = actualTermCover >= recommendedTermCover;

  let termStatus = 'HEALTHY';
  let termReason = '';
  if (dependents > 0 && (!hasLifeInsurance || actualTermCover === 0)) {
    termStatus = 'CRITICAL';
    termReason = `You have ${dependents} financial dependent(s) but no pure term life insurance. Pure term cover of 10x–15x annual income (₹${(recommendedTermCover / 100000).toFixed(1)} Lakh) is vital to ensure your family's future and replace your income in your absence.`;
  } else if (dependents > 0 && actualTermCover < recommendedTermCover) {
    termStatus = 'INADEQUATE';
    termReason = `Your current life cover of ₹${(actualTermCover / 100000).toFixed(1)} Lakh is below the recommended 12x annual income benchmark of ₹${(recommendedTermCover / 100000).toFixed(1)} Lakh. Shortfall: ₹${(termShortfall / 100000).toFixed(1)} Lakh.`;
  } else if (dependents === 0) {
    termStatus = 'HEALTHY';
    termReason = `With zero dependents, life insurance is optional unless you have co-signed liabilities or dependents planned soon.`;
  } else {
    termReason = `Your term life cover of ₹${(actualTermCover / 100000).toFixed(1)} Lakh comfortably satisfies the 12x annual income rule of thumb.`;
  }

  // 3. Health Insurance Assessment
  // Minimum ₹5L base for single, ₹10L - ₹25L family floater for dependents
  const recommendedHealthCover = dependents > 0 ? 1500000 : 500000;
  const healthShortfall = Math.max(0, recommendedHealthCover - actualHealthCover);
  const isHealthAdequate = hasHealthInsurance && actualHealthCover >= recommendedHealthCover;

  let healthStatus = 'HEALTHY';
  let healthReason = '';
  if (!hasHealthInsurance || actualHealthCover === 0) {
    healthStatus = 'CRITICAL';
    healthReason = `You do not have active private health insurance. Relying solely on corporate group insurance or personal savings exposes your investment portfolio to catastrophic depletion during hospitalization.`;
  } else if (actualHealthCover < recommendedHealthCover) {
    healthStatus = 'INADEQUATE';
    healthReason = `Your health insurance cover of ₹${(actualHealthCover / 100000).toFixed(1)} Lakh is below the recommended ₹${(recommendedHealthCover / 100000).toFixed(1)} Lakh benchmark for modern medical inflation. Consider adding a Super Top-up policy.`;
  } else {
    healthReason = `Your comprehensive health cover of ₹${(actualHealthCover / 100000).toFixed(1)} Lakh protects your accumulated savings from healthcare emergencies.`;
  }

  // Composite Health Score (out of 100)
  let healthScore = 0;
  healthScore += Math.min(35, (actualEmergencyMonths / targetEmergencyMonths) * 35);
  healthScore += isTermAdequate ? 35 : dependents > 0 ? (actualTermCover / recommendedTermCover) * 35 : 35;
  healthScore += isHealthAdequate ? 30 : hasHealthInsurance ? 15 : 0;
  healthScore = Math.round(Math.min(100, healthScore));

  const actionItems = [];
  if (emergencyShortfall > 0) {
    actionItems.push({
      priority: actualEmergencyFund === 0 ? 'HIGH' : 'MEDIUM',
      category: 'EMERGENCY_FUND',
      title: 'Build Emergency Liquidity Buffer',
      action: `Park ₹${Math.round(emergencyShortfall).toLocaleString('en-IN')} in high-yield liquid funds or sweep-in FDs to reach ${targetEmergencyMonths} months of safety.`,
      shortfall: emergencyShortfall,
    });
  }
  if (termShortfall > 0 && dependents > 0) {
    actionItems.push({
      priority: 'HIGH',
      category: 'TERM_INSURANCE',
      title: 'Obtain Pure Term Life Insurance',
      action: `Purchase a pure term insurance policy with ₹${(termShortfall / 100000).toFixed(1)} Lakh sum assured (no ULIP/endowment) to protect your ${dependents} dependent(s).`,
      shortfall: termShortfall,
    });
  }
  if (healthShortfall > 0) {
    actionItems.push({
      priority: !hasHealthInsurance ? 'HIGH' : 'MEDIUM',
      category: 'HEALTH_INSURANCE',
      title: hasHealthInsurance ? 'Add Super Top-up Health Cover' : 'Acquire Base Comprehensive Health Cover',
      action: hasHealthInsurance
        ? `Enhance health coverage by adding a ₹15L–₹25L Super Top-up plan with a ₹5L deductible for nominal annual premium.`
        : `Buy an independent family floater health policy with at least ₹10 Lakh sum assured.`,
      shortfall: healthShortfall,
    });
  }

  return {
    compositeScore: healthScore,
    monthlyBurn,
    annualIncome,
    dependents,
    emergencyFund: {
      status: emergencyFundStatus,
      isAdequate: isEmergencyFundAdequate,
      actualAmount: actualEmergencyFund,
      recommendedAmount: recommendedEmergencyFund,
      actualMonths: actualEmergencyMonths,
      targetMonths: targetEmergencyMonths,
      shortfall: emergencyShortfall,
      reason: emergencyReason,
    },
    termInsurance: {
      status: termStatus,
      isAdequate: isTermAdequate,
      hasInsurance: hasLifeInsurance,
      actualCover: actualTermCover,
      recommendedCover: recommendedTermCover,
      multipleOfIncome: termCoverMultiple,
      shortfall: termShortfall,
      reason: termReason,
    },
    healthInsurance: {
      status: healthStatus,
      isAdequate: isHealthAdequate,
      hasInsurance: hasHealthInsurance,
      actualCover: actualHealthCover,
      recommendedCover: recommendedHealthCover,
      shortfall: healthShortfall,
      reason: healthReason,
    },
    actionItems,
  };
}

/**
 * Updates profile insurance & emergency fund parameters
 * @param {string} userId 
 * @param {Object} data 
 */
export async function updateInsuranceParameters(userId, data) {
  const updateFields = {};
  if (data.emergencyFundAmount !== undefined) updateFields.emergencyFundAmount = Number(data.emergencyFundAmount);
  if (data.hasLifeInsurance !== undefined) updateFields.hasLifeInsurance = Boolean(data.hasLifeInsurance);
  if (data.termInsuranceCover !== undefined) updateFields.termInsuranceCover = Number(data.termInsuranceCover);
  if (data.hasHealthInsurance !== undefined) updateFields.hasHealthInsurance = Boolean(data.hasHealthInsurance);
  if (data.healthInsuranceCover !== undefined) updateFields.healthInsuranceCover = Number(data.healthInsuranceCover);
  if (data.emergencyFundMonthsTarget !== undefined) updateFields.emergencyFundMonthsTarget = Number(data.emergencyFundMonthsTarget);

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { new: true, upsert: true }
  );

  return profile;
}
