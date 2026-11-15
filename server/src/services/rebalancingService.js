import { Holding } from '../models/Holding.js';
import { Recommendation } from '../models/Recommendation.js';
import { Profile } from '../models/Profile.js';
import { getTaxAssetClass } from '../config/taxRules.js';

/**
 * Calculates current portfolio allocation, compares against fiduciary target,
 * evaluates drift against threshold, computes exact rupee rebalance trades,
 * builds a non-selling SIP redirection plan, and flags tax impacts.
 *
 * @param {string} userId
 * @param {number} [driftThreshold=5] Percentage drift tolerance (e.g. 5 = 5%)
 */
export async function calculateRebalancePlan(userId, driftThreshold = 5) {
  // 1. Fetch user's holdings, active recommendation, and profile
  const [holdings, activeRec, profile] = await Promise.all([
    Holding.find({ userId }),
    Recommendation.findOne({ userId, status: 'active' }).sort({ createdAt: -1 }),
    Profile.findOne({ userId }),
  ]);

  // 2. Compute current allocation from active holdings
  const currentAssetValues = {
    equity: 0,
    debt: 0,
    gold: 0,
    cash: 0,
  };

  const fundBreakdown = [];

  for (const h of holdings) {
    const val = (h.quantity || 0) * (h.currentPrice || h.buyPrice || 0);
    const assetClass = getTaxAssetClass(h.type, h.categoryOrSector, h.name).toLowerCase();

    if (assetClass === 'equity') {
      currentAssetValues.equity += val;
    } else if (assetClass === 'debt') {
      currentAssetValues.debt += val;
    } else if (assetClass === 'gold') {
      currentAssetValues.gold += val;
    } else {
      currentAssetValues.cash += val;
    }

    fundBreakdown.push({
      holdingId: h._id,
      name: h.name,
      symbolOrCode: h.symbolOrCode,
      type: h.type,
      assetClass: assetClass.toUpperCase(),
      currentValue: val,
      gain: val - (h.quantity * h.buyPrice),
      quantity: h.quantity,
      currentPrice: h.currentPrice || h.buyPrice,
    });
  }

  const totalPortfolioValue =
    currentAssetValues.equity +
    currentAssetValues.debt +
    currentAssetValues.gold +
    currentAssetValues.cash;

  // Current percentages
  const currentAllocation = {
    equity: totalPortfolioValue > 0 ? (currentAssetValues.equity / totalPortfolioValue) * 100 : 0,
    debt: totalPortfolioValue > 0 ? (currentAssetValues.debt / totalPortfolioValue) * 100 : 0,
    gold: totalPortfolioValue > 0 ? (currentAssetValues.gold / totalPortfolioValue) * 100 : 0,
    cash: totalPortfolioValue > 0 ? (currentAssetValues.cash / totalPortfolioValue) * 100 : 0,
  };

  // 3. Determine Target Allocation
  // Priority: 1. Active Fiduciary Recommendation -> 2. Profile Goals/Risk Band -> 3. Standard Moderate 60/30/10
  let targetAllocation = { equity: 60, debt: 30, gold: 10, cash: 0 };
  let targetSource = 'Standard Moderate Baseline (60/30/10)';

  if (activeRec?.assetAllocation && typeof activeRec.assetAllocation.equity === 'number') {
    targetAllocation = {
      equity: activeRec.assetAllocation.equity,
      debt: activeRec.assetAllocation.debt,
      gold: activeRec.assetAllocation.gold || 0,
      cash: 0,
    };
    targetSource = `Fiduciary Recommendation (Risk Band: ${activeRec.profileSnapshot?.riskBand || 'Assigned'})`;
  } else if (profile?.scores?.riskBand) {
    const band = profile.scores.riskBand.toLowerCase();
    if (band === 'conservative' || band === 'low') {
      targetAllocation = { equity: 30, debt: 60, gold: 10, cash: 0 };
    } else if (band === 'aggressive' || band === 'very high') {
      targetAllocation = { equity: 80, debt: 15, gold: 5, cash: 0 };
    } else {
      targetAllocation = { equity: 60, debt: 30, gold: 10, cash: 0 };
    }
    targetSource = `Profile Risk Profile (${profile.scores.riskBand})`;
  }

  // 4. Calculate drift and required rupee rebalance amounts
  const assetClasses = ['equity', 'debt', 'gold'];
  const assetClassTrades = [];
  let maxDrift = 0;
  let rebalanceNeeded = false;

  for (const ac of assetClasses) {
    const currentPct = currentAllocation[ac] || 0;
    const targetPct = targetAllocation[ac] || 0;
    const driftPct = currentPct - targetPct; // Positive = overweight, Negative = underweight
    const absDrift = Math.abs(driftPct);

    if (absDrift > maxDrift) {
      maxDrift = absDrift;
    }

    if (absDrift >= driftThreshold) {
      rebalanceNeeded = true;
    }

    const targetVal = (targetPct / 100) * totalPortfolioValue;
    const currentVal = currentAssetValues[ac] || 0;
    const rupeeDiff = targetVal - currentVal; // Positive = BUY, Negative = SELL

    assetClassTrades.push({
      assetClass: ac.toUpperCase(),
      currentValue: currentVal,
      currentWeight: currentPct,
      targetWeight: targetPct,
      driftPercent: driftPct,
      isDriftViolated: absDrift >= driftThreshold,
      action: rupeeDiff > 0 ? 'BUY' : rupeeDiff < 0 ? 'SELL' : 'HOLD',
      amount: Math.abs(rupeeDiff),
      targetValue: targetVal,
    });
  }

  // 5. Per-fund trade suggestions
  const fundTrades = [];
  let estimatedTaxImpact = 0;
  let taxTriggeredNotes = [];

  for (const acTrade of assetClassTrades) {
    if (acTrade.action === 'SELL' && acTrade.amount > 100) {
      // Find funds in this asset class to trim
      const matchingFunds = fundBreakdown
        .filter((f) => f.assetClass === acTrade.assetClass && f.currentValue > 0)
        .sort((a, b) => b.currentValue - a.currentValue);

      let remainingToSell = acTrade.amount;
      for (const fund of matchingFunds) {
        if (remainingToSell <= 0) break;
        const sellAmount = Math.min(remainingToSell, fund.currentValue);
        const unitsToSell = fund.currentPrice > 0 ? sellAmount / fund.currentPrice : 0;
        
        // Estimate tax impact if selling
        const estGainProportion = fund.currentValue > 0 ? fund.gain / fund.currentValue : 0;
        const estRealizedGain = Math.max(0, sellAmount * estGainProportion);
        const taxRate = fund.assetClass === 'EQUITY' ? 0.125 : 0.30;
        const estTax = estRealizedGain * taxRate * 1.04;
        estimatedTaxImpact += estTax;

        fundTrades.push({
          holdingId: fund.holdingId,
          name: fund.name,
          symbolOrCode: fund.symbolOrCode,
          assetClass: fund.assetClass,
          action: 'SELL',
          amount: sellAmount,
          units: unitsToSell,
          estimatedTax: estTax,
          rationale: `Trim ${fund.name} by ₹${Math.round(sellAmount).toLocaleString('en-IN')} to reduce overweight ${acTrade.assetClass} allocation.`,
        });

        remainingToSell -= sellAmount;
      }

      if (acTrade.assetClass === 'EQUITY') {
        taxTriggeredNotes.push(
          `Selling overweight Equity may trigger ~12.5% LTCG tax (or 20% STCG if held < 1 year).`
        );
      } else {
        taxTriggeredNotes.push(
          `Selling overweight Debt mutual funds may trigger income tax at your individual slab rate.`
        );
      }
    } else if (acTrade.action === 'BUY' && acTrade.amount > 100) {
      // Recommend buying underweight asset class
      const matchingFunds = fundBreakdown.filter((f) => f.assetClass === acTrade.assetClass);
      const topFund = matchingFunds.length > 0 ? matchingFunds[0] : null;

      fundTrades.push({
        holdingId: topFund?.holdingId || null,
        name: topFund?.name || `Top Recommended ${acTrade.assetClass} Fund`,
        symbolOrCode: topFund?.symbolOrCode || '',
        assetClass: acTrade.assetClass,
        action: 'BUY',
        amount: acTrade.amount,
        units: topFund && topFund.currentPrice > 0 ? acTrade.amount / topFund.currentPrice : null,
        estimatedTax: 0,
        rationale: `Deploy ₹${Math.round(acTrade.amount).toLocaleString('en-IN')} into ${acTrade.assetClass} to restore target balance.`,
      });
    }
  }

  // 6. SIP Rebalance Strategy (Preferred non-selling alternative)
  // Rebalance through new SIP inflows over 3-12 months instead of incurring capital gains tax
  const monthlySavings = profile?.monthlySavings || profile?.monthlyIncome * 0.2 || 25000;
  const underweightTrades = assetClassTrades.filter((t) => t.action === 'BUY');
  const totalNeededInflow = underweightTrades.reduce((sum, t) => sum + t.amount, 0);

  const monthsToRebalance = monthlySavings > 0 ? Math.ceil(totalNeededInflow / monthlySavings) : 6;
  const sipRedirectionPlan = underweightTrades.map((t) => {
    const proportion = totalNeededInflow > 0 ? t.amount / totalNeededInflow : 1 / underweightTrades.length;
    const monthlyAllocation = monthlySavings * proportion;
    return {
      assetClass: t.assetClass,
      monthlyAmount: Math.round(monthlyAllocation),
      targetAmountToAccumulate: t.amount,
      monthsRequired: monthlyAllocation > 0 ? Math.ceil(t.amount / monthlyAllocation) : 12,
      recommendation: `Direct ₹${Math.round(monthlyAllocation).toLocaleString('en-IN')}/month into ${t.assetClass} to restore target allocation without selling existing units.`,
    };
  });

  return {
    portfolioValue: totalPortfolioValue,
    driftThreshold,
    maxDrift,
    rebalanceNeeded,
    targetSource,
    currentAllocation,
    targetAllocation,
    currentAssetValues,
    assetClassTrades,
    fundTrades,
    sipRedirectionPlan: {
      monthlyCapacity: monthlySavings,
      totalInflowNeeded: totalNeededInflow,
      estimatedMonthsToBalance: Math.min(24, Math.max(1, monthsToRebalance)),
      allocations: sipRedirectionPlan,
    },
    taxImpact: {
      estimatedTotalTax: estimatedTaxImpact,
      isTaxFreeSipOptionAvailable: totalNeededInflow > 0,
      taxNotes: taxTriggeredNotes,
    },
  };
}
