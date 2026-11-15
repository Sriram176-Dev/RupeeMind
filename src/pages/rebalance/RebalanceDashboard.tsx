import React, { useState, useEffect } from 'react';
import {
  Scale,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Percent,
  Sliders,
  DollarSign,
  HelpCircle,
  PiggyBank,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { getRebalancePlanApi } from '../../services/rebalanceService';
import type { RebalancePlanResponse } from '../../types';

export const RebalanceDashboard: React.FC = () => {
  const [plan, setPlan] = useState<RebalancePlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [driftThreshold, setDriftThreshold] = useState<number>(5);

  const fetchPlan = async (threshold: number) => {
    try {
      setLoading(true);
      const res = await getRebalancePlanApi(threshold);
      setPlan(res);
    } catch (err) {
      console.error('Failed to load rebalancing plan:', err);
      toast.error('Unable to compute rebalancing plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(driftThreshold);
  }, []);

  const handleThresholdChange = (val: number) => {
    setDriftThreshold(val);
    fetchPlan(val);
  };

  const formatInr = (val: number) => {
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  if (loading && !plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonLoader variant="rect" height={100} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonLoader variant="rect" height={140} />
          <SkeletonLoader variant="rect" height={140} />
          <SkeletonLoader variant="rect" height={140} />
        </div>
        <SkeletonLoader variant="rect" height={360} />
      </div>
    );
  }

  // Chart data comparing Current vs Target weights
  const chartData = [
    {
      name: 'Equity',
      Current: Number((plan?.currentAllocation.equity || 0).toFixed(1)),
      Target: Number((plan?.targetAllocation.equity || 0).toFixed(1)),
    },
    {
      name: 'Debt',
      Current: Number((plan?.currentAllocation.debt || 0).toFixed(1)),
      Target: Number((plan?.targetAllocation.debt || 0).toFixed(1)),
    },
    {
      name: 'Gold',
      Current: Number((plan?.currentAllocation.gold || 0).toFixed(1)),
      Target: Number((plan?.targetAllocation.gold || 0).toFixed(1)),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <SectionHeader
          title="Portfolio Rebalancing Engine"
          subtitle="Compare your live allocation with fiduciary targets, identify drift, and rebalance tax-efficiently."
        />

        {/* Drift Threshold Setting */}
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-xs">
          <Sliders className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-medium text-stone-600">Drift Tolerance:</span>
          <div className="flex items-center gap-1.5">
            {[3, 5, 8, 10].map((t) => (
              <button
                key={t}
                onClick={() => handleThresholdChange(t)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  driftThreshold === t
                    ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Source Badge */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>
            Target Baseline Source: <strong className="text-stone-800">{plan?.targetSource}</strong>
          </span>
        </div>
        <div>
          Total Portfolio Value: <strong className="text-stone-800 font-mono">{formatInr(plan?.portfolioValue || 0)}</strong>
        </div>
      </div>

      {/* Rebalance Status Alert */}
      {plan?.rebalanceNeeded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-900 text-sm">
              Portfolio Drift Detected ({plan.maxDrift.toFixed(1)}% vs {driftThreshold}% threshold)
            </h4>
            <p className="text-xs text-amber-800">
              One or more asset classes deviate from your strategic allocation beyond your {driftThreshold}% threshold. We recommend rebalancing to prevent unwanted risk exposure.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-emerald-900 text-sm">Portfolio Well Balanced</h4>
            <p className="text-xs text-emerald-800">
              Your current allocation is within your {driftThreshold}% drift threshold across all asset classes (maximum drift: {plan?.maxDrift.toFixed(1)}%). No urgent rebalancing trades needed.
            </p>
          </div>
        </div>
      )}

      {/* Allocation Comparison Chart & Asset Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="text-sm font-semibold text-stone-900 mb-4">Current vs Target Allocation (%)</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 12 }} />
                <YAxis unit="%" tick={{ fill: '#78716c', fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`${value}%`]} />
                <Legend />
                <Bar dataKey="Current" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Class Drift Cards */}
        <div className="lg:col-span-5 space-y-3">
          {plan?.assetClassTrades.map((trade) => {
            const isBuy = trade.action === 'BUY';
            const isSell = trade.action === 'SELL';
            return (
              <div
                key={trade.assetClass}
                className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                    {trade.assetClass}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        trade.isDriftViolated
                          ? 'bg-amber-100 text-amber-900 font-semibold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {trade.driftPercent >= 0 ? '+' : ''}
                      {trade.driftPercent.toFixed(1)}% drift
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Current: {trade.currentWeight.toFixed(1)}% ({formatInr(trade.currentValue)}) | Target: {trade.targetWeight}%
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                      isBuy
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isSell
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-stone-50 text-stone-600'
                    }`}
                  >
                    {trade.action} {formatInr(trade.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax-Free SIP Redirection Strategy (Preferred Route) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-stone-900 font-semibold text-base">
          <PiggyBank className="w-5 h-5 text-teal-700" />
          Recommended: Rebalance via Fresh SIP Inflows (Zero Capital Gains Tax)
        </div>
        <p className="text-xs text-stone-600 max-w-3xl">
          Selling assets triggers taxable events (up to 20% STCG or 12.5% LTCG). Instead of selling overweight positions, redirect your monthly savings or SIP contributions to underweight asset classes over the next{' '}
          <strong>{plan?.sipRedirectionPlan.estimatedMonthsToBalance || 6} months</strong> to naturally restore balance without incurring taxes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {plan?.sipRedirectionPlan.allocations.map((alloc, idx) => (
            <div key={idx} className="bg-stone-50 rounded-lg p-4 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900 text-sm">{alloc.assetClass} Inflow</span>
                <span className="text-sm font-bold text-teal-800 font-mono">
                  {formatInr(alloc.monthlyAmount)} / month
                </span>
              </div>
              <p className="text-xs text-stone-600">{alloc.recommendation}</p>
              <div className="text-xs font-mono text-stone-500">
                Duration: ~{alloc.monthsRequired} month(s) to accumulate {formatInr(alloc.targetAmountToAccumulate)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Execution Plan (If Selling) */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Per-Fund Rebalance Trade Proposals
          </div>
          {plan?.taxImpact?.estimatedTotalTax && plan.taxImpact.estimatedTotalTax > 0 ? (
            <span className="text-xs text-rose-700 font-medium">
              Selling proposal triggers ~{formatInr(plan.taxImpact.estimatedTotalTax)} estimated tax
            </span>
          ) : null}
        </div>

        {plan?.fundTrades && plan.fundTrades.length > 0 ? (
          <div className="divide-y divide-stone-200">
            {plan.fundTrades.map((ft, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/70 transition">
                <div className="space-y-1">
                  <div className="font-medium text-stone-900 text-sm flex items-center gap-2">
                    {ft.name}
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                      {ft.assetClass}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{ft.rationale}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                      ft.action === 'BUY'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {ft.action} {formatInr(ft.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-stone-500">
            No immediate fund rebalance sales needed.
          </div>
        )}
      </div>
    </div>
  );
};

export default RebalanceDashboard;
