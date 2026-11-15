import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  CheckCircle2,
  Sliders,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { getPortfolioOptimizationApi } from '../../services/optimizationService';
import type { OptimizationResponse, AssetWeightAllocations } from '../../types';
import { formatINR } from '../../lib/utils';

export const PortfolioOptimizer: React.FC = () => {
  const [data, setData] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskBandOverride, setRiskBandOverride] = useState<string>('');

  const fetchOptimization = async (riskBand?: string) => {
    setLoading(true);
    try {
      const res = await getPortfolioOptimizationApi(riskBand || undefined);
      setData(res);
      if (!riskBandOverride && res.riskBand) {
        setRiskBandOverride(res.riskBand);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to calculate portfolio optimization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, []);

  const handleRiskBandChange = (newBand: string) => {
    setRiskBandOverride(newBand);
    fetchOptimization(newBand);
  };

  const current = data?.currentPortfolio;
  const maxSharpe = data?.maxSharpePortfolio;
  const minVar = data?.minVariancePortfolio;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <SectionHeader
          title="Portfolio Optimization & Efficient Frontier"
          subtitle="Markowitz Modern Portfolio Theory (MPT) tailored to Indian asset correlations, fiduciary risk band constraints, and Sharpe ratio maximization."
        />
        <div className="mt-3">
          <DisclaimerBanner
            type="info"
            customText="Mean-variance optimization generates candidate allocations using historical Indian asset class risk premiums and covariance matrices. Actual performance may diverge during market regime shifts."
          />
        </div>
      </div>

      {/* Risk Band Selector & Constraints Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
            Fiduciary Risk Profile Cap
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-lg font-serif font-bold text-stone-900">
              {data?.riskBand || 'Assessing'} Band
            </h3>
            {data?.constraints && (
              <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-mono font-medium">
                Max Equity: {data.constraints.maxEquityPercent}% • Min Debt:{' '}
                {data.constraints.minDebtPercent}%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-stone-600">Change Risk Band:</label>
          <select
            value={riskBandOverride}
            onChange={(e) => handleRiskBandChange(e.target.value)}
            className="text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="LOW">Low (Conservative)</option>
            <option value="MODERATE_LOW">Moderate-Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="MODERATE_HIGH">Moderate-High</option>
            <option value="HIGH">High (Aggressive)</option>
          </select>
          <button
            onClick={() => fetchOptimization(riskBandOverride)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            title="Recalculate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : data ? (
        <>
          {/* 3 Strategy Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Current Portfolio */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-stone-600" />
                  Current Portfolio
                </span>
                <span className="text-xs font-mono font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                  Sharpe: {current?.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <span className="text-[11px] text-stone-500 block">Expected Return</span>
                  <span className="text-xl font-mono font-bold text-stone-900">
                    {current?.returnPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Annual Volatility</span>
                  <span className="text-xl font-mono font-bold text-stone-700">
                    {current?.volatilityPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Weight Bar */}
              <AllocationBar weights={current?.weights} />
            </div>

            {/* Max Sharpe Portfolio (Optimal Risk-Adjusted) */}
            <div className="bg-white border-2 border-teal-500/40 rounded-3xl p-5 shadow-sm relative overflow-hidden bg-gradient-to-br from-teal-50/20 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Max-Sharpe (Optimal)
                </span>
                <span className="text-xs font-mono font-semibold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                  Sharpe: {maxSharpe?.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <span className="text-[11px] text-teal-700 block">Expected Return</span>
                  <span className="text-xl font-mono font-bold text-teal-900">
                    {maxSharpe?.returnPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-teal-700 block">Annual Volatility</span>
                  <span className="text-xl font-mono font-bold text-teal-900">
                    {maxSharpe?.volatilityPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Weight Bar */}
              <AllocationBar weights={maxSharpe?.weights} />
            </div>

            {/* Min Variance Portfolio (Conservative) */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Minimum Variance
                </span>
                <span className="text-xs font-mono font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                  Sharpe: {minVar?.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <span className="text-[11px] text-stone-500 block">Expected Return</span>
                  <span className="text-xl font-mono font-bold text-stone-900">
                    {minVar?.returnPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Annual Volatility</span>
                  <span className="text-xl font-mono font-bold text-indigo-700">
                    {minVar?.volatilityPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Weight Bar */}
              <AllocationBar weights={minVar?.weights} />
            </div>
          </div>

          {/* Efficient Frontier Scatter Chart */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
              <div>
                <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-600" />
                  Markowitz Efficient Frontier Curve
                </h3>
                <p className="text-xs text-stone-500">
                  Curvature represents Pareto-optimal portfolios yielding highest expected return for every level of risk.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-teal-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Frontier Points
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Current Portfolio
                </span>
              </div>
            </div>

            <div className="h-96 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey="volatilityPercent"
                    name="Annual Volatility (%)"
                    unit="%"
                    domain={['auto', 'auto']}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="returnPercent"
                    name="Expected Return (%)"
                    unit="%"
                    domain={['auto', 'auto']}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [`${val}%`, String(name || '')]}
                  />
                  {/* Frontier line points */}
                  <Scatter
                    name="Efficient Frontier"
                    data={data.efficientFrontier}
                    fill="#0d9488"
                    line={{ stroke: '#0d9488', strokeWidth: 2 }}
                    shape="circle"
                  />
                  {/* User Current Portfolio point */}
                  {current && (
                    <Scatter
                      name="Current Portfolio"
                      data={[current]}
                      fill="#f59e0b"
                      shape="diamond"
                    >
                      <Cell fill="#f59e0b" />
                    </Scatter>
                  )}
                  {/* Max Sharpe Portfolio */}
                  {maxSharpe && (
                    <Scatter
                      name="Max Sharpe"
                      data={[maxSharpe]}
                      fill="#047857"
                      shape="cross"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-stone-900 mb-4">
              Recommended Weight Reallocations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Asset Class</th>
                    <th className="py-2.5 px-3">Current Weight</th>
                    <th className="py-2.5 px-3">Max Sharpe Weight</th>
                    <th className="py-2.5 px-3">Min Variance Weight</th>
                    <th className="py-2.5 px-3">Target Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {(['equity', 'debt', 'gold', 'cash'] as const).map((asset) => {
                    const curW = current?.weights[asset] || 0;
                    const optW = maxSharpe?.weights[asset] || 0;
                    const minW = minVar?.weights[asset] || 0;
                    const shift = optW - curW;

                    return (
                      <tr key={asset} className="hover:bg-stone-50">
                        <td className="py-3 px-3 capitalize font-sans font-semibold text-stone-800">
                          {asset}
                        </td>
                        <td className="py-3 px-3 text-stone-700">{curW.toFixed(1)}%</td>
                        <td className="py-3 px-3 font-semibold text-teal-800 bg-teal-50/40">
                          {optW.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-stone-600">{minW.toFixed(1)}%</td>
                        <td className="py-3 px-3 font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              Math.abs(shift) < 0.5
                                ? 'bg-stone-100 text-stone-600'
                                : shift > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {shift > 0 ? `+${shift.toFixed(1)}%` : `${shift.toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

interface AllocationBarProps {
  weights?: AssetWeightAllocations;
}

const AllocationBar: React.FC<AllocationBarProps> = ({ weights }) => {
  if (!weights) return null;

  return (
    <div className="space-y-2">
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-stone-100">
        <div style={{ width: `${weights.equity}%` }} className="bg-teal-600 h-full" title={`Equity: ${weights.equity}%`} />
        <div style={{ width: `${weights.debt}%` }} className="bg-blue-500 h-full" title={`Debt: ${weights.debt}%`} />
        <div style={{ width: `${weights.gold}%` }} className="bg-amber-400 h-full" title={`Gold: ${weights.gold}%`} />
        <div style={{ width: `${weights.cash}%` }} className="bg-stone-400 h-full" title={`Cash: ${weights.cash}%`} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-stone-500 pt-1">
        <span>Eq: {weights.equity}%</span>
        <span>Db: {weights.debt}%</span>
        <span>Au: {weights.gold}%</span>
        <span>Cs: {weights.cash}%</span>
      </div>
    </div>
  );
};

export default PortfolioOptimizer;
