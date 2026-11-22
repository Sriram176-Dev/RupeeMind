import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getPerformanceWithXirrApi } from '../../services/portfolioService';
import type { PerformanceSummary } from '../../types';
import {
  Briefcase,
  BarChart3,
  Receipt,
  Scale,
  Target,
  Bell,
  Wallet,
  Upload,
  Sliders,
  HeartPulse,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Code-split tab modules for instant hub page rendering
const Portfolio = lazy(() => import('./Portfolio').then((m) => ({ default: m.Portfolio })));
const Analytics = lazy(() => import('./Analytics').then((m) => ({ default: m.Analytics })));
const TaxReport = lazy(() => import('../tax/TaxReport').then((m) => ({ default: m.TaxReport })));
const RebalanceDashboard = lazy(() => import('../rebalance/RebalanceDashboard').then((m) => ({ default: m.RebalanceDashboard })));
const GoalDashboard = lazy(() => import('../goals/GoalDashboard').then((m) => ({ default: m.GoalDashboard })));
const AlertsManagement = lazy(() => import('../alerts/AlertsManagement').then((m) => ({ default: m.AlertsManagement })));
const PaperTrading = lazy(() => import('../trading/PaperTrading').then((m) => ({ default: m.PaperTrading })));

const TabLoadingSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
    <div className="h-16 bg-slate-100 rounded-2xl w-full border border-slate-200/60" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
    </div>
    <div className="h-64 bg-slate-100 rounded-2xl w-full border border-slate-200/60" />
  </div>
);

export type PortfolioTabKey =
  | 'holdings'
  | 'analytics'
  | 'tax'
  | 'rebalance'
  | 'goals'
  | 'alerts'
  | 'paper-trading';

export const PortfolioHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [holdingsCount, setHoldingsCount] = useState<number>(0);

  const currentTab = (searchParams.get('tab') as PortfolioTabKey) || 'holdings';

  const handleTabChange = (key: PortfolioTabKey) => {
    setSearchParams({ tab: key });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    getPerformanceWithXirrApi()
      .then((res) => {
        if (res?.summary) {
          setSummary(res.summary);
          setHoldingsCount(res.holdings?.length ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const tabs: Array<{
    key: PortfolioTabKey;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      key: 'holdings',
      label: 'Holdings & P&L',
      sublabel: 'Positions & True XIRR',
      icon: Briefcase,
      description: 'Your combined direct stocks and mutual funds with cash-flow weighted XIRR returns.',
    },
    {
      key: 'analytics',
      label: 'Risk & Stress Test',
      sublabel: 'Crash Replay & VaR',
      icon: BarChart3,
      description: 'Simulate historical market crashes (2020 COVID, 2008 Lehman) to test your portfolio drawdown resilience.',
    },
    {
      key: 'tax',
      label: 'Tax Saver',
      sublabel: 'Harvest ₹1.25L Tax Free',
      icon: Receipt,
      description: 'Audit capital gains and harvest up to ₹1,25,000 annually with zero tax under Section 112A.',
    },
    {
      key: 'rebalance',
      label: 'Rebalancer',
      sublabel: 'Fix Allocation Drift',
      icon: Scale,
      description: 'Check if your equity vs debt allocation has drifted and get a step-by-step zero-tax rebalance plan.',
    },
    {
      key: 'goals',
      label: 'Goal Simulator',
      sublabel: 'Corpus & Milestones',
      icon: Target,
      description: 'Simulate target wealth for buying a house, retirement corpus, or children higher education.',
    },
    {
      key: 'alerts',
      label: 'Price Alerts',
      sublabel: 'Triggers & Signals',
      icon: Bell,
      description: 'Automated real-time notifications when your stocks hit target prices or switch technical signals.',
    },
    {
      key: 'paper-trading',
      label: 'Virtual Trading',
      sublabel: 'Practice with ₹10L Fake Cash',
      icon: Wallet,
      description: 'Practice real-time trading on the National Stock Exchange (NSE) with zero financial risk.',
    },
  ];

  const activeTabObj = tabs.find((t) => t.key === currentTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Hub Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 sm:py-3 gap-2">
            {/* Scrollable Tab Pills */}
            <div
              className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar"
              role="tablist"
              aria-label="Portfolio sections"
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
                      'px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border',
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

            {/* Contextual Action Buttons based on active tab */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {currentTab === 'holdings' && (
                <Link
                  to="/portfolio/import"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Import Statement (CAS)</span>
                </Link>
              )}
              {currentTab === 'analytics' && (
                <>
                  <Link
                    to="/portfolio?tab=analytics&subtab=optimizer"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Optimizer</span>
                  </Link>
                  <Link
                    to="/portfolio?tab=analytics&subtab=backtest"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Backtest Lab</span>
                  </Link>
                </>
              )}
              <Link
                to="/health-check"
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1"
                title="Insurance & Emergency Defense Health Check"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden md:inline">Health Check</span>
              </Link>
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
          {currentTab === 'holdings' && <Portfolio />}
          {currentTab === 'analytics' && <Analytics />}
          {currentTab === 'tax' && <TaxReport />}
          {currentTab === 'rebalance' && <RebalanceDashboard />}
          {currentTab === 'goals' && <GoalDashboard />}
          {currentTab === 'alerts' && <AlertsManagement />}
          {currentTab === 'paper-trading' && <PaperTrading />}
        </Suspense>
      </div>
    </div>
  );
};

export default PortfolioHub;
