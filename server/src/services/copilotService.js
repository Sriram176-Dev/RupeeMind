import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Profile } from '../models/Profile.js';
import { Holding } from '../models/Holding.js';
import { PaperWallet } from '../models/PaperWallet.js';
import { PaperPosition } from '../models/PaperPosition.js';
import { Recommendation } from '../models/Recommendation.js';
import { CopilotChat } from '../models/CopilotChat.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Gathers user financial context across real holdings, paper positions, and profile
 */
export async function getUserFinancialContext(userId) {
  let profile = null;
  let holdings = [];
  let paperWallet = null;
  let paperPositions = [];
  let recommendation = null;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      [profile, holdings, paperWallet, paperPositions, recommendation] = await Promise.all([
        Profile.findOne({ userId }).lean(),
        Holding.find({ userId }).lean(),
        PaperWallet.findOne({ userId }).lean(),
        PaperPosition.find({ userId }).lean(),
        Recommendation.findOne({ userId, status: 'active' }).sort({ createdAt: -1 }).lean(),
      ]);
    } catch (err) {
      console.warn('[Copilot] Context fetch error:', err.message);
    }
  }

  // Calculate real holdings aggregates
  let totalHoldingsValue = 0;
  let totalHoldingsInvested = 0;
  const holdingSummaries = (holdings || []).map((h) => {
    const sym = h.symbolOrCode || h.symbol || 'ASSET';
    const currentVal = (h.quantity || 0) * (h.currentPrice || h.buyPrice || 0);
    const investedVal = (h.quantity || 0) * (h.buyPrice || 0);
    totalHoldingsValue += currentVal;
    totalHoldingsInvested += investedVal;
    const pnl = currentVal - investedVal;
    const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
    return {
      symbol: sym,
      name: h.name || sym,
      quantity: h.quantity,
      currentPrice: h.currentPrice || h.buyPrice,
      totalValue: Math.round(currentVal),
      pnl: Math.round(pnl),
      pnlPercent: Number(pnlPct.toFixed(1)),
      type: h.type || 'STOCK',
    };
  });

  const totalHoldingsPnL = totalHoldingsValue - totalHoldingsInvested;
  const totalHoldingsPnLPct =
    totalHoldingsInvested > 0 ? (totalHoldingsPnL / totalHoldingsInvested) * 100 : 0;

  // Paper positions summary
  const paperSummaries = (paperPositions || []).map((p) => ({
    symbol: p.symbol,
    quantity: p.quantity,
    avgPrice: p.averageBuyPrice,
    productType: p.productType,
  }));

  return {
    profile: {
      riskTolerance: profile?.riskTolerance || 'Moderate',
      investmentHorizon: profile?.investmentHorizon || '5-10 years',
      monthlySavings: profile?.monthlySavings || 25000,
      financialGoal: profile?.financialGoal || 'Wealth Creation',
      knowledgeLevel: profile?.knowledgeLevel || 'Intermediate',
    },
    realPortfolio: {
      totalHoldingsCount: holdings.length,
      totalValue: Math.round(totalHoldingsValue),
      totalInvested: Math.round(totalHoldingsInvested),
      totalPnL: Math.round(totalHoldingsPnL),
      totalPnLPercent: Number(totalHoldingsPnLPct.toFixed(2)),
      holdings: holdingSummaries,
    },
    paperTrading: {
      hasWallet: !!paperWallet,
      cashBalance: paperWallet ? Math.round(paperWallet.cashBalance) : 1000000,
      totalRealizedPnL: paperWallet ? Math.round(paperWallet.totalRealizedPnL) : 0,
      winRatePercent: paperWallet ? paperWallet.winRatePercent : 0,
      activePositionsCount: paperPositions.length,
      positions: paperSummaries,
    },
    latestRecommendation: recommendation
      ? {
          assetAllocation: recommendation.assetAllocation,
          confidenceScore: recommendation.confidenceScore,
          createdAt: recommendation.createdAt,
        }
      : null,
  };
}

/**
 * Intelligent deterministic fallback when Gemini API key is missing or encounters rate limits
 */
function generateDeterministicFallback(message, context) {
  const q = message.toLowerCase();
  const { profile, realPortfolio, paperTrading } = context;

  // Intent: Risk & Concentration
  if (q.includes('risk') || q.includes('concentration') || q.includes('diversif')) {
    const hasHoldings = realPortfolio.totalHoldingsCount > 0;
    return {
      content: `### 🛡️ Portfolio Risk & Concentration Audit

Based on your **${profile.riskTolerance}** risk profile and **${profile.investmentHorizon}** horizon:

${
  hasHoldings
    ? `* **Active Holdings Count**: ${realPortfolio.totalHoldingsCount} asset(s) with total valuation **₹${realPortfolio.totalValue.toLocaleString('en-IN')}**.
* **Unrealized Performance**: ${realPortfolio.totalPnL >= 0 ? '+' : ''}₹${realPortfolio.totalPnL.toLocaleString('en-IN')} (${realPortfolio.totalPnLPercent}%).
* **Diversification Assessment**: A resilient portfolio should spread capital across at least 10–15 stocks across non-correlated sectors (e.g. Banking, IT, Pharma, FMCG) plus low-cost index funds to reduce single-stock concentration risk.`
    : `* You do not have any live holdings recorded yet. 
* For a **${profile.riskTolerance}** investor, a classic asset allocation comprises **60% Large/Flexi-Cap Equity**, **30% Short/Corporate Debt**, and **10% Sovereign Gold / Liquid Cash**.`
}

#### 💡 Key Action Items:
1. Ensure no single equity holding exceeds **15%** of your total investable net worth.
2. Run our **Crisis Stress Simulator** (/crisis-simulator) to check how your assets withstand -38% market panics like March 2020.
3. Maintain 6 months of living expenses in liquid debt funds or high-yield savings separate from market equities.`,
      suggestions: [
        'How does my portfolio handle a market crash?',
        'What is my recommended asset allocation?',
        'How can I save tax with ELSS mutual funds?',
      ],
    };
  }

  // Intent: Taxes (LTCG / STCG / 80C)
  if (q.includes('tax') || q.includes('80c') || q.includes('elss') || q.includes('capital gain')) {
    return {
      content: `### 📋 Indian Capital Gains & Tax-Saving Blueprint (FY 2025–26)

Here is a summary of the current Indian Income Tax rules applicable to your equity and mutual fund portfolio:

#### 1. Equity Capital Gains Tax Rates:
* **Long-Term Capital Gains (LTCG)**:
  * Held for $> 12$ months.
  * Tax rate is **12.5%** on gains exceeding **₹1.25 Lakhs** in a financial year (Budget 2024 revised threshold).
* **Short-Term Capital Gains (STCG)**:
  * Held for $< 12$ months.
  * Flat tax rate of **20%** under Section 111A.

#### 2. Section 80C Tax Savings via ELSS:
* **ELSS (Equity Linked Savings Schemes)** qualify for deductions up to **₹1,50,000** under the Old Tax Regime.
* Shortest mandatory lock-in among 80C instruments (**3 years**, vs 5 years for Tax-Saver FDs and 15 years for PPF).
* Potential tax savings: Up to **₹46,800** annually for individuals in the 30% tax bracket (+ cess).

#### 💡 Tax-Loss Harvesting Tip:
Before March 31, consider booking unrealized short-term losses to offset taxable short-term capital gains, legally reducing your overall advance tax liability.`,
      suggestions: [
        'Show me top ELSS tax-saving funds',
        'Explain Long-Term vs Short-Term capital gains',
        'Review my portfolio risk and concentration',
      ],
    };
  }

  // Intent: Paper Trading & Virtual Execution
  if (q.includes('paper') || q.includes('trade') || q.includes('order') || q.includes('virtual')) {
    return {
      content: `### 📈 Virtual Paper Trading Performance Review

Here is the current state of your sandbox execution engine:

* **Available Cash Balance**: **₹${paperTrading.cashBalance.toLocaleString('en-IN')}**
* **Active Open Positions**: **${paperTrading.activePositionsCount}** position(s)
* **Cumulative Realized P&L**: **${paperTrading.totalRealizedPnL >= 0 ? '+' : ''}₹${paperTrading.totalRealizedPnL.toLocaleString('en-IN')}**
* **Trading Win Rate**: **${paperTrading.winRatePercent}%**

#### 🎯 Strategic Tips for Virtual Practice:
1. Always apply **Stop-Loss triggers** (e.g. 2% maximum risk per trade) to protect simulated capital.
2. Remember that Rupeemind simulates **real Indian statutory charges** (STT, Exchange turnover, GST, and stamp duty) so you practice true net returns.
3. Test momentum breakouts and mean-reversion setups before committing real capital on Zerodha/Groww.`,
      suggestions: [
        'How are brokerage and STT charges calculated?',
        'Suggest rebalancing towards defensive sectors',
        'Audit my portfolio concentration',
      ],
    };
  }

  // Intent: Rebalancing & Asset Allocation
  if (q.includes('rebalanc') || q.includes('allocation') || q.includes('sector') || q.includes('invest')) {
    return {
      content: `### ⚖️ Portfolio Rebalancing & Allocation Strategy

For an investor with **${profile.riskTolerance}** risk tolerance and monthly investable surplus of **₹${profile.monthlySavings.toLocaleString('en-IN')}**:

#### 📊 Target Asset Allocation Matrix:
* **Large Cap & Nifty 50 Index (40%)**: Core stability, low tracking error, reliable dividend payers.
* **Flexi-Cap / Mid-Cap Funds (30%)**: Alpha generation and earnings acceleration across market caps.
* **Short-Duration Debt / Liquid (20%)**: Rebalancing dry powder, low volatility, insulated from equity drawdowns.
* **Gold & International (10%)**: Hedge against currency depreciation and macro geopolitical shocks.

#### 🔄 Systematic Execution:
Instead of timing lump-sum entries, allocate your monthly savings via **SIP (Systematic Investment Plan)** across 3–4 core funds to benefit from rupee-cost averaging.`,
      suggestions: [
        'Audit my portfolio risk and concentration',
        'How can I save tax with ELSS mutual funds?',
        'Simulate a market crisis scenario',
      ],
    };
  }

  // Default General Financial Advisory
  return {
    content: `### 🤖 Hello! I am RupeeBot, your AI Financial Copilot

I have analyzed your live portfolio context:
* **Profile**: **${profile.riskTolerance}** risk appetite | **${profile.investmentHorizon}** horizon | Monthly Savings: **₹${profile.monthlySavings.toLocaleString('en-IN')}**.
* **Portfolio**: **${realPortfolio.totalHoldingsCount}** holding(s) worth **₹${realPortfolio.totalValue.toLocaleString('en-IN')}**.
* **Paper Trading Sandbox**: **₹${paperTrading.cashBalance.toLocaleString('en-IN')}** virtual cash available.

How can I assist your financial journey today? You can ask me to:
1. **Audit portfolio concentration & beta sensitivity**
2. **Explain Indian capital gains tax (LTCG / STCG / Section 80C)**
3. **Simulate macroeconomic shocks (RBI rate hikes, inflation, crude shocks)**
4. **Evaluate virtual paper trading strategies and execution**`,
    suggestions: [
      'Audit my portfolio risk & concentration',
      'How can I save tax under Section 80C with ELSS?',
      'Review my active paper trading positions',
      'What would happen to my portfolio if RBI hikes rates?',
    ],
  };
}

/**
 * Main chat handler: combines full context + Google Gemini LLM with robust fallback
 */
export async function chatWithCopilot(userId, userMessage, chatHistory = []) {
  const context = await getUserFinancialContext(userId);
  const apiKey = process.env.GEMINI_API_KEY;

  let assistantContent = '';
  let suggestions = [];

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are "RupeeBot", an institutional-grade, SEBI-compliant AI financial copilot and quantitative analyst for the Rupeemind platform.
You assist Indian retail and semi-institutional investors in portfolio optimization, asset allocation, risk management, and Indian tax planning.

### MANDATORY GUIDELINES:
1. Reference the user's specific financial context accurately whenever relevant:
   - Risk Profile: ${context.profile.riskTolerance}
   - Horizon: ${context.profile.investmentHorizon}
   - Monthly Savings: ₹${context.profile.monthlySavings.toLocaleString('en-IN')}
   - Active Holdings Count: ${context.realPortfolio.totalHoldingsCount} (Total Value: ₹${context.realPortfolio.totalValue.toLocaleString('en-IN')})
   - Holdings list: ${JSON.stringify(context.realPortfolio.holdings.slice(0, 10))}
   - Virtual Paper Trading Cash: ₹${context.paperTrading.cashBalance.toLocaleString('en-IN')} (Active positions: ${context.paperTrading.activePositionsCount})
2. Ground all tax discussions in the Indian Income Tax Act (Sections 80C for ELSS up to ₹1.5L, 112A for equity LTCG at 12.5% above ₹1.25L, 111A for STCG at 20%).
3. Format output with clean, professional GitHub-flavored Markdown: bold key numbers, use concise bullet points, and tables where comparative data aids clarity.
4. Conclude your response with a JSON block at the very end containing 3 helpful follow-up suggestions in this exact format:
<<<SUGGESTIONS>>>["Question 1", "Question 2", "Question 3"]<<<END_SUGGESTIONS>>>
5. Always preserve educational neutrality and include a brief SEBI educational disclaimer.`;

      // Build conversation turns
      const contents = [];
      contents.push({ role: 'user', parts: [{ text: systemInstruction }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I am RupeeBot, ready to provide context-aware quant financial advisory for Indian markets.' }] });

      // Add recent history (up to last 6 messages)
      const recentHistory = (chatHistory || []).slice(-6);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Add current user prompt
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
      });

      const rawText = response.text || '';

      // Extract suggestions block if present
      const match = rawText.match(/<<<SUGGESTIONS>>>(.*?)<<<END_SUGGESTIONS>>>/s);
      if (match) {
        try {
          suggestions = JSON.parse(match[1].trim());
          assistantContent = rawText.replace(/<<<SUGGESTIONS>>>(.*?)<<<END_SUGGESTIONS>>>/s, '').trim();
        } catch {
          assistantContent = rawText;
        }
      } else {
        assistantContent = rawText;
      }
    } catch (err) {
      console.warn('[CopilotService] Gemini API call failed, activating quant fallback:', err.message);
      const fallback = generateDeterministicFallback(userMessage, context);
      assistantContent = fallback.content;
      suggestions = fallback.suggestions;
    }
  } else {
    // No API key provided: use intelligent domain analyzer
    const fallback = generateDeterministicFallback(userMessage, context);
    assistantContent = fallback.content;
    suggestions = fallback.suggestions;
  }

  if (!suggestions || suggestions.length === 0) {
    suggestions = [
      'Audit my portfolio risk & concentration',
      'How can I save tax under Section 80C with ELSS?',
      'Simulate a market crisis scenario',
    ];
  }

  // Persist conversation into CopilotChat model
  let chatSession = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      chatSession = await CopilotChat.findOne({ userId }).sort({ updatedAt: -1 });
      if (!chatSession) {
        chatSession = new CopilotChat({
          userId,
          title: 'RupeeBot Advisory Session',
          messages: [],
        });
      }

      chatSession.messages.push({
        role: 'user',
        content: userMessage,
      });

      chatSession.messages.push({
        role: 'assistant',
        content: assistantContent,
        suggestions,
      });

      // Keep last 30 messages to avoid unbounded growth
      if (chatSession.messages.length > 30) {
        chatSession.messages = chatSession.messages.slice(-30);
      }

      await chatSession.save();
    } catch (err) {
      console.warn('[Copilot] Could not persist message to db:', err.message);
    }
  }

  return {
    role: 'assistant',
    content: assistantContent,
    suggestions,
    contextSummary: {
      riskTolerance: context.profile.riskTolerance,
      totalHoldingsValue: context.realPortfolio.totalValue,
      holdingsCount: context.realPortfolio.totalHoldingsCount,
      paperCashBalance: context.paperTrading.cashBalance,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch persistent conversation thread for user
 */
export async function getCopilotChatSession(userId) {
  let session = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    session = await CopilotChat.findOne({ userId }).sort({ updatedAt: -1 }).lean();
  }

  if (!session || !session.messages || session.messages.length === 0) {
    const context = await getUserFinancialContext(userId);
    const welcome = generateDeterministicFallback('hello', context);
    return {
      title: 'RupeeBot Advisory Session',
      messages: [
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'assistant',
          content: welcome.content,
          suggestions: welcome.suggestions,
          createdAt: new Date(),
        },
      ],
      contextSummary: {
        riskTolerance: context.profile.riskTolerance,
        totalHoldingsValue: context.realPortfolio.totalValue,
        holdingsCount: context.realPortfolio.totalHoldingsCount,
        paperCashBalance: context.paperTrading.cashBalance,
      },
    };
  }

  const context = await getUserFinancialContext(userId);
  return {
    ...session,
    contextSummary: {
      riskTolerance: context.profile.riskTolerance,
      totalHoldingsValue: context.realPortfolio.totalValue,
      holdingsCount: context.realPortfolio.totalHoldingsCount,
      paperCashBalance: context.paperTrading.cashBalance,
    },
  };
}

/**
 * Clear user chat session
 */
export async function clearCopilotChatSession(userId) {
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    await CopilotChat.deleteMany({ userId });
  }
  return { success: true };
}
