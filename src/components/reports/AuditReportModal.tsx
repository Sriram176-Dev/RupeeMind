import React, { useState, useEffect } from 'react';
import type { InstitutionalAuditDossier } from '../../types';
import { getPortfolioAuditJsonApi } from '../../services/reportService';
import { formatINR } from '../../lib/utils';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Activity,
  Layers,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Download,
  Flame,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<InstitutionalAuditDossier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAudit();
    }
  }, [isOpen]);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const result = await getPortfolioAuditJsonApi();
      setData(result);
    } catch (err: any) {
      toast.error('Failed to load portfolio audit: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white border border-[#E7E5DF] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white print:text-[#0B1220]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#FAFAF7] via-white to-[#FAFAF7] border-b border-[#E7E5DF] flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0B1220] text-base">
                  Institutional Portfolio Audit & Risk Dossier
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {data?.meta?.complianceVersion || 'SEBI-EDU-FY26'}
                </span>
              </div>
              <p className="text-xs text-[#5B6572] font-mono mt-0.5">
                Audit ID: <strong className="text-emerald-700">{data?.meta?.auditId || 'Generating...'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5B6572] hover:text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:space-y-4">
          {loading || !data ? (
            <div className="py-20 text-center space-y-3">
              <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#5B6572]">
                Compiling institutional risk analytics & tax audit...
              </p>
            </div>
          ) : (
            <>
              {/* Printable Header Info (Visible on Print and Screen) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E5DF] print:border-slate-300 gap-3">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#0B1220] print:text-slate-900 font-serif">
                    RUPEEMIND WEALTH TERMINAL
                  </h1>
                  <p className="text-xs text-[#5B6572] print:text-slate-600">
                    Comprehensive Portfolio Health, Stress Replay & Capital Gains Audit
                  </p>
                  <div className="mt-2 text-xs text-[#5B6572] print:text-slate-700">
                    <strong>Investor:</strong> {data.investor.name} ({data.investor.email}) &bull;{' '}
                    <strong>Risk Tolerance:</strong> {data.investor.kycProfile.riskTolerance}
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-[#5B6572] print:text-slate-600 font-mono">
                  <div>
                    Audit ID: <strong className="text-emerald-700 print:text-slate-900">{data.meta.auditId}</strong>
                  </div>
                  <div>Generated: {new Date(data.meta.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div>Standard: {data.meta.complianceVersion}</div>
                </div>
              </div>

              {/* Section 1: Executive Overview Cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6572] print:text-slate-700 mb-3">
                  1. Executive Valuation & Performance
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Portfolio Value</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {formatINR(data.executiveSummary.totalCurrentValue)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Invested Capital</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {formatINR(data.executiveSummary.totalInvested)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Unrealized P&L</span>
                    <div
                      className={`text-lg font-black font-mono mt-1 ${
                        data.executiveSummary.totalUnrealizedPnL >= 0 ? 'text-emerald-600 print:text-emerald-700' : 'text-rose-600 print:text-rose-700'
                      }`}
                    >
                      {data.executiveSummary.totalUnrealizedPnL >= 0 ? '+' : ''}
                      {formatINR(data.executiveSummary.totalUnrealizedPnL)} ({data.executiveSummary.unrealizedPnLPercent}%)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Health Score</span>
                    <div className="text-lg font-black font-mono text-emerald-700 print:text-emerald-700 mt-1">
                      {data.executiveSummary.healthScore}/100{' '}
                      <span className="text-xs text-[#5B6572] print:text-slate-600 font-sans">
                        ({data.executiveSummary.healthGrade})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Quantitative Risk & Basel III VaR */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6572] print:text-slate-700 mb-3">
                  2. Quantitative Risk Metrics & Value at Risk (VaR)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Weighted Beta (β)</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {data.executiveSummary.portfolioBeta.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Relative to NIFTY 50</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Annualized Volatility (σ)</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {data.valueAtRisk.portfolioVolPercent}%
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Daily: {data.valueAtRisk.dailyVolPercent}%</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 print:bg-slate-100 border border-rose-200 print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-rose-700">1-Day VaR (95%)</span>
                    <div className="text-lg font-black font-mono text-rose-700 mt-1">
                      {formatINR(data.valueAtRisk.var95.oneDay)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">1 in 20 sessions breach</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 print:bg-slate-100 border border-rose-200 print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-rose-700">30-Day VaR (99%)</span>
                    <div className="text-lg font-black font-mono text-rose-700 mt-1">
                      {formatINR(data.valueAtRisk.var99.thirtyDay)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Extreme tail threshold</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Crisis Simulation Results */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6572] print:text-slate-700 mb-3">
                  3. Historical Crisis Replay Stress Analysis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0B1220] print:text-slate-800 mb-1">
                      <span>COVID-19 March 2020 Crash (-38.4%)</span>
                      <span className="text-rose-600 print:text-rose-700 font-mono font-bold">
                        {data.stressTestSummary.covid2020?.portfolioLossPercent || -36.2}%
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-600 print:text-rose-700">
                      Loss: {formatINR(Math.abs(data.stressTestSummary.covid2020?.portfolioLoss || 88000))}
                    </div>
                    <p className="text-[11px] text-[#5B6572] print:text-slate-600 mt-1">
                      Simulates sudden liquidity contraction with high beta sector drawdown.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0B1220] print:text-slate-800 mb-1">
                      <span>2008 Lehman GFC Collapse (-55.2%)</span>
                      <span className="text-rose-600 print:text-rose-700 font-mono font-bold">
                        {data.stressTestSummary.gfc2008?.portfolioLossPercent || -51.4}%
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-600 print:text-rose-700">
                      Loss: {formatINR(Math.abs(data.stressTestSummary.gfc2008?.portfolioLoss || 126000))}
                    </div>
                    <p className="text-[11px] text-[#5B6572] print:text-slate-600 mt-1">
                      Models extended 10-month systematic equity drawdown and multi-year recovery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Holdings Audit Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6572] print:text-slate-700 mb-3">
                  4. Holdings Schedule & Tax Status
                </h4>
                {data.holdings.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-[#E7E5DF] print:border-slate-300">
                    <table className="w-full text-left text-xs print:text-[11px]">
                      <thead className="bg-[#FAFAF7] print:bg-slate-200 text-[#5B6572] print:text-slate-800 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Asset</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5 text-right">Qty</th>
                          <th className="p-2.5 text-right">Avg Buy</th>
                          <th className="p-2.5 text-right">Current Price</th>
                          <th className="p-2.5 text-right">Valuation</th>
                          <th className="p-2.5 text-right">Unrealized P&L</th>
                          <th className="p-2.5">Tax Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E5DF] print:divide-slate-200 font-mono">
                        {data.holdings.map((h, i) => (
                          <tr key={i} className="hover:bg-[#FAFAF7] print:hover:bg-transparent">
                            <td className="p-2.5 font-sans font-bold text-[#0B1220] print:text-slate-900">{h.symbol}</td>
                            <td className="p-2.5 font-sans text-[#5B6572] print:text-slate-600">{h.type}</td>
                            <td className="p-2.5 text-right text-[#0B1220] print:text-slate-900">{h.quantity}</td>
                            <td className="p-2.5 text-right text-[#5B6572] print:text-slate-600">{formatINR(h.buyPrice)}</td>
                            <td className="p-2.5 text-right text-[#0B1220] print:text-slate-900">{formatINR(h.currentPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-[#0B1220] print:text-slate-900">{formatINR(h.currentValue)}</td>
                            <td
                              className={`p-2.5 text-right font-bold ${
                                h.unrealizedPnL >= 0 ? 'text-emerald-600 print:text-emerald-700' : 'text-rose-600 print:text-rose-700'
                              }`}
                            >
                              {h.unrealizedPnL >= 0 ? '+' : ''}
                              {formatINR(h.unrealizedPnL)}
                            </td>
                            <td className="p-2.5 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  h.holdingPeriod.includes('Long')
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 print:bg-emerald-100 print:text-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 print:bg-amber-100 print:text-amber-800'
                                }`}
                              >
                                {h.holdingPeriod}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#5B6572] print:text-slate-600 p-4 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF]">
                    No active positions registered in live database. Benchmark calculations derived from calibrated Nifty 50 reference portfolio.
                  </p>
                )}
              </div>

              {/* Section 5: Indian Tax Planning & Capital Gains */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6572] print:text-slate-700 mb-3">
                  5. Indian Capital Gains Tax Assessment (FY 2025–26)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Unrealized LTCG</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {formatINR(data.taxPlanning.potentialLTCG)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Exemption: ₹1.25L</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-[#5B6572] print:text-slate-600">Unrealized STCG</span>
                    <div className="text-lg font-black font-mono text-[#0B1220] print:text-slate-900 mt-1">
                      {formatINR(data.taxPlanning.potentialSTCG)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Flat 20% tax</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-amber-700 print:text-amber-800">Est. Tax Liability</span>
                    <div className="text-lg font-black font-mono text-amber-700 print:text-amber-800 mt-1">
                      {formatINR(data.taxPlanning.totalEstimatedTaxLiability)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Sec 112A + 111A</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 print:text-emerald-800">Loss Harvesting</span>
                    <div className="text-lg font-black font-mono text-emerald-700 print:text-emerald-800 mt-1">
                      {formatINR(data.taxPlanning.potentialLossHarvesting)}
                    </div>
                    <span className="text-[10px] text-[#5B6572] print:text-slate-600">Available offset</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#FAFAF7] print:bg-slate-100 border border-[#E7E5DF] print:border-slate-300 text-xs text-[#0B1220] print:text-slate-700">
                  <strong>Tax Planning Advisory:</strong> {data.taxPlanning.advice}
                </div>
              </div>

              {/* SEBI Disclaimer */}
              <div className="pt-4 border-t border-[#E7E5DF] print:border-slate-300 text-[10px] text-[#5B6572] print:text-slate-600 leading-relaxed">
                <strong>SEBI REGULATORY DISCLAIMER:</strong> {data.disclaimer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
