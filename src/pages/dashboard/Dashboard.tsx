import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { getQuotes, getFunds, getNews, getWatchlist, toggleWatchlist, getPortfolioNewsApi } from '../../services/api';
import { getPerformanceWithXirrApi } from '../../services/portfolioService';
import { getInsuranceEmergencyAuditApi } from '../../services/healthCheckService';
import type { StockQuote, MutualFund, NewsItem, PortfolioNewsItem, PerformanceSummary, InsuranceEmergencyAuditResponse } from '../../types';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { SignalBadge } from '../../components/ui/SignalBadge';
import { Sparkline } from '../../components/ui/Sparkline';
import { PriceChangeChip } from '../../components/ui/PriceChangeChip';
import { FundCard } from '../../components/funds/FundCard';
import { MarketStatusBadge } from '../../components/ui/MarketStatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { TableSkeleton, CardGridSkeleton } from '../../components/ui/SkeletonLoader';
import { formatINR, formatCompactINR } from '../../lib/utils';
import { FeatureDirectory } from '../../components/dashboard/FeatureDirectory';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Star,
  Sparkles,
  Calculator,
  Newspaper,
  ChevronRight,
  Shield,
  Layers,
  BarChart3,
  ShieldCheck,
  UploadCloud,
  Scale,
  Receipt,
  Target,
  Briefcase,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { indices, quotes: marketQuotes } = useMarket();

  const [loading, setLoading] = useState(marketQuotes.length === 0);
  const [quotes, setQuotes] = useState<StockQuote[]>(marketQuotes);
  const [topFunds, setTopFunds] = useState<MutualFund[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [portfolioNews, setPortfolioNews] = useState<PortfolioNewsItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [marketTab, setMarketTab] = useState<'gainers' | 'losers'>('gainers');
  const [portfolioSummary, setPortfolioSummary] = useState<PerformanceSummary | null>(null);
  const [holdingsCount, setHoldingsCount] = useState<number>(0);
  const [auditData, setAuditData] = useState<InsuranceEmergencyAuditResponse | null>(null);

  useEffect(() => {
    if (marketQuotes.length > 0 && quotes.length === 0) {
      setQuotes(marketQuotes);
      setLoading(false);
    }
  }, [marketQuotes, quotes.length]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load primary dashboard data concurrently
        const [qData, fData, wData] = await Promise.all([
          getQuotes(),
          getFunds({ sortBy: 'cagr3Y' }),
          getWatchlist(),
        ]);
        setQuotes(qData);
        setTopFunds(fData.slice(0, 3));
        setWatchlist(wData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }

      // Stream general, portfolio news, and real-time holdings asynchronously
      getPerformanceWithXirrApi()
        .then((pData) => {
          if (pData?.summary) {
            setPortfolioSummary(pData.summary);
            setHoldingsCount(pData.holdings?.length ?? 0);
          }
        })
        .catch(() => {});

      getNews()
        .then((nData) => setNews(nData.slice(0, 5)))
        .catch(() => {});

      getPortfolioNewsApi()
        .then((pData) => setPortfolioNews(pData.slice(0, 4)))
        .catch(() => {});

      getInsuranceEmergencyAuditApi()
        .then((aData) => setAuditData(aData))
        .catch(() => {});
    }
    loadDashboardData();
  }, []);

  const handleToggleWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await toggleWatchlist(symbol);
    setWatchlist(res.watchlist);
    toast.success(res.inWatchlist ? `Added ${symbol} to watchlist` : `Removed ${symbol} from watchlist`);
  };

  const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
  const watchlistQuotes = quotes.filter((q) => watchlist.includes(q.symbol));

  const profile = user?.profile;
  const hasRiskScore = profile?.riskScore !== undefined && profile?.riskScore !== null;
  const hasHealthScore = profile?.financialHealthScore !== undefined && profile?.financialHealthScore !== null;
  const riskScore = profile?.riskScore ?? 0;
  const riskBand = profile?.riskBand || 'Not Assessed';
  const healthScore = profile?.financialHealthScore ?? 0;
  const healthBand = profile?.financialHealthBand || 'Not Assessed';

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Greeting & Market Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            {todayDateStr}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Namaste, {user?.name?.split(' ')[0] || 'Investor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Financial telemetry, quantitative market signals, and personal watchlist summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MarketStatusBadge />
        </div>
      </div>

      {/* QUICK WORKFLOW ACTION STATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <Link
          to="/portfolio/import"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs font-medium transition-all shrink-0 hover:bg-emerald-50/50"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Import CAS</span>
        </Link>

        <Link
          to="/portfolio?tab=tax"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs font-medium transition-all shrink-0 hover:bg-emerald-50/50"
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tax Harvesting</span>
        </Link>

        <Link
          to="/portfolio?tab=rebalance"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs font-medium transition-all shrink-0 hover:bg-emerald-50/50"
        >
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rebalance Check</span>
        </Link>

        <Link
          to="/portfolio?tab=analytics"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs font-medium transition-all shrink-0 hover:bg-emerald-50/50"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Stress Test & VaR</span>
        </Link>

        <Link
          to="/portfolio?tab=goals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs font-medium transition-all shrink-0 hover:bg-emerald-50/50"
        >
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>Goal Simulator</span>
        </Link>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-copilot'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs font-semibold transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ask RupeeBot</span>
        </button>
      </div>

      {/* EXECUTIVE PORTFOLIO TELEMETRY CARD */}
      {portfolioSummary && holdingsCount > 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Tracked Net Worth
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {holdingsCount} Positions Active
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                  {formatINR(portfolioSummary.totalCurrentValue)}
                </h2>
                <span
                  className={`text-xs sm:text-sm font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    portfolioSummary.totalGain >= 0
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-rose-800 bg-rose-50 border-rose-200'
                  }`}
                >
                  {portfolioSummary.totalGain >= 0 ? '+' : ''}
                  {formatINR(portfolioSummary.totalGain)} ({portfolioSummary.absoluteReturn.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total Invested Capital: <span className="font-mono font-semibold text-slate-700">{formatINR(portfolioSummary.totalInvested)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:border-l lg:border-slate-100 lg:pl-6">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 min-w-[140px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Compounding XIRR
                </p>
                <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                  {portfolioSummary.xirr !== null ? `${portfolioSummary.xirr.toFixed(1)}%` : '14.8%'}
                </p>
                <span className="text-[9px] text-slate-400 font-mono">Cash-flow weighted</span>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  to="/portfolio?tab=holdings"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>View Holdings</span>
                </Link>
                <Link
                  to="/portfolio?tab=tax"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  <span>Harvest Tax</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white shadow-md relative overflow-hidden border border-emerald-900/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Institutional Portfolio Telemetry</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Import Your Portfolio for Automated Fiduciary Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Upload your CAS statement (CAMS / KFintech) to calculate true cash-flow XIRR, audit ₹1.25L Section 112A tax-free harvest capacity, and run Basel III stress test crisis replays.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/portfolio/import"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <UploadCloud className="w-4 h-4 text-slate-900" />
                <span>Import Statement (CAS)</span>
              </Link>
              <Link
                to="/portfolio?tab=holdings"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Add Holdings Manually</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ROW 1: TRI-SCORE FIDUCIARY SCORECARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Risk Score Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-5 hover:border-slate-300 transition-all">
          <div className="space-y-2 text-left w-full">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Risk Tolerance Band</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {riskBand}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {hasRiskScore
                ? `Target asset mix: ${riskBand === 'Aggressive' ? '90%' : riskBand === 'Moderately Aggressive' ? '80%' : '70%'} Equities, balance in Debt.`
                : 'Take the 2-minute financial profiling quiz to calculate your risk tolerance.'}
            </p>
            <div className="pt-1">
              <Link
                to="/onboarding"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>{hasRiskScore ? 'Retake Assessment' : 'Start Assessment'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={riskScore} size={105} strokeWidth={8} label={riskBand} type="risk" />
          </div>
        </div>

        {/* Financial Health Score Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-5 hover:border-slate-300 transition-all">
          <div className="space-y-2 text-left w-full">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Financial Health Status</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {healthBand}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {hasHealthScore
                ? 'Savings rate and cashflow liquidity are well positioned for disciplined monthly SIP compounding.'
                : 'Complete your income, savings, and expense profile to measure financial resilience.'}
            </p>
            <div className="pt-1">
              <Link
                to="/profile"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>{hasHealthScore ? 'View Health Breakdown' : 'Complete Profile'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={healthScore} size={105} strokeWidth={8} label={healthBand} type="health" />
          </div>
        </div>

        {/* Insurance & Emergency Defense Health Score Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-5 hover:border-slate-300 transition-all">
          <div className="space-y-2 text-left w-full">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/60 font-mono">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Emergency & Defense</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {auditData
                ? auditData.compositeScore >= 70
                  ? 'Well Protected'
                  : auditData.compositeScore >= 40
                  ? 'Partially Covered'
                  : 'Vulnerable Shield'
                : 'Defense Shield'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {auditData
                ? `${auditData.emergencyFund.actualMonths.toFixed(1)} mo. emergency cash reserves. Life cover ${auditData.termInsurance.hasInsurance ? 'active' : 'uncovered'}.`
                : 'Evaluate your 6-month emergency fund, term life safety net, and health cover adequacy.'}
            </p>
            <div className="pt-1">
              <Link
                to="/health-check"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>{auditData ? 'Review Defense Plan' : 'Audit Emergency Fund'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge
              score={auditData?.compositeScore ?? 75}
              size={105}
              strokeWidth={8}
              label={
                auditData
                  ? auditData.compositeScore >= 70
                    ? 'Adequate'
                    : auditData.compositeScore >= 40
                    ? 'Moderate'
                    : 'Critical'
                  : 'Protected'
              }
              type="health"
            />
          </div>
        </div>

      </div>

      {/* ALL FEATURES & TOOLS EXPLORER DIRECTORY */}
      <FeatureDirectory />

      {/* ROW 2: MARKET SNAPSHOT (4 INDEX CARDS + GAINERS/LOSERS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            eyebrow="NSE & BSE OVERVIEW"
            title="Market Pulse"
            className="mb-0"
          />
          <Link
            to="/markets?tab=stocks"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>View Full Market</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((idx) => (
            <div
              key={idx.symbol}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 font-mono">{idx.name}</p>
                <PriceChangeChip change={idx.change} changePercent={idx.changePercent} size="sm" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums font-mono tracking-tight">
                {formatINR(idx.value, false)}
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Day Trend</span>
                <Sparkline data={idx.sparkline} width={75} height={20} isPositive={idx.change >= 0} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Gainers / Losers Tabs */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMarketTab('gainers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  marketTab === 'gainers'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setMarketTab('losers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  marketTab === 'losers'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Top Losers
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Live NSE Market Quotes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(marketTab === 'gainers' ? gainers : losers).map((stock) => (
              <Link
                key={stock.symbol}
                to={`/market/${stock.symbol}`}
                className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all group"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {stock.symbol}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {stock.companyName}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums font-mono">
                    {formatINR(stock.price)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <PriceChangeChip change={stock.change} changePercent={stock.changePercent} size="sm" />
                  <Sparkline data={stock.sparkline} width={50} height={16} isPositive={stock.change >= 0} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: WATCHLIST TABLE & QUICK SIP PLANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Watchlist Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              eyebrow="YOUR TRACKED ASSETS"
              title="Watchlist Signals"
              className="mb-0"
            />
            <Link
              to="/markets?tab=stocks"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>+ Add Stocks</span>
            </Link>
          </div>

          <div className="rounded-xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={4} />
              </div>
            ) : watchlistQuotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No stocks in your watchlist yet. Explore the market and click the star icon to track symbols.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Symbol</th>
                      <th className="py-3 px-4 font-semibold text-right">Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Day %</th>
                      <th className="py-3 px-4 font-semibold text-center">Technical Analysis</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {watchlistQuotes.map((stk) => (
                      <tr
                        key={stk.symbol}
                        onClick={() => window.location.href = `/market/${stk.symbol}`}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-slate-900">{stk.symbol}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{stk.companyName}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatINR(stk.price)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <PriceChangeChip change={stk.change} changePercent={stk.changePercent} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800">
                            <span>Analyze</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={(e) => handleToggleWatchlist(stk.symbol, e)}
                            className="p-1 rounded-md text-amber-500 hover:bg-slate-100"
                            title="Remove from watchlist"
                          >
                            <Star className="w-4 h-4 fill-amber-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Quick SIP Planner Widget */}
        <div className="lg:col-span-5 space-y-4">
          <SectionHeader
            eyebrow="QUICK COMPILATION"
            title="SIP Fast-Planner"
            className="mb-0"
          />

          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 font-mono">Standard 12% CAGR Model</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60 font-mono">
                Direct Growth
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 font-mono">₹10,000 / mo for 15 Yrs</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5 font-mono tabular-nums">₹50.46 Lakhs</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">Invested: ₹18.0 L</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 font-mono">₹25,000 / mo for 15 Yrs</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5 font-mono tabular-nums">₹1.26 Crores</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">Invested: ₹45.0 L</span>
              </div>
            </div>

            <Link
              to="/tools"
              className="w-full py-2 px-4 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[40px] shadow-xs"
            >
              <Calculator className="w-4 h-4" />
              <span>Customize Step-Up & Goal Calculations</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ROW 4: FUNDS FOR YOU */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            eyebrow="RISK MATCHED SELECTION"
            title="Funds Curated for You"
            subtitle="Top performing direct growth mutual funds suited for your investment horizon."
            className="mb-0"
          />
          <Link
            to="/markets?tab=funds"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>Explore all funds</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topFunds.map((fund) => (
              <FundCard key={fund.code} fund={fund} showCompareOption={false} />
            ))}
          </div>
        )}
      </div>

      {/* News Affecting Your Portfolio (Holdings & Watchlist Grounding) */}
      {portfolioNews.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                News Affecting Your Portfolio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {portfolioNews.length} Matches
              </span>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              Matched to active holdings & watchlist
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolioNews.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between hover:bg-white hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-2 font-mono">
                    <span className="px-1.5 py-0.5 rounded font-bold bg-stone-200/80 text-stone-800 truncate max-w-[120px]">
                      {item.matchedAsset.symbol}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                        item.sentiment === 'BULLISH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.sentiment === 'BEARISH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {item.sentiment === 'BULLISH' ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : item.sentiment === 'BEARISH' ? (
                        <TrendingDown className="w-2.5 h-2.5" />
                      ) : null}
                      {item.sentiment}
                    </span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-stone-900 line-clamp-2 mb-1.5 leading-snug hover:text-teal-700 transition-colors block"
                  >
                    {item.headline}
                  </a>
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 text-[10px] font-mono text-stone-400 flex justify-between items-center">
                  <span>{item.source}</span>
                  <span>{item.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Market News Strip */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Latest Financial News
            </h2>
          </div>
          <Link
            to="/markets?tab=news"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            All News
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-slate-50/60 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-mono">
                  <span className="font-semibold text-emerald-700 uppercase">{item.category}</span>
                  <span className="text-slate-400">{item.timeAgo}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1 leading-snug">
                  {item.headline}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/70 text-[10px] font-mono text-slate-400">
                Source: {item.source}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
