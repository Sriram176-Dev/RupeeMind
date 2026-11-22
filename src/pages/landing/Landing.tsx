import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { calculateSIP } from '../../lib/calculators';
import { formatINR, formatCompactINR, formatPercent } from '../../lib/utils';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { SignalBadge } from '../../components/ui/SignalBadge';
import { Sparkline } from '../../components/ui/Sparkline';
import { PriceChangeChip } from '../../components/ui/PriceChangeChip';
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Calculator,
  PieChart,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  Compass,
  Layers,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { indices } = useMarket();

  // Mini SIP calculator state for teaser
  const [teaserSIP, setTeaserSIP] = useState(15000);
  const [teaserYears, setTeaserYears] = useState(10);
  const [teaserRate] = useState(12);

  const teaserResult = calculateSIP(teaserSIP, teaserRate, teaserYears);

  const steps = [
    {
      step: '01',
      title: 'Complete Profile Questionnaire',
      desc: 'Answer a simple 5-step risk, cash flow, and goal evaluation designed specifically for Indian investors.',
      icon: Compass,
    },
    {
      step: '02',
      title: 'Get Dual Financial Scores',
      desc: 'Discover your Risk Score (0-100) and Financial Health Score with tailored behavioral improvement tips.',
      icon: Zap,
    },
    {
      step: '03',
      title: 'See Matched Direct Funds',
      desc: 'Our engine generates an optimal asset-allocation split (Large Cap, Flexi, Midcap, Debt) matched to your goal horizon.',
      icon: PieChart,
    },
    {
      step: '04',
      title: 'Track Signals & Compounding',
      desc: 'Monitor algorithmic Buy/Sell/Hold signals on top 20 NSE stocks and track automated monthly SIP progress.',
      icon: TrendingUp,
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Live Market & NSE 50',
      desc: 'Track live Nifty 50 constituents, sector performance, 52-week ranges, and real-time IST market status.',
      link: '/markets?tab=stocks',
    },
    {
      icon: Zap,
      title: 'Smart Algorithmic Signals',
      desc: 'Technical indicator synthesis (RSI, MACD, Moving Averages, Bollinger) boiled down to plain-English reasons.',
      link: '/markets?tab=stocks',
    },
    {
      icon: Sparkles,
      title: 'Algorithmic Fund Matching',
      desc: 'AI-assisted fund recommendation engine mapping Direct Growth mutual funds to your risk profile & tax goals.',
      link: '/markets?tab=picks',
    },
    {
      icon: Calculator,
      title: 'Compounding Calculators',
      desc: 'SIP, Step-Up SIP, Goal Planner, Lumpsum, and Inflation-adjusted calculators with year-by-year projections.',
      link: '/tools',
    },
    {
      icon: Newspaper,
      title: 'Curated Financial News',
      desc: 'Stay informed with macro updates on RBI monetary policy, corporate earnings, and Indian economy indicators.',
      link: '/markets?tab=news',
    },
    {
      icon: Layers,
      title: 'Portfolio & SIP Tracker',
      desc: 'Simulate stock and mutual fund holdings, compute unrealized P&L in INR, and track active SIP milestones.',
      link: '/portfolio',
    },
  ];

  const trustPoints = [
    {
      title: 'Transparent Signals with Reasons',
      desc: 'Every Buy, Sell, or Hold signal comes with 3-5 concrete technical reasons (RSI levels, DMA crossovers, volume momentum). No black box mystery.',
    },
    {
      title: 'Zero Hidden Fees or Biases',
      desc: 'We promote zero-commission Direct Growth mutual fund plans and pure educational clarity so you retain 100% of your compounding gains.',
    },
    {
      title: 'Education-First Approach',
      desc: 'Built to cultivate disciplined long-term investing habits, risk-budgeting, emergency fund resilience, and goal-driven portfolio allocation.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>FINANCIAL INTELLIGENCE FOR INDIA</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]">
                Invest with clarity, <br className="hidden sm:inline" />
                <span className="text-emerald-700">not guesswork.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-[55ch] leading-relaxed">
                A modern Indian investment intelligence platform blending transparent quantitative stock signals, risk-matched mutual fund allocation, and mathematical compounding tools.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/onboarding'}
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs hover:shadow flex items-center justify-center gap-2"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/market"
                  className="px-6 py-3 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Explore Market</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>NSE & BSE Universe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Direct Growth Plans</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transparent Formulations</span>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xl space-y-3.5">
                
                {/* Live Index Market Pulse Card */}
                {indices.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">Live Indian Benchmark</span>
                        <p className="text-sm font-bold text-slate-900">{indices[0].name}</p>
                        <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                          {formatINR(indices[0].value, false)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <PriceChangeChip change={indices[0].change} changePercent={indices[0].changePercent} size="sm" />
                        <Sparkline data={indices[0].sparkline} width={75} height={20} isPositive={indices[0].change >= 0} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Algorithmic Profiling Preview Card */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">Quantitative Engine</span>
                    <p className="text-sm font-bold text-slate-900">Target Asset Allocation</p>
                    <p className="text-[11px] text-slate-500 font-mono">Equities • Debt • Gold Split</p>
                  </div>
                  <div className="w-20">
                    <ScoreGauge score={teaserResult ? 70 : 50} size={76} strokeWidth={6} label="Target" type="risk" />
                  </div>
                </div>

                {/* Real Dynamic SIP Compounding Teaser Card */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 font-mono">{teaserYears}-Yr Compounding Goal</span>
                    <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{formatCompactINR(teaserResult.totalValue)}</p>
                    <p className="text-[11px] text-slate-500 font-mono">on {formatINR(teaserSIP, false)} / mo</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      +{formatCompactINR(teaserResult.estimatedReturns)} gains
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      at 12% annual CAGR
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. AUTO-SCROLLING LIVE INDICES TICKER STRIP */}
      <section className="bg-slate-50 border-b border-slate-200 overflow-hidden py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Market Ticker
          </span>
          <span>NSE / BSE Real-Time Signals</span>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar py-1 gap-4">
          <div className="animate-marquee flex items-center gap-4 pl-4">
            {indices.concat(indices).map((idx, i) => (
              <div
                key={`${idx.symbol}-${i}`}
                className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs shrink-0"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 leading-tight">
                    {idx.name}
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    {formatINR(idx.value, false)}
                  </p>
                </div>
                <PriceChangeChip change={idx.change} changePercent={idx.changePercent} size="sm" />
                <Sparkline data={idx.sparkline} width={55} height={18} isPositive={idx.change >= 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (4 Numbered Steps) */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono">
            Scientific Workflow
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How Rupee Mind Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Four systematic steps to transform financial ambiguity into clear, disciplined execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xl font-bold text-emerald-700">
                      {s.step}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURE GRID (6 Cards) */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono">
              Integrated Suite
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Complete Toolkit for the Indian Investor
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Everything you need to analyze stocks, discover direct mutual funds, plan SIPs, and track your wealth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.title}
                  to={f.link}
                  className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3.5 border border-emerald-200/60">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-emerald-700 transition-colors tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-emerald-700 gap-1">
                    <span>Explore feature</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE MINI SIP CALCULATOR TEASER */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Sliders */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono mb-1">
                  Interactive Simulator
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  The Power of Monthly SIP Compounding
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust monthly investment and time horizon to see estimated corpus growth at 12% expected annual CAGR.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="font-medium text-slate-700">Monthly Investment</span>
                    <span className="font-bold text-emerald-700">
                      {formatINR(teaserSIP, false)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={teaserSIP}
                    onChange={(e) => setTeaserSIP(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="font-medium text-slate-700">Time Horizon</span>
                    <span className="font-bold text-emerald-700">
                      {teaserYears} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={teaserYears}
                    onChange={(e) => setTeaserYears(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>1 Yr</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Output Card */}
            <div className="lg:col-span-6 p-6 rounded-xl bg-slate-50 border border-slate-200/90 border-l-4 border-l-emerald-600 space-y-5">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">
                  Estimated Future Value
                </span>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-emerald-700 mt-1 tabular-nums tracking-tight">
                  {formatCompactINR(teaserResult.totalValue)}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Full exact value: {formatINR(teaserResult.totalValue, false)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/70 font-mono">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Total Invested</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCompactINR(teaserResult.investedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Estimated Wealth Gain</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">
                    +{formatCompactINR(teaserResult.estimatedReturns)}
                  </p>
                </div>
              </div>

              <Link
                to="/calculators"
                className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Open Full Compounding Calculator Suite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. WHY TRUST RUPEE MIND */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono">
              Fiduciary Principles
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why Indian Investors Trust Rupee Mind
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear algorithms, transparent mathematical reasons, and zero hidden distributor kickbacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trustPoints.map((tp, idx) => (
              <div
                key={tp.title}
                className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm border border-emerald-200/60">
                  {idx + 1}
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {tp.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {tp.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-3.5 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500 font-mono">
            <p>
              🛡️ All algorithmic signals and financial calculations are provided for educational and analytical purposes. Mutual fund investments are subject to market risks.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA BAND */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white text-center">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Take command of your wealth journey today.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Join thousands of Indian investors building disciplined portfolios with algorithmic clarity and zero guesswork.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm flex items-center justify-center"
            >
              <span>{isAuthenticated ? 'Enter Dashboard' : 'Create Free Account'}</span>
            </Link>
            <Link
              to="/onboarding"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center"
            >
              <span>Take Risk Quiz</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
