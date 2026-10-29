import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getFunds } from '../../services/api';
import type { MutualFund } from '../../types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { RiskMeter } from '../../components/ui/RiskMeter';
import { formatINR, formatCompactINR, formatPercent } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowLeft, Check, Plus, X, Star } from 'lucide-react';
import { toast } from 'sonner';

export const FundCompare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [allFunds, setAllFunds] = useState<MutualFund[]>([]);
  const [comparedFunds, setComparedFunds] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);

  const codesQuery = searchParams.get('codes') || 'PPFAS_FLEXI,UTI_NIFTY50,HDFC_BALANCED_ADV';

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const list = await getFunds();
        setAllFunds(list);

        const activeCodes = codesQuery.split(',').filter(Boolean);
        const matched = list.filter((f) => activeCodes.includes(f.code));
        setComparedFunds(matched.length > 0 ? matched : list.slice(0, 3));
      } catch (err) {
        console.error('Failed to load compare funds', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [codesQuery]);

  const removeFund = (code: string) => {
    const updated = comparedFunds.filter((f) => f.code !== code);
    setComparedFunds(updated);
    setSearchParams({ codes: updated.map((f) => f.code).join(',') });
  };

  const addFund = (code: string) => {
    if (comparedFunds.length >= 3) {
      toast.error('Maximum 3 funds can be compared simultaneously.');
      return;
    }
    const found = allFunds.find((f) => f.code === code);
    if (found && !comparedFunds.some((f) => f.code === code)) {
      const updated = [...comparedFunds, found];
      setComparedFunds(updated);
      setSearchParams({ codes: updated.map((f) => f.code).join(',') });
    }
  };

  // Recharts Bar Chart Data for CAGR Comparison
  const chartData = [
    {
      period: '1Y Return',
      ...comparedFunds.reduce((acc, f) => ({ ...acc, [f.name]: f.cagr1Y ?? 0 }), {}),
    },
    {
      period: '3Y Return',
      ...comparedFunds.reduce((acc, f) => ({ ...acc, [f.name]: f.cagr3Y ?? 0 }), {}),
    },
    {
      period: '5Y Return',
      ...comparedFunds.reduce((acc, f) => ({ ...acc, [f.name]: f.cagr5Y ?? 0 }), {}),
    },
  ];

  const colors = ['#0F766E', '#4F46E5', '#D97706'];

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/funds')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fund Explorer</span>
        </button>

        <span className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
          Comparing {comparedFunds.length} / 3 schemes
        </span>
      </div>

      <SectionHeader
        eyebrow="HEAD-TO-HEAD BENCHMARKING"
        title="Mutual Fund Scheme Comparison"
        subtitle="Analyze CAGR outperformance, volatility drawdowns, expense drag, and portfolio concentration side by side."
      />

      {/* Available Add Selector */}
      {comparedFunds.length < 3 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2]">Add another scheme to compare:</span>
          <select
            onChange={(e) => {
              if (e.target.value) addFund(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-xs text-[#0B1220] dark:text-[#E8EDF2]"
            defaultValue=""
          >
            <option value="" disabled>Select fund...</option>
            {allFunds
              .filter((f) => !comparedFunds.some((c) => c.code === f.code))
              .map((f) => (
                <option key={f.code} value={f.code}>{f.name} ({f.category})</option>
              ))}
          </select>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-[#E7E5DF] dark:divide-[#1F2933]">
              
              {/* Scheme Headers */}
              <tr className="bg-[#FAFAF7] dark:bg-[#0B0F14]">
                <td className="p-5 font-bold text-sm text-[#5B6572] dark:text-[#8A97A6] w-1/4">
                  Scheme Overview
                </td>
                {comparedFunds.map((fund, idx) => (
                  <td key={fund.code} className="p-5 w-1/4 align-top">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-300">
                          {fund.category}
                        </span>
                        {comparedFunds.length > 1 && (
                          <button
                            onClick={() => removeFund(fund.code)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <Link
                        to={`/funds/${fund.code}`}
                        className="font-serif font-bold text-base text-[#0B1220] dark:text-[#E8EDF2] hover:text-[#0F766E] transition-colors block line-clamp-2"
                      >
                        {fund.name}
                      </Link>
                      <p className="text-[11px] text-[#5B6572]">{fund.fundHouse}</p>
                    </div>
                  </td>
                ))}
              </tr>

              {/* NAV */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">Current NAV</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4 font-serif font-bold text-base text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                    {formatINR(f.nav)}
                  </td>
                ))}
              </tr>

              {/* 3Y CAGR (Primary Compounding metric) */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">3-Year CAGR</td>
                {comparedFunds.map((f) => {
                  const validScores = comparedFunds.map((x) => x.cagr3Y).filter((v): v is number => v != null);
                  const max3Y = validScores.length > 0 ? Math.max(...validScores) : null;
                  const isBest = f.cagr3Y != null && f.cagr3Y === max3Y;
                  return (
                    <td key={f.code} className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-serif font-bold text-base tabular-nums ${isBest ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-[#0B1220] dark:text-[#E8EDF2]'}`}>
                          {f.cagr3Y != null ? formatPercent(f.cagr3Y) : '—'}
                        </span>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Best in set
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 1Y CAGR */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">1-Year Return</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4 font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {f.cagr1Y != null ? formatPercent(f.cagr1Y) : '—'}
                  </td>
                ))}
              </tr>

              {/* 5Y CAGR */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">5-Year CAGR</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4 font-bold text-sm text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                    {f.cagr5Y != null ? formatPercent(f.cagr5Y) : '—'}
                  </td>
                ))}
              </tr>

              {/* Expense Ratio */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">Expense Ratio (Direct)</td>
                {comparedFunds.map((f) => {
                  const validRatios = comparedFunds.map((x) => x.expenseRatio).filter((v): v is number => v != null);
                  const minExp = validRatios.length > 0 ? Math.min(...validRatios) : null;
                  const isLowest = f.expenseRatio != null && f.expenseRatio === minExp;
                  return (
                    <td key={f.code} className="p-4">
                      <span className={`font-mono font-bold text-xs ${isLowest ? 'text-emerald-600 font-extrabold' : ''}`}>
                        {f.expenseRatio != null ? `${f.expenseRatio}%${isLowest ? ' (Lowest)' : ''}` : '—'}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Volatility */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">Annual Volatility (Std Dev)</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4 font-mono text-xs">
                    {f.volatility != null ? `${f.volatility.toFixed(2)}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* Max Drawdown */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">Max Drawdown Risk</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4 font-mono text-xs text-rose-600 dark:text-rose-400">
                    {f.maxDrawdown != null ? `${f.maxDrawdown.toFixed(2)}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* Risk Level */}
              <tr>
                <td className="p-4 font-semibold text-[#5B6572]">Risk Meter</td>
                {comparedFunds.map((f) => (
                  <td key={f.code} className="p-4">
                    <RiskMeter level={f.riskLevel as any} />
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Returns Comparison Bar Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
          CAGR Compounding Trajectory Comparison
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="period" stroke="#8A97A6" fontSize={11} />
              <YAxis stroke="#8A97A6" fontSize={10} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'CAGR Return']}
                contentStyle={{ backgroundColor: '#121821', borderColor: '#1F2933', color: '#fff', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {comparedFunds.map((f, i) => (
                <Bar key={f.code} dataKey={f.name} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
