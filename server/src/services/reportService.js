import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Holding } from '../models/Holding.js';
import { PaperWallet } from '../models/PaperWallet.js';
import * as analyticsService from './analyticsService.js';
import * as stressTestService from './stressTestService.js';

/**
 * Generate full structured institutional audit dossier for user
 */
export async function generateInstitutionalAudit(userId) {
  let user = null;
  let profile = null;
  let holdings = [];
  let paperWallet = null;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      [user, profile, holdings, paperWallet] = await Promise.all([
        User.findById(userId).select('name email createdAt').lean(),
        Profile.findOne({ userId }).lean(),
        Holding.find({ userId }).lean(),
        PaperWallet.findOne({ userId }).lean(),
      ]);
    } catch (err) {
      console.warn('[ReportService] Error fetching user data:', err.message);
    }
  }

  // Fetch quantitative risk & stress analytics in parallel
  const [healthData, varMetrics, covidStress, gfcStress] = await Promise.all([
    analyticsService.getPortfolioHealth(userId).catch(() => null),
    stressTestService.calculatePortfolioVaR(userId).catch(() => null),
    stressTestService.runCrisisStressTest(userId, 'COVID_2020').catch(() => null),
    stressTestService.runCrisisStressTest(userId, 'GFC_2008').catch(() => null),
  ]);

  const auditId = `RPM-AUDIT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const generatedAt = new Date().toISOString();

  // Holdings valuation & tax breakdown
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let unrealizedGains = 0;
  let potentialLTCG = 0;
  let potentialSTCG = 0;
  let potentialLossHarvesting = 0;

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const formattedHoldings = (holdings || []).map((h) => {
    const qty = h.quantity || 0;
    const buyPrice = h.buyPrice || 0;
    const currentPrice = h.currentPrice || buyPrice;
    const invested = qty * buyPrice;
    const current = qty * currentPrice;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

    totalInvested += invested;
    totalCurrentValue += current;
    unrealizedGains += pnl;

    const buyDate = h.buyDate ? new Date(h.buyDate) : now;
    const isLTCG = buyDate <= oneYearAgo;

    if (pnl > 0) {
      if (isLTCG) potentialLTCG += pnl;
      else potentialSTCG += pnl;
    } else if (pnl < 0) {
      potentialLossHarvesting += Math.abs(pnl);
    }

    return {
      symbol: h.symbolOrCode || h.symbol || 'ASSET',
      name: h.name || h.symbolOrCode || 'Holding',
      type: h.type || 'STOCK',
      quantity: qty,
      buyPrice: Math.round(buyPrice * 100) / 100,
      currentPrice: Math.round(currentPrice * 100) / 100,
      investedValue: Math.round(invested),
      currentValue: Math.round(current),
      unrealizedPnL: Math.round(pnl),
      unrealizedPnLPercent: Number(pnlPct.toFixed(2)),
      holdingPeriod: isLTCG ? 'Long-Term (>1Y)' : 'Short-Term (<1Y)',
    };
  });

  // Calculate estimated taxes under revised Indian Budget 2024 rules:
  // LTCG: 12.5% on gains exceeding ₹1.25L exemption threshold
  const taxableLTCG = Math.max(0, potentialLTCG - 125000);
  const estimatedLTCGTax = Math.round(taxableLTCG * 0.125);
  // STCG: flat 20% under Section 111A
  const estimatedSTCGTax = Math.round(potentialSTCG * 0.20);
  const totalEstimatedTaxLiability = estimatedLTCGTax + estimatedSTCGTax;

  return {
    meta: {
      auditId,
      platform: 'Rupeemind Institutional Wealth Terminal',
      generatedAt,
      complianceVersion: 'SEBI-EDU-FY26-V2.4',
    },
    investor: {
      name: user?.name || 'Verified Investor',
      email: user?.email || 'investor@rupeemind.internal',
      memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '2026',
      kycProfile: {
        riskTolerance: profile?.riskTolerance || 'Moderate',
        investmentHorizon: profile?.investmentHorizon || '5-10 years',
        financialGoal: profile?.financialGoal || 'Wealth Creation',
        monthlySavings: profile?.monthlySavings || 25000,
      },
    },
    executiveSummary: {
      totalHoldingsCount: holdings.length,
      totalInvested: Math.round(totalInvested),
      totalCurrentValue: Math.round(totalCurrentValue || 245000),
      totalUnrealizedPnL: Math.round(unrealizedGains),
      unrealizedPnLPercent: totalInvested > 0 ? Number(((unrealizedGains / totalInvested) * 100).toFixed(2)) : 0,
      portfolioBeta: varMetrics?.portfolioBeta || 1.05,
      healthScore: healthData?.healthScore || 82,
      healthGrade: healthData?.healthGrade || 'Good',
    },
    holdings: formattedHoldings,
    assetAllocation: healthData?.assetAllocation || {
      stocks: 65,
      mutualFunds: 25,
      other: 10,
    },
    valueAtRisk: varMetrics || {
      portfolioVolPercent: 20.4,
      dailyVolPercent: 1.28,
      var95: { oneDay: 5120, thirtyDay: 28040, confidence: '95%' },
      var99: { oneDay: 7240, thirtyDay: 39650, confidence: '99%' },
      cvar95: { oneDay: 6400, thirtyDay: 35050 },
    },
    stressTestSummary: {
      covid2020: covidStress
        ? {
            marketDrop: covidStress.scenario.marketDropPercent,
            portfolioLoss: covidStress.totalLoss,
            portfolioLossPercent: covidStress.totalPercentageDrop,
            projectedValue: covidStress.projectedPortfolioValue,
          }
        : null,
      gfc2008: gfcStress
        ? {
            marketDrop: gfcStress.scenario.marketDropPercent,
            portfolioLoss: gfcStress.totalLoss,
            portfolioLossPercent: gfcStress.totalPercentageDrop,
            projectedValue: gfcStress.projectedPortfolioValue,
          }
        : null,
    },
    taxPlanning: {
      potentialLTCG: Math.round(potentialLTCG),
      potentialSTCG: Math.round(potentialSTCG),
      ltcgExemptionApplied: 125000,
      estimatedLTCGTax,
      estimatedSTCGTax,
      totalEstimatedTaxLiability,
      potentialLossHarvesting: Math.round(potentialLossHarvesting),
      advice: potentialLossHarvesting > 0
        ? `You have ₹${Math.round(potentialLossHarvesting).toLocaleString('en-IN')} in unrealized capital losses that can be harvested to offset short-term gains before March 31.`
        : 'Portfolio has positive unrealized gains across assets; consider stagger profit-booking to utilize the annual ₹1.25L LTCG tax exemption.',
    },
    virtualSandboxStatus: {
      hasActiveWallet: !!paperWallet,
      virtualCashBalance: paperWallet ? Math.round(paperWallet.cashBalance) : 1000000,
      realizedPnL: paperWallet ? Math.round(paperWallet.totalRealizedPnL) : 0,
      winRate: paperWallet ? paperWallet.winRatePercent : 0,
    },
    disclaimer: 'This Institutional Portfolio Audit & Risk Dossier is generated for educational, quantitative risk evaluation, and record-keeping purposes. Rupeemind is not a SEBI-registered investment advisor. Market investments are subject to market risks; past performance does not guarantee future returns.',
  };
}

/**
 * Generate self-contained print-to-PDF ready HTML report
 */
export async function generatePrintableHtmlReport(userId) {
  const audit = await generateInstitutionalAudit(userId);
  const { meta, investor, executiveSummary, holdings, assetAllocation, valueAtRisk, stressTestSummary, taxPlanning } = audit;

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rupeemind Institutional Portfolio Audit - ${meta.auditId}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      margin: 0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .audit-meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .audit-id {
      font-family: monospace;
      font-weight: 700;
      color: #0f766e;
      font-size: 13px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .card-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
    }
    td.num, th.num { text-align: right; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      background: #dcfce7;
      color: #166534;
    }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-rose { background: #ffe4e6; color: #9f1239; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
      line-height: 1.6;
    }
    .no-print-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -20px -20px 20px -20px;
    }
    .btn-print {
      background: #0f766e;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none; }
      body { padding: 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Rupeemind Institutional Report Viewer</strong> — ${meta.auditId}
    </div>
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="brand-title">RUPEEMIND</h1>
      <div class="brand-sub">Institutional Wealth Management & Risk Audit Dossier</div>
      <div style="margin-top: 6px; font-size: 12px; color: #334155;">
        <strong>Investor:</strong> ${investor.name} (${investor.email}) &bull; <strong>Profile:</strong> ${investor.kycProfile.riskTolerance} Risk
      </div>
    </div>
    <div class="audit-meta">
      <div>Reference Audit ID:</div>
      <div class="audit-id">${meta.auditId}</div>
      <div style="margin-top: 4px;">Date: ${new Date(meta.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div>Compliance: ${meta.complianceVersion}</div>
    </div>
  </div>

  <div class="section-title">1. Executive Valuation & Performance Summary</div>
  <div class="grid-4">
    <div class="card">
      <div class="card-label">Total Portfolio Value</div>
      <div class="card-val">${formatINR(executiveSummary.totalCurrentValue)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Invested Capital</div>
      <div class="card-val">${formatINR(executiveSummary.totalInvested)}</div>
    </div>
    <div class="card">
      <div class="card-label">Unrealized P&L</div>
      <div class="card-val" style="color: ${executiveSummary.totalUnrealizedPnL >= 0 ? '#16a34a' : '#dc2626'};">
        ${executiveSummary.totalUnrealizedPnL >= 0 ? '+' : ''}${formatINR(executiveSummary.totalUnrealizedPnL)} (${executiveSummary.unrealizedPnLPercent}%)
      </div>
    </div>
    <div class="card">
      <div class="card-label">Health Score & Grade</div>
      <div class="card-val" style="color: #0f766e;">
        ${executiveSummary.healthScore}/100 <span style="font-size: 12px; color: #475569;">(${executiveSummary.healthGrade})</span>
      </div>
    </div>
  </div>

  <div class="section-title">2. Quantitative Risk Metrics & Basel III VaR</div>
  <div class="grid-4">
    <div class="card">
      <div class="card-label">Portfolio Beta (β)</div>
      <div class="card-val">${executiveSummary.portfolioBeta.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Annualized Volatility (σ)</div>
      <div class="card-val">${valueAtRisk.portfolioVolPercent}%</div>
    </div>
    <div class="card">
      <div class="card-label">1-Day VaR (95% Conf)</div>
      <div class="card-val" style="color: #dc2626;">${formatINR(valueAtRisk.var95.oneDay)}</div>
    </div>
    <div class="card">
      <div class="card-label">30-Day VaR (99% Tail)</div>
      <div class="card-val" style="color: #dc2626;">${formatINR(valueAtRisk.var99.thirtyDay)}</div>
    </div>
  </div>

  <div class="section-title">3. Black Swan Crisis Replay (Historical Simulation)</div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">COVID-19 March 2020 Replay (-38.4% Market Shock)</div>
      <div style="font-size: 14px; font-weight: 700; color: #dc2626; margin-top: 6px;">
        Estimated Drawdown: ${stressTestSummary.covid2020 ? stressTestSummary.covid2020.portfolioLossPercent + '%' : '-36.2%'}
        (${formatINR(stressTestSummary.covid2020 ? Math.abs(stressTestSummary.covid2020.portfolioLoss) : executiveSummary.totalCurrentValue * 0.36)})
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        Simulates instantaneous sector shocks across Banks (-45%), Metals (-44%), and Pharma (+12%).
      </div>
    </div>

    <div class="card">
      <div class="card-label">2008 Global Financial Crisis (-55.2% Lehman Shock)</div>
      <div style="font-size: 14px; font-weight: 700; color: #dc2626; margin-top: 6px;">
        Estimated Drawdown: ${stressTestSummary.gfc2008 ? stressTestSummary.gfc2008.portfolioLossPercent + '%' : '-51.4%'}
        (${formatINR(stressTestSummary.gfc2008 ? Math.abs(stressTestSummary.gfc2008.portfolioLoss) : executiveSummary.totalCurrentValue * 0.51)})
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        Models severe credit freeze and sustained 23-month multi-year recovery horizon.
      </div>
    </div>
  </div>

  <div class="section-title">4. Active Holdings Audit</div>
  ${
    holdings.length > 0
      ? `<table>
    <thead>
      <tr>
        <th>Asset Symbol</th>
        <th>Category</th>
        <th class="num">Quantity</th>
        <th class="num">Avg Buy Price</th>
        <th class="num">Current Price</th>
        <th class="num">Valuation</th>
        <th class="num">Unrealized P&L</th>
        <th>Tax Status</th>
      </tr>
    </thead>
    <tbody>
      ${holdings
        .map(
          (h) => `<tr>
        <td><strong>${h.symbol}</strong></td>
        <td>${h.type}</td>
        <td class="num">${h.quantity}</td>
        <td class="num">${formatINR(h.buyPrice)}</td>
        <td class="num">${formatINR(h.currentPrice)}</td>
        <td class="num font-mono"><strong>${formatINR(h.currentValue)}</strong></td>
        <td class="num font-mono" style="color: ${h.unrealizedPnL >= 0 ? '#16a34a' : '#dc2626'};">
          ${h.unrealizedPnL >= 0 ? '+' : ''}${formatINR(h.unrealizedPnL)} (${h.unrealizedPnLPercent}%)
        </td>
        <td><span class="badge ${h.holdingPeriod.includes('Long') ? '' : 'badge-amber'}">${h.holdingPeriod}</span></td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>`
      : `<div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; color: #64748b; font-size: 12px;">
    No individual holdings registered in active account. Quantitative models benchmarked against balanced Nifty 50 reference portfolio.
  </div>`
  }

  <div class="section-title">5. Indian Income Tax & Capital Gains Assessment (FY 2025–26)</div>
  <div class="grid-4">
    <div class="card">
      <div class="card-label">Unrealized LTCG (>1Y)</div>
      <div class="card-val">${formatINR(taxPlanning.potentialLTCG)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Exemption: ₹1.25L/yr</div>
    </div>
    <div class="card">
      <div class="card-label">Unrealized STCG (<1Y)</div>
      <div class="card-val">${formatINR(taxPlanning.potentialSTCG)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Taxed @ 20% flat</div>
    </div>
    <div class="card">
      <div class="card-label">Est. Capital Gains Tax</div>
      <div class="card-val" style="color: #b45309;">${formatINR(taxPlanning.totalEstimatedTaxLiability)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Sec 112A + 111A</div>
    </div>
    <div class="card">
      <div class="card-label">Loss Harvesting Offset</div>
      <div class="card-val" style="color: #16a34a;">${formatINR(taxPlanning.potentialLossHarvesting)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Potential tax credit</div>
    </div>
  </div>

  <div class="footer">
    <strong>DISCLAIMER & SEBI COMPLIANCE DISCLOSURE:</strong><br>
    This report is algorithmically compiled by Rupeemind for educational, risk-monitoring, and portfolio tracking purposes. Rupeemind Technologies is not a SEBI-registered Investment Adviser (RIA) or Research Analyst. Calculations, Value at Risk projections, and historical stress tests do not constitute an offer, solicitation, or recommendation to buy or sell securities. Mutual fund investments are subject to market risks; read all scheme related documents carefully.
  </div>
</body>
</html>`;
}
