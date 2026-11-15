import { Goal } from '../models/Goal.js';
import { Profile } from '../models/Profile.js';

/**
 * Calculates projected value, on-track status, and extra SIP requirements for a goal.
 *
 * @param {Object} goal
 * @param {number} [expectedAnnualReturn=0.12]
 */
export function calculateGoalProjections(goal, expectedAnnualReturn = 0.12) {
  const target = Number(goal.targetAmount) || 0;
  const current = Number(goal.currentAmount) || 0;
  const monthlySip = Number(goal.monthlyContribution) || 0;
  const years = Number(goal.horizonYears) || 5;
  const months = Math.max(1, Math.round(years * 12));
  const r = Number(goal.expectedReturnRate) || expectedAnnualReturn;
  const monthlyRate = r / 12;

  // 1. Future value of current accumulated corpus
  const fvLumpsum = current * Math.pow(1 + r, years);

  // 2. Future value of monthly SIP contributions (annuity due)
  let fvSip = 0;
  if (monthlySip > 0 && monthlyRate > 0) {
    fvSip =
      monthlySip *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
  } else if (monthlySip > 0) {
    fvSip = monthlySip * months;
  }

  const projectedCorpus = fvLumpsum + fvSip;
  const isOnTrack = projectedCorpus >= target;
  const shortfall = Math.max(0, target - projectedCorpus);
  const surplus = Math.max(0, projectedCorpus - target);

  // 3. Extra SIP needed to close shortfall
  let requiredTotalMonthlySip = monthlySip;
  let extraSipNeeded = 0;

  const targetFromSip = Math.max(0, target - fvLumpsum);
  if (targetFromSip > 0 && monthlyRate > 0) {
    const factor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    requiredTotalMonthlySip = Math.round(targetFromSip / factor);
    extraSipNeeded = Math.max(0, requiredTotalMonthlySip - monthlySip);
  }

  const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const projectedProgressPercent = target > 0 ? Math.min(150, Math.round((projectedCorpus / target) * 100)) : 0;

  return {
    targetAmount: target,
    currentAmount: current,
    monthlyContribution: monthlySip,
    horizonYears: years,
    expectedReturnRate: r,
    projectedCorpus: Math.round(projectedCorpus),
    fvLumpsum: Math.round(fvLumpsum),
    fvSip: Math.round(fvSip),
    isOnTrack,
    status: isOnTrack ? 'ON_TRACK' : 'OFF_TRACK',
    shortfall: Math.round(shortfall),
    surplus: Math.round(surplus),
    requiredTotalMonthlySip,
    extraSipNeeded,
    progressPercent,
    projectedProgressPercent,
  };
}

/**
 * Simulates the impact of skipping N SIP installments on a goal's final corpus and timeline.
 *
 * @param {Object} goal
 * @param {number} skipCount Number of monthly SIPs skipped (e.g. 1 to 12)
 * @returns {Object}
 */
export function simulateSkippedSips(goal, skipCount = 1) {
  const base = calculateGoalProjections(goal);
  const target = base.targetAmount;
  const current = base.currentAmount;
  const sip = base.monthlyContribution;
  const years = base.horizonYears;
  const totalMonths = Math.max(1, Math.round(years * 12));
  const r = base.expectedReturnRate;
  const monthlyRate = r / 12;

  const effectiveMonths = Math.max(0, totalMonths - skipCount);

  // Future value with skipped SIPs
  let fvSipSimulated = 0;
  if (sip > 0 && monthlyRate > 0 && effectiveMonths > 0) {
    fvSipSimulated =
      sip *
      ((Math.pow(1 + monthlyRate, effectiveMonths) - 1) / monthlyRate) *
      (1 + monthlyRate);
  }

  const simulatedProjectedCorpus = Math.round(base.fvLumpsum + fvSipSimulated);
  const corpusDrop = Math.max(0, base.projectedCorpus - simulatedProjectedCorpus);

  // Approximate months delayed to hit target
  let monthsDelayed = skipCount;
  if (sip > 0 && corpusDrop > 0) {
    // Months of additional SIP compounding needed
    monthsDelayed = Math.ceil(skipCount * (1 + r));
  }

  return {
    goalId: goal._id,
    goalName: goal.name,
    skipCount,
    baselineProjectedCorpus: base.projectedCorpus,
    simulatedProjectedCorpus,
    corpusDrop,
    monthsDelayed,
    targetAmount: target,
    stillOnTrack: simulatedProjectedCorpus >= target,
    summary: `Skipping ${skipCount} SIP installment${skipCount > 1 ? 's' : ''} (₹${(sip * skipCount).toLocaleString('en-IN')}) will reduce your final corpus by ₹${corpusDrop.toLocaleString('en-IN')} and delay your goal by approximately ${monthsDelayed} month${monthsDelayed > 1 ? 's' : ''}.`,
  };
}

/**
 * Fetches all goals for user and hydrates with projections
 * @param {string} userId 
 */
export async function getUserGoalsWithProjections(userId) {
  let goals = await Goal.find({ userId }).sort({ priority: 1, createdAt: -1 });

  // If no goals found in Goal collection, sync from Profile.goals
  if (goals.length === 0) {
    const profile = await Profile.findOne({ userId });
    if (profile?.goals && profile.goals.length > 0) {
      const created = [];
      for (const pg of profile.goals) {
        const newGoal = await Goal.create({
          userId,
          name: pg.name || pg.type || 'Financial Goal',
          category: pg.category || pg.type || 'Wealth creation',
          targetAmount: pg.targetAmount || 1000000,
          currentAmount: 0,
          horizonYears: pg.horizonYears || 5,
          priority: pg.priority === 'High' ? 'Critical' : pg.priority || 'Important',
          monthlyContribution: pg.requiredMonthlySIP || 5000,
        });
        created.push(newGoal);
      }
      goals = created;
    }
  }

  return goals.map((g) => {
    const gObj = g.toObject();
    const projections = calculateGoalProjections(gObj);
    return {
      ...gObj,
      projections,
    };
  });
}
