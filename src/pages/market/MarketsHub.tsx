import React, { lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMarket } from '../../context/MarketContext';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Newspaper,
  Sparkles,
  Scale,
  Activity,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Code-split tab modules
const Market = lazy(() => import('./Market').then((m) => ({ default: m.Market })));
const Funds = lazy(() => import('../funds/Funds').then((m) => ({ default: m.Funds })));
const News = lazy(() => import('../news/News').then((m) => ({ default: m.News })));
const Recommendations = lazy(() => import('../recommendations/Recommendations').then((m) => ({ default: m.Recommendations })));

const TabLoadingSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
    <div className="h-16 bg-slate-100 rounded-2xl w-full border border-slate-200/60" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
    </div>
    <div className="h-64 bg-slate-100 rounded-2xl w-full border border-slate-200/60" />
  </div>
);

export type MarketsTabKey = 'stocks' | 'funds' | 'news' | 'picks';

export const MarketsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { quotes } = useMarket();

  const currentTab = (searchParams.get('tab') as MarketsTabKey) || 'stocks';

  const handleTabChange = (key: MarketsTabKey) => {
    setSearchParams({ tab: key });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Live Market Breadth calculation
  const advances = quotes.filter((q) => q.changePercent > 0).length;
  const declines = quotes.filter((q) => q.changePercent < 0).length;
  const unchanged = quotes.length - advances - declines;

  const tabs: Array<{
    key: MarketsTabKey;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      key: 'stocks',
      label: 'Stocks & Signals',
      sublabel: 'NSE/BSE Quotes & Technicals',
      icon: TrendingUp,
      description: 'Live real-time stock prices, candlestick charts, RSI, MACD, and algorithmic Buy/Hold/Sell signals.',
    },
    {
      key: 'funds',
      label: 'Mutual Funds',
      sublabel: 'AMFI Direct Growth Schemes',
      icon: PieChart,
      description: 'Discover verified zero-commission direct mutual funds with low expense ratios and historical CAGR.',
    },
    {
      key: 'news',
      label: 'Market News',
      sublabel: 'RBI Macro & Corporate Earnings',
      icon: Newspaper,
      description: 'Live financial news, macro updates on monetary policy, and sector sentiment analysis.',
    },
    {
      key: 'picks',
      label: 'AI Recommendations',
      sublabel: 'Personalized Quant Picks',
      icon: Sparkles,
      description: 'Smart stock and fund recommendations synthesized from institutional momentum and quality factor models.',
    },
  ];

  const activeTabObj = tabs.find((t) => t.key === currentTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Hub Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 sm:py-3 gap-3">
            {/* Scrollable Tab Pills */}
            <div
              className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar"
              role="tablist"
              aria-label="Markets sections"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.key)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border',
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Action / Telemetry: Market Breadth or Compare Button */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {/* Market Breadth Indicator (Advances / Declines) */}
              {quotes.length > 0 && (
                <div
                  className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono cursor-help"
                  title={`Market Breadth: ${advances} Advancing, ${declines} Declining, ${unchanged} Unchanged`}
                >
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 font-medium">BREADTH:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {advances}
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-700 font-semibold flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    {declines}
                  </span>
                </div>
              )}

              {currentTab === 'funds' && (
                <button
                  type="button"
                  onClick={() => navigate('/funds/compare')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Compare Funds</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Helpful 1-line Tab Purpose Banner */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 py-2 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="line-clamp-1">
              <strong className="font-semibold text-slate-900 mr-1">{activeTabObj.label}:</strong>
              <span>{activeTabObj.description}</span>
            </p>
          </div>
          <span className="hidden md:inline font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
            {activeTabObj.sublabel}
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="animate-in fade-in duration-150">
        <Suspense fallback={<TabLoadingSkeleton />}>
          {currentTab === 'stocks' && <Market />}
          {currentTab === 'funds' && <Funds />}
          {currentTab === 'news' && <News />}
          {currentTab === 'picks' && <Recommendations />}
        </Suspense>
      </div>
    </div>
  );
};

export default MarketsHub;
