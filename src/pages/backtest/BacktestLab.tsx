import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Play,
  RotateCcw,
  TrendingUp,
  Percent,
  Calendar,
  IndianRupee,
  Activity,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { runBacktestApi } from '../../services/backtestService';
import type {
  BacktestParams,
  BacktestResponse,
  BacktestStrategy,
} from '../../types';
import { formatINR } from '../../lib/utils';

export const BacktestLab: React.FC = () => {
  // Strategy & Parameter States
  const [strategy, setStrategy] = useState<BacktestStrategy>('SMA_CROSSOVER');
  const [symbol, setSymbol] = useState('^NSEI');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [monthlySipAmount, setMonthlySipAmount] = useState(10000);
  const [fastPeriod, setFastPeriod] = useState(20);
  const [slowPeriod, setSlowPeriod] = useState(50);
  const [transactionCostPercent, setTransactionCostPercent] = useState(0.1);
  const [stcgTaxPercent, setStcgTaxPercent] = useState(20.0);
  const [ltcgTaxPercent, setLtcgTaxPercent] = useState(12.5);

  // Date Range (default 3 years)
  const defaultEnd = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Execution states
  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'equity' | 'trades'>('equity');

  const executeBacktest = async () => {
    setLoading(true);
    try {
      const params: BacktestParams = {
        symbol: symbol.trim(),
        strategy,
        startDate,
        endDate,
        initialCapital,
        monthlySipAmount,
        fastPeriod,
        slowPeriod,
        transactionCostPercent,
        stcgTaxPercent,
        ltcgTaxPercent,
      };

      const res = await runBacktestApi(params);
      setBacktestResult(res);
      toast.success('Backtest simulation completed successfully');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to execute backtest';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeBacktest();
  }, []);

  const stratMetrics = backtestResult?.metrics.strategy;
  const benchMetrics = backtestResult?.metrics.benchmark;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <SectionHeader
          title="Strategy Backtesting Engine"
          subtitle="Simulate algorithmic strategies against real historical market data with realistic Indian taxes (STCG/LTCG) and transaction slippage."
        />
        <div className="mt-3">
          <DisclaimerBanner
            type="warning"
            customText="Educational Backtest Simulator. Past performance is strictly not an indicator of future results. All simulations include estimated brokerage costs and Indian capital gains tax provisions (20% STCG / 12.5% LTCG under Section 112A)."
          />
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          Strategy & Simulation Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Strategy Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Strategy Model
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as BacktestStrategy)}
              className="w-full text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="SMA_CROSSOVER">SMA Crossover (Fast vs Slow)</option>
              <option value="SIP_VS_LUMPSUM">SIP vs Lumpsum Comparison</option>
              <option value="BUY_AND_HOLD">Buy & Hold Benchmark</option>
            </select>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Market Symbol
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="^NSEI, RELIANCE.NS"
                className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setSymbol('^NSEI')}
                className="px-2.5 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg shrink-0 transition-colors"
                title="Reset to NIFTY 50"
              >
                NIFTY
              </button>
            </div>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Initial Capital (₹)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              min={10000}
              step={10000}
              className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Monthly SIP (conditional) */}
          {strategy === 'SIP_VS_LUMPSUM' ? (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Monthly SIP Amount (₹)
              </label>
              <input
                type="number"
                value={monthlySipAmount}
                onChange={(e) => setMonthlySipAmount(Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Fast SMA
                </label>
                <input
                  type="number"
                  value={fastPeriod}
                  onChange={(e) => setFastPeriod(Number(e.target.value))}
                  min={5}
                  max={50}
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Slow SMA
                </label>
                <input
                  type="number"
                  value={slowPeriod}
                  onChange={(e) => setSlowPeriod(Number(e.target.value))}
                  min={20}
                  max={200}
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Date range start */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Date range end */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Transaction Slippage */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Brokerage & Costs (%)
            </label>
            <input
              type="number"
              value={transactionCostPercent}
              onChange={(e) => setTransactionCostPercent(Number(e.target.value))}
              step={0.05}
              min={0}
              className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              onClick={executeBacktest}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Backtest
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader count={3} />
        </div>
      ) : backtestResult ? (
        <>
          {/* Key Metrics Comparison Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Final Capital
              </span>
              <p className="text-lg font-serif font-bold text-stone-900 mt-1">
                {formatINR(backtestResult.capital.strategyFinalValue)}
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                Invested: {formatINR(backtestResult.capital.totalInvested)}
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Total Return
              </span>
              <p
                className={`text-lg font-mono font-bold mt-1 ${
                  (stratMetrics?.totalReturnPercent ?? 0) >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {stratMetrics?.totalReturnPercent.toFixed(2)}%
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                Bench: {benchMetrics?.totalReturnPercent.toFixed(2)}%
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                CAGR / XIRR
              </span>
              <p className="text-lg font-mono font-bold text-stone-900 mt-1">
                {stratMetrics?.cagrPercent.toFixed(2)}%
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                XIRR: {stratMetrics?.xirrPercent.toFixed(2)}%
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Max Drawdown
              </span>
              <p className="text-lg font-mono font-bold text-rose-600 mt-1">
                {stratMetrics?.maxDrawdownPercent.toFixed(2)}%
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                Bench: {benchMetrics?.maxDrawdownPercent.toFixed(2)}%
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Sharpe Ratio
              </span>
              <p className="text-lg font-mono font-bold text-teal-700 mt-1">
                {stratMetrics?.sharpeRatio.toFixed(2)}
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                Bench: {benchMetrics?.sharpeRatio.toFixed(2)}
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Win Rate
              </span>
              <p className="text-lg font-mono font-bold text-stone-900 mt-1">
                {stratMetrics?.winRatePercent.toFixed(1)}%
              </p>
              <span className="text-[11px] text-stone-500 font-mono">
                {stratMetrics?.winningTrades}/{stratMetrics?.totalTrades} Trades
              </span>
            </div>
          </div>

          {/* Chart & Trades Container */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Historical Performance Visualization
                </h3>
                <p className="text-xs text-stone-500">
                  {backtestResult.symbol} • {backtestResult.dateRange.start} to {backtestResult.dateRange.end} ({backtestResult.dateRange.totalTradingDays} trading days)
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('equity')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === 'equity'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Equity Curve
                </button>
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === 'trades'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Trade Log ({backtestResult.trades.length})
                </button>
              </div>
            </div>

            {activeTab === 'equity' ? (
              <div className="mt-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={backtestResult.equityCurve}
                      margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => val.slice(0, 7)}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                        formatter={(value: any) => [formatINR(Number(value)), '']}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="strategyPortfolio"
                        name="Strategy Portfolio"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmarkPortfolio"
                        name="Buy & Hold Benchmark"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="investedCapital"
                        name="Invested Capital"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Additional costs summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-100 text-xs text-stone-600">
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="font-semibold text-stone-700 block mb-0.5">
                      Transaction Slippage & Brokerage
                    </span>
                    <p className="font-mono text-stone-900 text-sm">
                      {formatINR(stratMetrics?.totalTransactionCostsPaid ?? 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="font-semibold text-stone-700 block mb-0.5">
                      Estimated Taxes Deducted (STCG/LTCG)
                    </span>
                    <p className="font-mono text-stone-900 text-sm">
                      {formatINR(stratMetrics?.totalTaxPaid ?? 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="font-semibold text-stone-700 block mb-0.5">
                      Net Benchmark Outperformance
                    </span>
                    <p
                      className={`font-mono text-sm font-semibold ${
                        (stratMetrics?.totalReturnPercent ?? 0) -
                          (benchMetrics?.totalReturnPercent ?? 0) >=
                        0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {(
                        (stratMetrics?.totalReturnPercent ?? 0) -
                        (benchMetrics?.totalReturnPercent ?? 0)
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                {backtestResult.trades.length === 0 ? (
                  <p className="text-center py-8 text-xs text-stone-500 font-mono">
                    No trade executions occurred during the selected period.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Units</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Costs</th>
                        <th className="py-2.5 px-3">Tax Paid</th>
                        <th className="py-2.5 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {backtestResult.trades.map((t, idx) => (
                        <tr key={idx} className="hover:bg-stone-50 transition-colors">
                          <td className="py-2 px-3 text-stone-800">{t.date}</td>
                          <td className="py-2 px-3 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                t.type === 'BUY' || t.type === 'SIP_INSTALLMENT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-stone-700">₹{t.price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-stone-700">{t.units.toFixed(2)}</td>
                          <td className="py-2 px-3 text-stone-900 font-semibold">
                            {formatINR(t.amount)}
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            ₹{(t.costs ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            {t.taxPaid ? `₹${t.taxPaid.toFixed(1)}` : '—'}
                          </td>
                          <td className="py-2 px-3 font-sans text-stone-500 text-[11px]">
                            {t.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center">
          <Info className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-800">No Backtest Data</p>
          <p className="text-xs text-stone-500 mt-1">
            Configure parameters and click "Run Backtest" to begin.
          </p>
        </div>
      )}
    </div>
  );
};

export default BacktestLab;
