import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  Wallet,
  Receipt,
  Scale,
  BarChart3,
  Target,
  Calculator,
  Newspaper,
  Sparkles,
  Bot,
  Sliders,
  HeartPulse,
  Bell,
  UploadCloud,
  ShieldCheck,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FeatureItem {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
  category: 'invest' | 'portfolio' | 'calculators' | 'quant';
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isCopilot?: boolean;
}

export const ALL_FEATURES: FeatureItem[] = [
  // ── 1. Invest & Trade ─────────────────────────────────────────
  {
    id: 'stocks',
    name: 'Stock Market & Signals',
    badge: 'Live NSE',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Live quotes, technical charts & algorithmic Buy/Hold/Sell signals for top Indian stocks.',
    category: 'invest',
    icon: TrendingUp,
    path: '/markets?tab=stocks',
  },
  {
    id: 'funds',
    name: 'Mutual Funds Explorer',
    badge: 'Direct Plans',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Discover top-rated direct growth schemes with lowest expense ratios and zero distributor commission.',
    category: 'invest',
    icon: PieChart,
    path: '/markets?tab=funds',
  },
  {
    id: 'paper-trading',
    name: 'Virtual Paper Trading',
    badge: '₹10L Cash',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Practice buying and selling NSE stocks in real-time with zero risk using virtual money.',
    category: 'invest',
    icon: Wallet,
    path: '/portfolio?tab=paper-trading',
  },
  {
    id: 'fund-compare',
    name: 'Mutual Fund Comparison',
    badge: 'Head-to-Head',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Compare 2 to 3 mutual funds side-by-side on 3Y/5Y CAGR, risk level, and expense ratios.',
    category: 'invest',
    icon: Scale,
    path: '/funds/compare',
  },
  {
    id: 'news',
    name: 'Market News & Macro Wire',
    badge: 'Live RSS',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Real-time financial headlines covering RBI interest rates, corporate earnings, and Indian economy.',
    category: 'invest',
    icon: Newspaper,
    path: '/markets?tab=news',
  },

  // ── 2. Portfolio & Taxes ──────────────────────────────────────
  {
    id: 'holdings',
    name: 'Portfolio Holdings & XIRR',
    badge: 'Real-time',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Track equity and mutual fund values, cash-flow weighted XIRR, and overall profit & loss in INR.',
    category: 'portfolio',
    icon: PieChart,
    path: '/portfolio?tab=holdings',
  },
  {
    id: 'import',
    name: 'Import Statement (CAS)',
    badge: 'CAMS / KFintech',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Upload your Consolidated Account Statement PDF or Excel to instantly sync all holdings and SIPs.',
    category: 'portfolio',
    icon: UploadCloud,
    path: '/portfolio/import',
  },
  {
    id: 'tax',
    name: 'Tax Harvesting (Sec 112A)',
    badge: 'Save ₹1.25L',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    desc: 'Harvest long-term capital gains tax-free up to ₹1,25,000 annually under Budget 2024 rules.',
    category: 'portfolio',
    icon: Receipt,
    path: '/portfolio?tab=tax',
  },
  {
    id: 'rebalance',
    name: 'Portfolio Rebalancer',
    badge: 'Zero-Tax Drift',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Check if your equity vs debt allocation has drifted and get a step-by-step rebalance plan.',
    category: 'portfolio',
    icon: Scale,
    path: '/portfolio?tab=rebalance',
  },
  {
    id: 'alerts',
    name: 'Price & Drift Alerts',
    badge: 'Automated',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Set triggers for stock price targets, technical signal flips (BUY/SELL), and portfolio drift.',
    category: 'portfolio',
    icon: Bell,
    path: '/portfolio?tab=alerts',
  },

  // ── 3. Calculators & Goals ────────────────────────────────────
  {
    id: 'sip-calc',
    name: 'SIP & Step-Up Planner',
    badge: 'Compounding',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Calculate how a ₹10,000 monthly SIP with a 10% annual step-up compounds into multi-crore wealth.',
    category: 'calculators',
    icon: Calculator,
    path: '/tools',
  },
  {
    id: 'goals',
    name: 'Goal & Corpus Simulator',
    badge: 'Milestones',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Plan target wealth for home down payments, children education, or early financial independence.',
    category: 'calculators',
    icon: Target,
    path: '/portfolio?tab=goals',
  },
  {
    id: 'health-check',
    name: 'Emergency & Insurance Audit',
    badge: 'Defense Score',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Evaluate 6-month emergency cash reserves, term life coverage, and comprehensive health insurance.',
    category: 'calculators',
    icon: HeartPulse,
    path: '/health-check',
  },
  {
    id: 'lumpsum-swp',
    name: 'SWP & Lumpsum Tools',
    badge: 'Tax Free Cash',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Simulate Systematic Withdrawal Plans for monthly pension-like income with low tax leakage.',
    category: 'calculators',
    icon: Calculator,
    path: '/tools',
  },

  // ── 4. AI & Quant Labs ────────────────────────────────────────
  {
    id: 'copilot',
    name: 'RupeeBot AI Copilot',
    badge: 'SEBI Grounded',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    desc: 'Ask complex tax questions, portfolio risk queries, or stock checks with cited SEBI & AMFI sources.',
    category: 'quant',
    icon: Bot,
    path: '#copilot',
    isCopilot: true,
  },
  {
    id: 'ai-picks',
    name: 'AI Quant Recommendations',
    badge: 'Factor Model',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Personalized stock and mutual fund picks synthesized from multi-factor momentum and quality models.',
    category: 'quant',
    icon: Sparkles,
    path: '/markets?tab=picks',
  },
  {
    id: 'stress-test',
    name: 'Crash Stress Test & VaR',
    badge: 'Basel III',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Replay historical crashes (2020 COVID, 2008 Lehman) on your portfolio to stress-test drawdowns.',
    category: 'quant',
    icon: BarChart3,
    path: '/portfolio?tab=analytics',
  },
  {
    id: 'backtest',
    name: 'Strategy Backtest Lab',
    badge: 'SMA & Taxes',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Simulate quantitative trading rules against historical data with realistic STCG/LTCG taxes and slippage.',
    category: 'quant',
    icon: BarChart3,
    path: '/portfolio?tab=analytics&subtab=backtest',
  },
  {
    id: 'optimizer',
    name: 'Portfolio Optimizer',
    badge: 'Max Sharpe',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Markowitz efficient frontier optimizer finding the mathematically ideal weights for your portfolio.',
    category: 'quant',
    icon: Sliders,
    path: '/portfolio?tab=analytics&subtab=optimizer',
  },
  {
    id: 'transparency',
    name: 'Model Transparency Audit',
    badge: 'Governance',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Inspect walk-forward validation matrices, rule circuit breakers, and institutional ML disclosures.',
    category: 'quant',
    icon: ShieldCheck,
    path: '/model-transparency',
  },
];

type CategoryFilter = 'all' | 'invest' | 'portfolio' | 'calculators' | 'quant';

export const FeatureDirectory: React.FC = () => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = ALL_FEATURES.filter((item) => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleItemClick = (item: FeatureItem, e: React.MouseEvent) => {
    if (item.isCopilot) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('toggle-copilot'));
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Explore All Features & Tools
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Everything in RupeeMind in one simple place. Tap any card to open the tool directly.
          </p>
        </div>

        {/* Search input for instant filtering */}
        <div className="relative w-full md:w-64 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all 18 tools..."
            className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap',
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          )}
        >
          All Tools ({ALL_FEATURES.length})
        </button>

        <button
          onClick={() => setFilter('invest')}
          className={cn(
            'px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap',
            filter === 'invest'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          )}
        >
          📈 Invest & Trade (5)
        </button>

        <button
          onClick={() => setFilter('portfolio')}
          className={cn(
            'px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap',
            filter === 'portfolio'
              ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          )}
        >
          💼 Portfolio & Tax (5)
        </button>

        <button
          onClick={() => setFilter('calculators')}
          className={cn(
            'px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap',
            filter === 'calculators'
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          )}
        >
          🧮 Calculators & Goals (4)
        </button>

        <button
          onClick={() => setFilter('quant')}
          className={cn(
            'px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap',
            filter === 'quant'
              ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          )}
        >
          🧠 AI & Quant Labs (6)
        </button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={(e) => handleItemClick(item, e)}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 group-hover:bg-emerald-50 transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border',
                        item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <span>Open tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          No features matching "{search}". Try searching for "tax", "sip", "stocks", or "trade".
        </div>
      )}
    </div>
  );
};

export default FeatureDirectory;
