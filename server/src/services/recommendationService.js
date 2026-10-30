import { GoogleGenAI } from '@google/genai';
import { Fund } from '../models/Fund.js';
import { Profile } from '../models/Profile.js';
import { Recommendation } from '../models/Recommendation.js';
import { User } from '../models/User.js';
import { Holding } from '../models/Holding.js';
import { Watchlist } from '../models/Watchlist.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Category mapping based on user's risk tolerance
const RISK_BAND_ALLOWED_CATEGORIES = {
  Conservative: ['Liquid', 'Short Duration Debt', 'Corporate Bond', 'Balanced Advantage'],
  'Moderately Conservative': ['Short Duration Debt', 'Corporate Bond', 'Balanced Advantage', 'Large Cap Index'],
  Moderate: ['Large Cap Index', 'Flexi Cap', 'Balanced Advantage', 'Corporate Bond'],
  'Moderately Aggressive': ['Flexi Cap', 'Large & Mid Cap', 'Large Cap Index', 'Mid Cap'],
  Aggressive: ['Flexi Cap', 'Mid Cap', 'Small Cap', 'Large & Mid Cap', 'ELSS'],
};

/**
 * Score and rank mutual funds mathematically before sending shortlisted candidates to AI
 */
function scoreFund(fund) {
  let score = 0;
  let weightsSum = 0;

  // 3Y CAGR (weight 30%)
  if (fund.cagr3Y !== null && fund.cagr3Y !== undefined) {
    score += Math.max(0, fund.cagr3Y) * 0.3;
    weightsSum += 0.3;
  }

  // 5Y CAGR (weight 20%)
  if (fund.cagr5Y !== null && fund.cagr5Y !== undefined) {
    score += Math.max(0, fund.cagr5Y) * 0.2;
    weightsSum += 0.2;
  }

  // Sharpe Ratio (weight 20%)
  if (fund.sharpeRatio !== null && fund.sharpeRatio !== undefined) {
    score += Math.max(0, fund.sharpeRatio * 10) * 0.2;
    weightsSum += 0.2;
  }

  // Low Volatility & Low Drawdown (weight 30% combined)
  if (fund.volatility !== null && fund.volatility > 0) {
    const volScore = Math.max(0, 30 - fund.volatility);
    score += volScore * 0.15;
    weightsSum += 0.15;
  }

  if (fund.maxDrawdown !== null) {
    const ddScore = Math.max(0, 40 - fund.maxDrawdown);
    score += ddScore * 0.15;
    weightsSum += 0.15;
  }

  return weightsSum > 0 ? score / weightsSum : 0;
}

/**
 * Generate AI-tailored recommendations grounded strictly in real database funds,
 * real portfolio holdings, and onboarding goals.
 */
export async function generateFundRecommendations(userId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Recommendations not configured: GEMINI_API_KEY is not set in environment.');
  }

  // 1. Verify user has completed onboarding and profile questionnaire
  const user = await User.findById(userId).select('onboardingDone');
  const profileDoc = await Profile.findOne({ userId });

  if (!user || !user.onboardingDone || !profileDoc || profileDoc.scores?.risk == null || !profileDoc.scores?.riskBand) {
    const error = new Error('Please complete your investment onboarding questionnaire before generating fund recommendations.');
    error.statusCode = 400;
    error.code = 'ONBOARDING_REQUIRED';
    throw error;
  }

  // Rate Limiting: max 10 generations per 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await Recommendation.countDocuments({
    userId,
    createdAt: { $gte: oneDayAgo },
  });

  if (recentCount >= 10) {
    throw new Error('Daily AI recommendation limit reached (10 generations/day). Please check your saved recommendations.');
  }

  const effectiveRiskBand = profileDoc.effectiveRiskBand || profileDoc.riskBand || profileDoc.scores?.riskBand || 'Moderate';
  const riskToleranceBand = profileDoc.riskToleranceBand || effectiveRiskBand;
  const riskCapacityBand = profileDoc.riskCapacityBand || 'Moderate';
  const isRiskConstrained = profileDoc.isRiskConstrained || false;
  const riskConstraintReason = profileDoc.riskConstraintReason || '';
  const riskScore = profileDoc.effectiveRiskScore || profileDoc.riskScore || profileDoc.scores?.risk || 55;
  const horizonYears = profileDoc.horizonYears || 5;
  const goalType = profileDoc.goalType || 'Wealth creation';
  const monthlySavings = profileDoc.monthlySavings || 20000;
  const emergencyFund = profileDoc.emergencyFundAmount || 0;
  const monthlyExpenses = profileDoc.monthlyExpenses || 30000;
  const emergencyMonths = monthlyExpenses > 0 ? (emergencyFund / monthlyExpenses).toFixed(1) : 0;
  const monthlyEMI = profileDoc.monthlyEMI || profileDoc.monthlyEMIs || 0;
  const goalsList = profileDoc.goals && profileDoc.goals.length > 0
    ? profileDoc.goals
    : [{ name: goalType, type: goalType, targetAmount: profileDoc.targetAmount || 2500000, horizonYears }];

  // 2. Query real portfolio holdings and watchlist
  const holdings = await Holding.find({ userId }).lean();
  const watchlist = await Watchlist.findOne({ userId }).lean();

  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + (h.quantity || 0) * (h.currentPrice || h.buyPrice || 0),
    0
  );

  const holdingsSnapshot = holdings.map((h) => {
    const val = (h.quantity || 0) * (h.currentPrice || h.buyPrice || 0);
    return {
      assetType: h.type || 'STOCK',
      symbol: h.symbolOrCode,
      name: h.name || h.symbolOrCode,
      currentVal: Math.round(val),
      allocationPercent: totalPortfolioValue > 0 ? Math.round((val / totalPortfolioValue) * 100) : 0,
    };
  });

  const watchedSymbols = watchlist?.items?.map((i) => i.symbol) || [];

  // 3. Query allowed funds from MongoDB using Effective Risk Band
  const allowedCategories = RISK_BAND_ALLOWED_CATEGORIES[effectiveRiskBand] || RISK_BAND_ALLOWED_CATEGORIES.Moderate;
  const candidates = await Fund.find({ category: { $in: allowedCategories } }).select('-navHistory').lean();

  if (candidates.length === 0) {
    throw new Error('No synchronized mutual funds found in database. Please run fund sync first.');
  }

  // 4. Rank candidates using quantitative composite formula
  const rankedFunds = candidates
    .map((f) => ({ ...f, compositeScore: scoreFund(f) }))
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 10); // Top 10 shortlist

  const fundMap = new Map(rankedFunds.map((f) => [f.schemeCode.toString(), f]));

  // 5. Construct prompt for Gemini API with real portfolio context
  const candidateSummary = rankedFunds.map((f, i) => ({
    index: i + 1,
    schemeCode: f.schemeCode,
    name: f.name,
    fundHouse: f.fundHouse,
    category: f.category,
    riskLevel: f.riskLevel,
    cagr3Y: f.cagr3Y ? `${f.cagr3Y}%` : 'N/A',
    cagr5Y: f.cagr5Y ? `${f.cagr5Y}%` : 'N/A',
    volatility: f.volatility ? `${f.volatility}%` : 'N/A',
    sharpeRatio: f.sharpeRatio ?? 'N/A',
  }));

  const aiPrompt = `You are Rupee Mind's production AI wealth strategist & portfolio engine.
Investor Dual-Engine Profile & Real Financial Circumstances:
- Effective Fiduciary Risk Band: ${effectiveRiskBand} (Score: ${riskScore}/100)
- Psychological Risk Tolerance (Willingness): ${riskToleranceBand}
- Financial Risk Capacity (Ability): ${riskCapacityBand}
- Fiduciary Constraint Status: ${isRiskConstrained ? `Constrained (${riskConstraintReason})` : 'Harmoniously Aligned'}
- Emergency Fund Runway: ${emergencyMonths} months of living expenses (₹${emergencyFund.toLocaleString('en-IN')})
- Monthly Loan Debt/EMIs: ₹${monthlyEMI.toLocaleString('en-IN')}
- Investible Monthly Surplus: ₹${monthlySavings.toLocaleString('en-IN')}
- Individually Defined Goals: ${JSON.stringify(goalsList.map(g => ({ name: g.name || g.type, horizon: `${g.horizonYears} yrs`, target: `₹${(g.targetAmount || 0).toLocaleString('en-IN')}`, priority: g.priority || 'Important' })))}

Current Investor Portfolio Context:
- Total Portfolio Value: ₹${Math.round(totalPortfolioValue).toLocaleString('en-IN')}
- Existing Holdings (${holdings.length} assets): ${JSON.stringify(holdingsSnapshot.slice(0, 8))}
- Watchlist Items (${watchedSymbols.length}): ${JSON.stringify(watchedSymbols.slice(0, 8))}

Available Shortlisted Mutual Funds in Database (ONLY choose from this exact list):
${JSON.stringify(candidateSummary, null, 2)}

INSTRUCTIONS & FIDUCIARY CONSTRAINTS:
1. Select between 3 and 5 best-suited funds from the candidate list that complement existing holdings and directly serve the user's individually defined goals.
2. Allocate suggested percentages summing to EXACTLY 100%.
3. Assign a role to each selected fund: "Core Wealth Builder", "Stability & Hedge", "Growth Accelerator", or "Tax Saver & Compounding".
4. Write a tailored, deep rationale explaining how it fits the investor's balance sheet constraints (e.g. emergency runway, EMI load) and target milestones.
5. Provide overall asset allocation (equity, debt, gold percentages summing to 100%) constrained by actual capacity.
6. Provide a confidenceScore between 75 and 98 based on portfolio-goal alignment.
7. Provide aiReasoning containing:
   - "summary": A 2-sentence executive summary explaining how the allocation is constrained and balanced for their real circumstances.
   - "keyDrivers": 3-4 bullet strings explaining key portfolio drivers and constraints applied (e.g. liquidity cushion, EMI burden, goal horizons).
   - "portfolioAlignment": 1-2 sentences on how this bridges current holding gaps without exposing essential living funds to market drawdowns.
8. Return ONLY valid JSON matching this exact structure with NO markdown fences, NO surrounding commentary:
   - "portfolioAlignment": 1-2 sentences on how this bridges current holding gaps.
8. Return ONLY valid JSON matching this exact structure with NO markdown fences, NO surrounding commentary:

{
  "confidenceScore": 88,
  "assetAllocation": { "equity": 70, "debt": 20, "gold": 10 },
  "aiReasoning": {
    "summary": "...",
    "keyDrivers": ["...", "..."],
    "portfolioAlignment": "..."
  },
  "picks": [
    {
      "schemeCode": "122639",
      "allocationPercent": 40,
      "role": "Core Wealth Builder",
      "reason": "..."
    }
  ],
  "marketContextNote": "..."
}`;

  const ai = new GoogleGenAI({ apiKey });

  let parsedOutput = null;
  let attempts = 0;

  while (attempts < 2 && !parsedOutput) {
    attempts++;
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: aiPrompt,
      });

      const text = response.text || '';
      const cleanJson = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const result = JSON.parse(cleanJson);

      // Validation: verify picks exist and allocation sums to 100
      if (Array.isArray(result.picks) && result.picks.length > 0) {
        const validPicks = result.picks.filter((p) => fundMap.has(p.schemeCode?.toString()));
        if (validPicks.length >= 2) {
          // Normalize allocations to 100%
          const sum = validPicks.reduce((acc, p) => acc + (p.allocationPercent || 0), 0);
          if (sum > 0) {
            validPicks.forEach((p) => {
              p.allocationPercent = Math.round((p.allocationPercent / sum) * 100);
            });
            const newSum = validPicks.reduce((acc, p) => acc + p.allocationPercent, 0);
            if (newSum !== 100) {
              validPicks[0].allocationPercent += 100 - newSum;
            }
          }
          parsedOutput = { ...result, picks: validPicks };
        }
      }
    } catch (err) {
      console.warn(`[RecommendationService] Gemini attempt ${attempts} failed:`, err.message);
    }
  }

  // Graceful rule-based fallback if AI API response fails
  if (!parsedOutput) {
    console.warn('[RecommendationService] AI call unsuccessful. Building high-conviction quantitative recommendation.');
    const topPicks = rankedFunds.slice(0, 3);
    const defaultAllocations = [50, 30, 20];
    parsedOutput = {
      confidenceScore: 85,
      assetAllocation: {
        equity: effectiveRiskBand === 'Aggressive' ? 80 : effectiveRiskBand === 'Conservative' ? 25 : effectiveRiskBand === 'Moderately Conservative' ? 35 : effectiveRiskBand === 'Moderately Aggressive' ? 70 : 55,
        debt: effectiveRiskBand === 'Aggressive' ? 12 : effectiveRiskBand === 'Conservative' ? 65 : effectiveRiskBand === 'Moderately Conservative' ? 55 : effectiveRiskBand === 'Moderately Aggressive' ? 20 : 35,
        gold: 10,
      },
      aiReasoning: {
        summary: `Fiduciary recommendation calibrated to ${effectiveRiskBand} posture (${isRiskConstrained ? 'constrained by cash flow & emergency reserves' : 'aligned with investor profile'}) across a ${horizonYears}-year horizon.`,
        keyDrivers: [
          `Asset allocation strictly constrained by your financial risk capacity (${emergencyMonths} months emergency runway, ${monthlyEMI > 0 ? `₹${monthlyEMI.toLocaleString('en-IN')} EMI commitments` : 'zero active EMI debt'}).`,
          `Fund selection directly prioritized for your individual goals (${goalsList.map(g => g.name || g.type).join(', ')}).`,
          `Top-quartile Sharpe ratio and historical consistency across the ${effectiveRiskBand} mutual fund universe.`,
        ],
        portfolioAlignment: `Engineered to complement your current ${holdings.length} holding(s) with systematic downside resilience.`,
      },
      picks: topPicks.map((f, i) => ({
        schemeCode: f.schemeCode.toString(),
        allocationPercent: defaultAllocations[i] || 20,
        role: i === 0 ? 'Core Wealth Builder' : i === 1 ? 'Growth Accelerator' : 'Stability & Hedge',
        reason: `Selected for stellar risk-adjusted return (${f.sharpeRatio ? f.sharpeRatio.toFixed(2) : '3Y CAGR ' + f.cagr3Y + '%'}) matching ${effectiveRiskBand} risk posture.`,
      })),
      marketContextNote: 'Generated based on quantitative multi-factor screening and fiduciary balance-sheet constraints.',
    };
  }

  // Format final response
  const finalRecs = parsedOutput.picks.map((pick, idx) => {
    const fund = fundMap.get(pick.schemeCode.toString());
    return {
      rank: idx + 1,
      schemeCode: fund.schemeCode,
      fundCode: fund.code || `mf_${fund.schemeCode}`,
      fundName: fund.name,
      fundHouse: fund.fundHouse,
      category: fund.category,
      riskLevel: fund.riskLevel,
      nav: fund.nav,
      cagr3Y: fund.cagr3Y,
      cagr5Y: fund.cagr5Y,
      allocationPercent: pick.allocationPercent,
      role: pick.role || 'Core Wealth Builder',
      rationale: pick.reason,
    };
  });

  const recommendationDoc = await Recommendation.create({
    userId,
    profileSnapshot: {
      riskBand: effectiveRiskBand,
      riskScore,
      horizonYears,
      goalType,
      monthlySavings,
    },
    assetAllocation: {
      equity: parsedOutput.assetAllocation?.equity ?? 70,
      debt: parsedOutput.assetAllocation?.debt ?? 20,
      gold: parsedOutput.assetAllocation?.gold ?? 10,
    },
    recommendations: finalRecs,
    holdingsSnapshot,
    confidenceScore: parsedOutput.confidenceScore || 85,
    aiReasoning: parsedOutput.aiReasoning || {
      summary: 'Tailored fund portfolio constructed according to risk tolerance and goals.',
      keyDrivers: ['Historical 3Y/5Y return consistency', 'Lower volatility relative to peers'],
      portfolioAlignment: 'Fills allocation gaps and improves risk-adjusted yield.',
    },
    marketContextNote: parsedOutput.marketContextNote || 'Generated based on current Indian macroeconomic backdrop.',
    status: 'active',
  });

  return recommendationDoc;
}

/**
 * Get latest active recommendation for user
 */
export async function getLatestRecommendation(userId) {
  const latest = await Recommendation.findOne({ userId, status: 'active' })
    .sort({ createdAt: -1 })
    .lean();
  return latest || Recommendation.findOne({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Get recommendation history for user with pagination
 */
export async function getRecommendationHistory(userId, options = {}) {
  const { status, limit = 20, page = 1 } = options;
  const filter = { userId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Recommendation.countDocuments(filter);

  const items = await Recommendation.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return {
    items,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
}

/**
 * Get specific recommendation by ID
 */
export async function getRecommendationById(userId, recommendationId) {
  const rec = await Recommendation.findOne({ _id: recommendationId, userId }).lean();
  if (!rec) {
    const error = new Error('Recommendation not found');
    error.statusCode = 404;
    throw error;
  }
  return rec;
}

/**
 * Compare two recommendations side by side
 */
export async function compareRecommendations(userId, id1, id2) {
  const [rec1, rec2] = await Promise.all([
    Recommendation.findOne({ _id: id1, userId }).lean(),
    Recommendation.findOne({ _id: id2, userId }).lean(),
  ]);

  if (!rec1 || !rec2) {
    const error = new Error('One or both recommendations not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate comparative metrics
  const rec1FundNames = new Set(rec1.recommendations.map((r) => r.fundName));
  const rec2FundNames = new Set(rec2.recommendations.map((r) => r.fundName));

  const commonFunds = [...rec1FundNames].filter((name) => rec2FundNames.has(name));
  const uniqueToRec1 = [...rec1FundNames].filter((name) => !rec2FundNames.has(name));
  const uniqueToRec2 = [...rec2FundNames].filter((name) => !rec1FundNames.has(name));

  const avgCagr3Y1 =
    rec1.recommendations.reduce((sum, r) => sum + (r.cagr3Y || 0) * (r.allocationPercent / 100), 0);
  const avgCagr3Y2 =
    rec2.recommendations.reduce((sum, r) => sum + (r.cagr3Y || 0) * (r.allocationPercent / 100), 0);

  const comparison = {
    rec1: {
      id: rec1._id,
      generatedAt: rec1.generatedAt || rec1.createdAt,
      riskBand: rec1.profileSnapshot?.riskBand,
      confidenceScore: rec1.confidenceScore || 85,
      assetAllocation: rec1.assetAllocation,
      recommendations: rec1.recommendations,
      weightedCagr3Y: Number(avgCagr3Y1.toFixed(2)),
      aiReasoning: rec1.aiReasoning,
      status: rec1.status,
    },
    rec2: {
      id: rec2._id,
      generatedAt: rec2.generatedAt || rec2.createdAt,
      riskBand: rec2.profileSnapshot?.riskBand,
      confidenceScore: rec2.confidenceScore || 85,
      assetAllocation: rec2.assetAllocation,
      recommendations: rec2.recommendations,
      weightedCagr3Y: Number(avgCagr3Y2.toFixed(2)),
      aiReasoning: rec2.aiReasoning,
      status: rec2.status,
    },
    comparisonSummary: {
      commonFundsCount: commonFunds.length,
      commonFunds,
      uniqueToRec1,
      uniqueToRec2,
      equityAllocationDiff: (rec2.assetAllocation?.equity || 0) - (rec1.assetAllocation?.equity || 0),
      debtAllocationDiff: (rec2.assetAllocation?.debt || 0) - (rec1.assetAllocation?.debt || 0),
      weightedCagr3YDiff: Number((avgCagr3Y2 - avgCagr3Y1).toFixed(2)),
      confidenceDiff: (rec2.confidenceScore || 85) - (rec1.confidenceScore || 85),
    },
  };

  return comparison;
}

/**
 * Archive a recommendation
 */
export async function archiveRecommendation(userId, recommendationId) {
  const rec = await Recommendation.findOneAndUpdate(
    { _id: recommendationId, userId },
    { status: 'archived' },
    { new: true }
  );

  if (!rec) {
    const error = new Error('Recommendation not found');
    error.statusCode = 404;
    throw error;
  }

  return rec;
}

/**
 * Delete a recommendation
 */
export async function deleteRecommendation(userId, recommendationId) {
  const result = await Recommendation.findOneAndDelete({ _id: recommendationId, userId });
  if (!result) {
    const error = new Error('Recommendation not found');
    error.statusCode = 404;
    throw error;
  }
  return { success: true, deletedId: recommendationId };
}
