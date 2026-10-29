import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFund } from '../../services/api';
import type { MutualFund } from '../../types';
import { calculateSIP } from '../../lib/calculators';
import { RiskMeter } from '../../components/ui/RiskMeter';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { formatINR, formatCompactINR, formatPercent } from '../../lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export const FundDetail: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [fund, setFund] = useState<MutualFund | null>(null);
  const [loading, setLoading] = useState(true);

  // Embedded SIP calculator state prefilled with fund's 3Y CAGR
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipYears, setSipYears] = useState(10);

  useEffect(() => {
    async function load() {
      if (!code) return;
      try {
        setLoading(true);
        const data = await getFund(code);
        setFund(data);
      } catch (err) {
        console.error('Failed to load fund', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  if (loading && !fund) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">Loading fund intelligence...</p>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Fund Not Found</h1>
        <p className="text-xs text-[#5B6572]">No scheme was found matching code {code}.</p>
        <Link to="/funds" className="inline-block px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const expectedRate = fund.cagr3Y || 15;
  const sipResult = calculateSIP(sipAmount, expectedRate, sipYears);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/funds')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Funds</span>
        </button>

        <Link
          to={`/funds/compare?codes=${fund.code}`}
          className="text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline"
        >
          Compare with other schemes →
        </Link>
      </div>

      {/* Fund Header Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-300 border border-emerald-500/20">
              {fund.category}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B1220] dark:text-[#E8EDF2] leading-tight">
            {fund.name}
          </h1>

          <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6]">
            {fund.fundHouse}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[10px] text-[#5B6572] dark:text-[#8A97A6] uppercase font-semibold">Current NAV</span>
              <p className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                {formatINR(fund.nav)}
              </p>
            </div>
            <div className="border-l border-[#E7E5DF] dark:border-[#1F2933] pl-6">
              <span className="text-[10px] text-[#5B6572] dark:text-[#8A97A6] uppercase font-semibold">Expense Ratio</span>
              <p className="font-serif text-2xl font-bold text-[#0F766E] dark:text-emerald-400 tabular-nums">
                {fund.expenseRatio != null ? `${fund.expenseRatio}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] space-y-2">
          <RiskMeter level={fund.riskLevel as any} />

        </div>
      </div>

      {/* Row 2: Performance Area Chart + Risk Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Cols: NAV History Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] dark:border-[#1F2933] pb-3">
            <h2 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              Historical NAV Trajectory
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {fund.cagr3Y != null ? `+${formatPercent(fund.cagr3Y)} 3Y CAGR` : '—'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fund.navHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#8A97A6" fontSize={10} />
                <YAxis domain={['auto', 'auto']} orientation="right" stroke="#8A97A6" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'NAV']}
                  contentStyle={{ backgroundColor: '#121821', borderColor: '#1F2933', color: '#fff', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="nav" stroke="#0F766E" strokeWidth={2.5} fill="url(#navGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Historical CAGR Returns Table */}
          <div className="pt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF7] dark:bg-[#0B0F14] text-[#5B6572] dark:text-[#8A97A6]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg font-semibold">Period</th>
                  <th className="py-2.5 px-3 rounded-r-lg font-semibold text-right">Fund CAGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5DF] dark:divide-[#1F2933]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold">1 Year</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{fund.cagr1Y != null ? formatPercent(fund.cagr1Y) : '—'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">3 Years</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{fund.cagr3Y != null ? formatPercent(fund.cagr3Y) : '—'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">5 Years</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{fund.cagr5Y != null ? formatPercent(fund.cagr5Y) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Right 5 Cols: Risk & Asset Metrics */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              Risk Ratios & Downside Protection
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
                <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Standard Volatility</span>
                <p className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">{fund.volatility != null ? `${fund.volatility.toFixed(2)}%` : '—'}</p>
                <p className="text-[10px] text-[#5B6572] mt-0.5">Annualised std dev</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
                <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Max Drawdown</span>
                <p className="font-serif text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{fund.maxDrawdown != null ? `${fund.maxDrawdown.toFixed(2)}%` : '—'}</p>
                <p className="text-[10px] text-[#5B6572] mt-0.5">Peak-to-trough decline</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
                <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Expense Ratio</span>
                <p className="font-serif text-lg font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">{fund.expenseRatio != null ? `${fund.expenseRatio}%` : '—'}</p>
                <p className="text-[10px] text-[#5B6572] mt-0.5">Direct Growth Plan</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
                <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Sharpe Ratio</span>
                <p className="font-serif text-lg font-bold text-amber-600 mt-0.5">{fund.sharpeRatio != null ? fund.sharpeRatio.toFixed(2) : '—'}</p>
                <p className="text-[10px] text-[#5B6572] mt-0.5">Risk-adjusted return</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Row 3: Embedded SIP Simulator prefilled with Fund's 3Y CAGR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-lg space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#0F766E] dark:text-emerald-400" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Embedded SIP Compounding Simulator ({fund.cagr3Y != null ? `${fund.cagr3Y.toFixed(1)}%` : '—'} Historical CAGR)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <CurrencyInput
              label="Monthly SIP Amount (INR)"
              value={sipAmount}
              onChange={setSipAmount}
              min={500}
              max={100000}
              step={500}
            />

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">Duration</span>
                <span className="font-serif font-bold text-sm text-[#0F766E] dark:text-emerald-400">{sipYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-semibold text-[#5B6572] dark:text-[#8A97A6]">Estimated Wealth Corpus</span>
              <p className="font-serif text-3xl sm:text-4xl font-bold text-[#0F766E] dark:text-emerald-400 mt-1">
                {formatCompactINR(sipResult.totalValue)}
              </p>
              <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] mt-0.5">
                Invested: {formatCompactINR(sipResult.investedAmount)} • Estimated Gain: {formatCompactINR(sipResult.estimatedReturns)}
              </p>
            </div>

            <Link
              to={`/calculators?amount=${sipAmount}&years=${sipYears}&rate=${expectedRate}`}
              className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <span>Explore Advanced Step-Up SIP Projections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <DisclaimerBanner
        type="warning"
        compact={true}
        className="mt-6"
      />

    </div>
  );
};
