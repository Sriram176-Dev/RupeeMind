import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { getQuotes, getFunds, getNews, getWatchlist, toggleWatchlist } from '../../services/api';
import type { StockQuote, MutualFund, NewsItem } from '../../types';
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
  const { indices } = useMarket();

  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [topFunds, setTopFunds] = useState<MutualFund[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [marketTab, setMarketTab] = useState<'gainers' | 'losers'>('gainers');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [qData, fData, nData, wData] = await Promise.all([
          getQuotes(),
          getFunds({ sortBy: 'cagr3Y' }),
          getNews(),
          getWatchlist(),
        ]);
        setQuotes(qData);
        setTopFunds(fData.slice(0, 3));
        setNews(nData.slice(0, 5));
        setWatchlist(wData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
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
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Greeting & Market Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
            {todayDateStr}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2]">
            Namaste, {user?.name?.split(' ')[0] || 'Investor'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-0.5">
            Here is your financial telemetry, algorithmic market signals, and watchlist summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MarketStatusBadge />
        </div>
      </div>

      {/* ROW 1: DUAL SCORE GAUGE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Risk Score Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-[#0F766E]/40 transition-all">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Risk Tolerance Band</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              {riskBand}
            </h2>
            <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-xs leading-relaxed">
              {hasRiskScore
                ? `Mapped target asset mix: ${riskBand === 'Aggressive' ? '90%' : riskBand === 'Moderately Aggressive' ? '80%' : '70%'} Equities, balance in Debt & Arbitrage.`
                : 'Take the 2-minute financial profiling quiz to calculate your personalized risk tolerance.'}
            </p>
            <div className="pt-2">
              <Link
                to="/onboarding"
                className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{hasRiskScore ? 'Retake Risk Assessment' : 'Start Risk Assessment'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={riskScore} size={120} strokeWidth={8} label={riskBand} type="risk" />
          </div>
        </div>

        {/* Financial Health Score Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-[#0F766E]/40 transition-all">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Financial Health Status</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              {healthBand}
            </h2>
            <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-xs leading-relaxed">
              {hasHealthScore
                ? 'Savings rate and emergency liquidity are well positioned for disciplined monthly SIP compounding.'
                : 'Complete your income, savings, and expense profile to measure your financial resilience.'}
            </p>
            <div className="pt-2">
              <Link
                to="/profile"
                className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{hasHealthScore ? 'View Full Health Breakdown' : 'Complete Profile'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={healthScore} size={120} strokeWidth={8} label={healthBand} type="health" />
          </div>
        </div>

      </div>

      {/* AI PORTFOLIO STRATEGY & ANALYTICS SPOTLIGHT */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F766E]/10 via-[#4F46E5]/10 to-transparent border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI-ASSISTED INVESTING ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Live Diagnostics
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Personalized Allocation & Predictive Telemetry
          </h3>
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-xl">
            Synthesize direct plan mutual funds tailored to your portfolio holdings, or inspect real-time concentration risk and signal accuracy diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/recommendations"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Portfolio</span>
          </Link>

          <Link
            to="/analytics"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] bg-white dark:bg-[#1A222D] border border-[#E7E5DF] dark:border-[#2D3748] hover:bg-gray-50 dark:hover:bg-[#232D3C] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0F766E] dark:text-emerald-400" />
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
            className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Market</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((idx) => (
            <div
              key={idx.symbol}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-2 hover:border-[#0F766E]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#5B6572] dark:text-[#8A97A6]">{idx.name}</p>
                <PriceChangeChip change={idx.change} changePercent={idx.changePercent} size="sm" />
              </div>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                {formatINR(idx.value, false)}
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-[#5B6572] dark:text-[#8A97A6]">Day Trend</span>
                <Sparkline data={idx.sparkline} width={75} height={22} isPositive={idx.change >= 0} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Gainers / Losers Tabs */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E7E5DF] dark:border-[#1F2933] pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMarketTab('gainers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  marketTab === 'gainers'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5'
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setMarketTab('losers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  marketTab === 'losers'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    : 'text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5'
                }`}
              >
                Top Losers
              </button>
            </div>
            <span className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] hidden sm:inline">
              Live NSE Market Quotes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(marketTab === 'gainers' ? gainers : losers).map((stock) => (
              <Link
                key={stock.symbol}
                to={`/market/${stock.symbol}`}
                className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between hover:border-[#0F766E]/40 transition-all group"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-[#0B1220] dark:text-[#E8EDF2] group-hover:text-[#0F766E] dark:group-hover:text-emerald-400">
                    {stock.symbol}
                  </p>
                  <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] truncate max-w-[120px]">
                    {stock.companyName}
                  </p>
                  <p className="font-serif text-sm font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5 tabular-nums">
                    {formatINR(stock.price)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <PriceChangeChip change={stock.change} changePercent={stock.changePercent} size="sm" />
                  <Sparkline data={stock.sparkline} width={50} height={18} isPositive={stock.change >= 0} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: WATCHLIST TABLE & FUNDS FOR YOU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
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
              className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>+ Add Stocks</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={4} />
              </div>
            ) : watchlistQuotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
                No stocks in your watchlist yet. Explore the market and click the star icon to track symbols.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF7] dark:bg-[#0B0F14] border-b border-[#E7E5DF] dark:border-[#1F2933] text-[#5B6572] dark:text-[#8A97A6]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Symbol</th>
                      <th className="py-3 px-4 font-semibold text-right">Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Day %</th>
                      <th className="py-3 px-4 font-semibold text-center">Algorithmic Signal</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5DF] dark:divide-[#1F2933]">
                    {watchlistQuotes.map((stk) => (
                      <tr
                        key={stk.symbol}
                        onClick={() => window.location.href = `/market/${stk.symbol}`}
                        className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-[#0B1220] dark:text-[#E8EDF2]">{stk.symbol}</p>
                          <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] truncate max-w-[140px]">{stk.companyName}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                          {formatINR(stk.price)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <PriceChangeChip change={stk.change} changePercent={stk.changePercent} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <SignalBadge
                            signal={stk.changePercent >= 1.0 ? 'BUY' : stk.changePercent <= -1.0 ? 'SELL' : 'HOLD'}
                            showStrength={false}
                            size="sm"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={(e) => handleToggleWatchlist(stk.symbol, e)}
                            className="p-1 rounded-md text-amber-500 hover:bg-black/5 dark:hover:bg-white/5"
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

          <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5B6572] dark:text-[#8A97A6]">Standard 12% CAGR Model</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E6F4F1] dark:bg-emerald-950 text-[#0F766E] dark:text-emerald-300 font-semibold">
                Direct Growth
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#5B6572] dark:text-[#8A97A6]">₹10,000 / mo for 15 Yrs</p>
                  <p className="font-serif text-2xl font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">₹50.46 Lakhs</p>
                </div>
                <span className="text-xs text-[#5B6572] dark:text-[#8A97A6]">Invested: ₹18.0 L</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#5B6572] dark:text-[#8A97A6]">₹25,000 / mo for 15 Yrs</p>
                  <p className="font-serif text-2xl font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">₹1.26 Crores</p>
                </div>
                <span className="text-xs text-[#5B6572] dark:text-[#8A97A6]">Invested: ₹45.0 L</span>
              </div>
            </div>

            <Link
              to="/calculators"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Calculator className="w-4 h-4" />
              <span>Customize Step-Up & Goal Calculations</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ROW 4: FUNDS FOR YOU & LATEST NEWS */}
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
            className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Explore all funds</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topFunds.map((fund) => (
              <FundCard key={fund.code} fund={fund} showCompareOption={false} />
            ))}
          </div>
        )}
      </div>

      {/* Latest Market News Strip */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E5DF] dark:border-[#1F2933] pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#0F766E] dark:text-emerald-400" />
            <h2 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              Latest Financial News
            </h2>
          </div>
          <Link
            to="/news"
            className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline"
          >
            All News
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#5B6572] dark:text-[#8A97A6] mb-1.5">
                  <span className="font-semibold text-[#0F766E] dark:text-emerald-400 uppercase">{item.category}</span>
                  <span>{item.timeAgo}</span>
                </div>
                <h3 className="font-serif text-sm font-bold text-[#0B1220] dark:text-[#E8EDF2] line-clamp-2 mb-1">
                  {item.headline}
                </h3>
                <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] line-clamp-2">
                  {item.summary}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E7E5DF] dark:border-[#1F2933] text-[11px] font-semibold text-[#5B6572] dark:text-[#8A97A6]">
                Source: {item.source}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
