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
      link: '/market',
    },
    {
      icon: Zap,
      title: 'Smart Algorithmic Signals',
      desc: 'Technical indicator synthesis (RSI, MACD, Moving Averages, Bollinger) boiled down to plain-English reasons.',
      link: '/market',
    },
    {
      icon: Sparkles,
      title: 'Algorithmic Fund Matching',
      desc: 'AI-assisted fund recommendation engine mapping Direct Growth mutual funds to your risk profile & tax goals.',
      link: '/recommendations',
    },
    {
      icon: Calculator,
      title: 'Compounding Calculators',
      desc: 'SIP, Step-Up SIP, Goal Planner, Lumpsum, and Inflation-adjusted calculators with year-by-year projections.',
      link: '/calculators',
    },
    {
      icon: Newspaper,
      title: 'Curated Financial News',
      desc: 'Stay informed with macro updates on RBI monetary policy, corporate earnings, and Indian economy indicators.',
      link: '/news',
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
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#E7E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F1] border border-emerald-500/20 text-[#0F766E] text-xs font-bold uppercase tracking-[0.08em]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SMART INVESTING FOR INDIA</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B1220] leading-[1.1]">
                Invest with clarity, <br className="hidden sm:inline" />
                <span className="text-[#0F766E] italic">not guesswork.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#5B6572] max-w-[55ch] leading-relaxed">
                A clean, modern Indian personal finance platform blending transparent algorithmic stock signals, risk-matched mutual fund allocation, and precision compounding tools.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/onboarding'}
                  className="px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/market"
                  className="px-6 py-3.5 rounded-xl text-base font-semibold text-[#0B1220] bg-white border border-[#E7E5DF] hover:bg-black/5 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                  <span>Explore Market</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#5B6572]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>NSE & BSE Top 50</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Direct Growth Funds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pure Math & Algorithmic Reasons</span>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md p-6 rounded-3xl bg-gradient-to-b from-white to-[#FAFAF7] border border-[#E7E5DF] shadow-xl space-y-4">
                
                {/* Live Index Market Pulse Card */}
                {indices.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Live Indian Benchmark</span>
                        <p className="font-serif text-base font-bold text-[#0B1220]">{indices[0].name}</p>
                        <p className="font-serif text-lg font-bold text-[#0B1220] tabular-nums mt-0.5">
                          {formatINR(indices[0].value, false)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <PriceChangeChip change={indices[0].change} changePercent={indices[0].changePercent} size="sm" />
                        <Sparkline data={indices[0].sparkline} width={75} height={24} isPositive={indices[0].change >= 0} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Algorithmic Profiling Preview Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Algorithmic Risk Engine</span>
                    <p className="font-serif text-lg font-bold text-[#0B1220]">Target Asset Allocation</p>
                    <p className="text-[11px] text-[#5B6572]">Equities • Debt • Gold Diversification</p>
                  </div>
                  <div className="w-20">
                    <ScoreGauge score={teaserResult ? 70 : 50} size={76} strokeWidth={6} label="Target" type="risk" />
                  </div>
                </div>

                {/* Real Dynamic SIP Compounding Teaser Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#5B6572]">{teaserYears}-Yr Compounding Goal</span>
                    <p className="font-serif text-xl font-bold text-[#0F766E]">{formatCompactINR(teaserResult.totalValue)}</p>
                    <p className="text-[11px] text-[#5B6572]">on {formatINR(teaserSIP, false)} / month</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      +{formatCompactINR(teaserResult.estimatedReturns)} gains
                    </span>
                    <span className="text-[10px] text-[#5B6572] block">
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
      <section className="bg-white border-b border-[#E7E5DF] overflow-hidden py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5B6572]">
          <span className="flex items-center gap-1.5 text-[#0F766E] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Market Ticker
          </span>
          <span>NSE / BSE Real-Time Signals</span>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar py-1 gap-4">
          <div className="animate-marquee flex items-center gap-6 pl-4">
            {indices.concat(indices).map((idx, i) => (
              <div
                key={`${idx.symbol}-${i}`}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] shrink-0"
              >
                <div>
                  <p className="text-xs font-bold text-[#0B1220] leading-tight">
                    {idx.name}
                  </p>
                  <p className="text-sm font-serif font-bold text-[#0B1220] tabular-nums">
                    {formatINR(idx.value, false)}
                  </p>
                </div>
                <PriceChangeChip change={idx.change} changePercent={idx.changePercent} size="sm" />
                <Sparkline data={idx.sparkline} width={60} height={20} isPositive={idx.change >= 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (4 Numbered Steps) */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
            SIMPLE, SCIENTIFIC WORKFLOW
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220]">
            How Rupee Mind Works
          </h2>
          <p className="text-sm sm:text-base text-[#5B6572]">
            Four systematic steps to transform financial ambiguity into clear, disciplined action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs flex flex-col justify-between hover:border-[#0F766E]/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl font-bold text-[#0F766E] opacity-60 group-hover:opacity-100 transition-opacity">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#0B1220] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURE GRID (6 Cards) */}
      <section className="py-16 bg-[#F4F4F0] border-y border-[#E7E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
              INTEGRATED SUITE
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220]">
              Complete Toolkit for the Indian Investor
            </h2>
            <p className="text-sm sm:text-base text-[#5B6572]">
              Everything you need to analyze stocks, discover top mutual funds, plan SIPs, and track your wealth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.title}
                  to={f.link}
                  className="p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs hover:border-[#0F766E]/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0B1220] mb-2 group-hover:text-[#0F766E] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E7E5DF] flex items-center text-xs font-semibold text-[#0F766E] gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore feature</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE MINI SIP CALCULATOR TEASER */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E7E5DF] shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Sliders */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] mb-1">
                  INTERACTIVE TEASER
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220]">
                  See the Power of SIP Compounding
                </h2>
                <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
                  Adjust monthly investment and time horizon to see estimated corpus growth at a healthy 12% expected annual CAGR.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-[#0B1220]">Monthly Investment</span>
                    <span className="font-serif text-base font-bold text-[#0F766E]">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5B6572] mt-1">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-[#0B1220]">Time Horizon</span>
                    <span className="font-serif text-base font-bold text-[#0F766E]">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5B6572] mt-1">
                    <span>1 Yr</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Output Card */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6572]">
                  Estimated Future Value
                </span>
                <p className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F766E] mt-1 tabular-nums">
                  {formatCompactINR(teaserResult.totalValue)}
                </p>
                <p className="text-xs text-[#5B6572] mt-1">
                  Full exact value: {formatINR(teaserResult.totalValue, false)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E7E5DF]">
                <div>
                  <p className="text-[11px] text-[#5B6572] uppercase">Total Invested</p>
                  <p className="font-serif text-lg font-bold text-[#0B1220]">
                    {formatCompactINR(teaserResult.investedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#5B6572] uppercase">Estimated Wealth Gain</p>
                  <p className="font-serif text-lg font-bold text-emerald-600">
                    +{formatCompactINR(teaserResult.estimatedReturns)}
                  </p>
                </div>
              </div>

              <Link
                to="/calculators"
                className="w-full py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>Open Full Compounding Calculator Suite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. WHY TRUST RUPEE MIND */}
      <section className="py-16 bg-[#F4F4F0] border-t border-[#E7E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
              BUILT ON INTEGRITY
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220]">
              Why Indian Investors Trust Rupee Mind
            </h2>
            <p className="text-sm sm:text-base text-[#5B6572]">
              Clear algorithms, transparent reasons, and zero hidden distributor kickbacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustPoints.map((tp, idx) => (
              <div
                key={tp.title}
                className="p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center font-serif font-bold text-lg">
                  {idx + 1}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#0B1220]">
                  {tp.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                  {tp.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-2xl bg-white/80 border border-[#E7E5DF] text-center text-xs text-[#5B6572]">
            <p>
              🛡️ All algorithmic signals and financial calculations are provided for educational and analytical purposes. Mutual fund investments are subject to market risks.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA BAND */}
      <section className="py-16 sm:py-20 bg-[#0F766E] text-white text-center">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Take command of your wealth journey today.
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-lg mx-auto leading-relaxed">
            Join thousands of Indian investors building disciplined portfolios with algorithmic clarity and zero guesswork.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-[#0F766E] bg-white hover:bg-emerald-50 transition-all shadow-lg min-h-[48px] flex items-center justify-center"
            >
              <span>{isAuthenticated ? 'Enter Dashboard' : 'Create Free Account'}</span>
            </Link>
            <Link
              to="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-emerald-800/80 hover:bg-emerald-800 border border-white/20 transition-all min-h-[48px] flex items-center justify-center"
            >
              <span>Take Risk Quiz</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
