import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { getQuotes, getFunds, getNews, getWatchlist, toggleWatchlist, getPortfolioNewsApi } from '../../services/api';
import type { StockQuote, MutualFund, NewsItem, PortfolioNewsItem } from '../../types';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { SignalBadge } from '../../components/ui/SignalBadge';
import { Sparkline } from '../../components/ui/Sparkline';
import { PriceChangeChip } from '../../components/ui/PriceChangeChip';
import { FundCard } from '../../components/funds/FundCard';
import { MarketStatusBadge } from '../../components/ui/MarketStatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { TableSkeleton, CardGridSkeleton } from '../../components/ui/SkeletonLoader';
import { formatINR, formatCompactINR } from '../../lib/utils';
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

      // Stream general & portfolio news asynchronously
      getNews()
        .then((nData) => setNews(nData.slice(0, 5)))
        .catch(() => {});

      getPortfolioNewsApi()
        .then((pData) => setPortfolioNews(pData.slice(0, 4)))
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

      {/* ROW 1: DUAL SCORE GAUGE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Risk Score Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-slate-300 transition-all">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Risk Tolerance Band</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {riskBand}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {hasRiskScore
                ? `Mapped target asset mix: ${riskBand === 'Aggressive' ? '90%' : riskBand === 'Moderately Aggressive' ? '80%' : '70%'} Equities, balance in Debt & Arbitrage.`
                : 'Take the 2-minute financial profiling quiz to calculate your personalized risk tolerance.'}
            </p>
            <div className="pt-1">
              <Link
                to="/onboarding"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>{hasRiskScore ? 'Retake Risk Assessment' : 'Start Risk Assessment'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={riskScore} size={110} strokeWidth={8} label={riskBand} type="risk" />
          </div>
        </div>

        {/* Financial Health Score Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-slate-300 transition-all">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Financial Health Status</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {healthBand}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {hasHealthScore
                ? 'Savings rate and emergency liquidity are well positioned for disciplined monthly SIP compounding.'
                : 'Complete your income, savings, and expense profile to measure your financial resilience.'}
            </p>
            <div className="pt-1">
              <Link
                to="/profile"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>{hasHealthScore ? 'View Full Health Breakdown' : 'Complete Profile'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={healthScore} size={110} strokeWidth={8} label={healthBand} type="health" />
          </div>
        </div>

      </div>

      {/* AI PORTFOLIO STRATEGY & ANALYTICS SPOTLIGHT */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 border-l-4 border-l-emerald-600 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Algorithmic Engine
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Live Diagnostics
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Personalized Allocation & Predictive Telemetry
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Synthesize direct plan mutual funds tailored to your portfolio holdings, or inspect real-time concentration risk and signal accuracy diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/recommendations"
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Portfolio</span>
          </Link>

          <Link
            to="/analytics"
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Diagnostics</span>
          </Link>
        </div>
      </div>

      {/* ROW 2: MARKET SNAPSHOT (4 INDEX CARDS + GAINERS/LOSERS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            eyebrow="NSE & BSE OVERVIEW"
            title="Market Pulse"
            className="mb-0"
          />
          <Link
            to="/market"
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
              to="/market"
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
              to="/calculators"
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
            to="/funds"
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
            to="/news"
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
