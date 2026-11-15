import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  calculateSIP,
  calculateStepUpSIP,
  calculateLumpsum,
  calculateGoalPlanner,
  calculateInflationAdjusted,
} from '../../lib/calculators';
import { saveCalculationApi } from '../../services/api';
import { formatINR, formatCompactINR } from '../../lib/utils';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Calculator,
  TrendingUp,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

type CalculatorTab = 'sip' | 'stepup' | 'lumpsum' | 'goal' | 'inflation';

export const Calculators: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const initialAmount = Number(searchParams.get('amount')) || 15000;
  const initialYears = Number(searchParams.get('years')) || 10;
  const initialRate = Number(searchParams.get('rate')) || 12;

  const [activeTab, setActiveTab] = useState<CalculatorTab>('sip');

  // SIP Inputs
  const [sipMonthly, setSipMonthly] = useState(initialAmount);
  const [sipRate, setSipRate] = useState(initialRate);
  const [sipYears, setSipYears] = useState(initialYears);

  // Step Up Inputs
  const [stepUpMonthly, setStepUpMonthly] = useState(15000);
  const [stepUpPercent, setStepUpPercent] = useState(10);
  const [stepUpRate, setStepUpRate] = useState(12);
  const [stepUpYears, setStepUpYears] = useState(10);

  // Lumpsum Inputs
  const [lumpAmount, setLumpAmount] = useState(200000);
  const [lumpRate, setLumpRate] = useState(12);
  const [lumpYears, setLumpYears] = useState(10);

  // Goal Inputs
  const [goalTarget, setGoalTarget] = useState(10000000); // 1 Cr
  const [goalYears, setGoalYears] = useState(10);
  const [goalRate, setGoalRate] = useState(12);

  // Inflation Inputs
  const [infMonthly, setInfMonthly] = useState(20000);
  const [infRate, setInfRate] = useState(12);
  const [infInflation, setInfInflation] = useState(6);
  const [infYears, setInfYears] = useState(15);

  const [showTable, setShowTable] = useState(false);

  // Calculations
  const sipResult = useMemo(() => calculateSIP(sipMonthly, sipRate, sipYears), [sipMonthly, sipRate, sipYears]);
  const stepUpResult = useMemo(() => calculateStepUpSIP(stepUpMonthly, stepUpPercent, stepUpRate, stepUpYears), [stepUpMonthly, stepUpPercent, stepUpRate, stepUpYears]);
  const lumpResult = useMemo(() => calculateLumpsum(lumpAmount, lumpRate, lumpYears), [lumpAmount, lumpRate, lumpYears]);
  const goalResult = useMemo(() => calculateGoalPlanner(goalTarget, goalYears, goalRate), [goalTarget, goalYears, goalRate]);
  const infResult = useMemo(() => calculateInflationAdjusted(infMonthly, infRate, infInflation, infYears), [infMonthly, infRate, infInflation, infYears]);

  const currentResult = useMemo(() => {
    switch (activeTab) {
      case 'sip': return sipResult;
      case 'stepup': return stepUpResult;
      case 'lumpsum': return lumpResult;
      case 'goal': return goalResult.calculationResult;
      case 'inflation': return infResult.nominalResult;
    }
  }, [activeTab, sipResult, stepUpResult, lumpResult, goalResult, infResult]);

  const handleSaveCalculation = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to save calculations to your profile.');
      return;
    }
    try {
      await saveCalculationApi(
        activeTab,
        {
          sipMonthly, sipRate, sipYears,
          stepUpMonthly, stepUpPercent, stepUpRate, stepUpYears,
          lumpAmount, lumpRate, lumpYears,
          goalTarget, goalYears, goalRate,
          infMonthly, infRate, infInflation, infYears,
        },
        currentResult
      );
    } catch {
      // Local fallback handled inside service
    }
    toast.success('Calculation saved to your profile!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <SectionHeader
          eyebrow="COMPOUNDING POWERHOUSE"
          title="Financial Calculators & Goal Planner"
          subtitle="Simulate SIP compounding, annual step-up multipliers, inflation drag, and required goal investments."
          className="mb-0"
        />

        <button
          onClick={handleSaveCalculation}
          className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 self-start md:self-auto shadow-2xs transition-colors"
        >
          <Bookmark className="w-4 h-4 text-emerald-600" />
          <span>Save Calculation</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto custom-scrollbar gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
        {[
          { id: 'sip', label: 'Regular SIP' },
          { id: 'stepup', label: 'Step-Up SIP (+10%)' },
          { id: 'lumpsum', label: 'Lumpsum Investment' },
          { id: 'goal', label: 'Goal Target Planner' },
          { id: 'inflation', label: 'Inflation-Adjusted' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CalculatorTab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            {activeTab === 'sip' && 'SIP Parameters'}
            {activeTab === 'stepup' && 'Step-Up SIP Parameters'}
            {activeTab === 'lumpsum' && 'Lumpsum Parameters'}
            {activeTab === 'goal' && 'Goal Target Parameters'}
            {activeTab === 'inflation' && 'Inflation Parameters'}
          </h2>

          {/* TAB 1: REGULAR SIP */}
          {activeTab === 'sip' && (
            <div className="space-y-4">
              <CurrencyInput
                label="Monthly Investment"
                value={sipMonthly}
                onChange={setSipMonthly}
                min={500}
                max={200000}
                step={500}
              />

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Expected Annual Return (CAGR)</span>
                  <span className="font-bold text-emerald-700">{sipRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={sipRate}
                  onChange={(e) => setSipRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Time Horizon (Years)</span>
                  <span className="font-bold text-emerald-700">{sipYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={35}
                  step={1}
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: STEP UP SIP */}
          {activeTab === 'stepup' && (
            <div className="space-y-4">
              <CurrencyInput
                label="Starting Monthly SIP"
                value={stepUpMonthly}
                onChange={setStepUpMonthly}
                min={1000}
                max={200000}
                step={1000}
              />

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Annual Step-Up Increment (%)</span>
                  <span className="font-bold text-emerald-700">+{stepUpPercent}% / yr</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={stepUpPercent}
                  onChange={(e) => setStepUpPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">Increases SIP amount every 12 months with salary increment.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Expected Return Rate</span>
                  <span className="font-bold text-emerald-700">{stepUpRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={stepUpRate}
                  onChange={(e) => setStepUpRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Duration</span>
                  <span className="font-bold text-emerald-700">{stepUpYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={35}
                  value={stepUpYears}
                  onChange={(e) => setStepUpYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: LUMPSUM */}
          {activeTab === 'lumpsum' && (
            <div className="space-y-4">
              <CurrencyInput
                label="One-Time Lumpsum Investment"
                value={lumpAmount}
                onChange={setLumpAmount}
                min={10000}
                max={5000000}
                step={10000}
              />

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Expected Annual Return (CAGR)</span>
                  <span className="font-bold text-emerald-700">{lumpRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={lumpRate}
                  onChange={(e) => setLumpRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Investment Horizon</span>
                  <span className="font-bold text-emerald-700">{lumpYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={lumpYears}
                  onChange={(e) => setLumpYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 4: GOAL PLANNER */}
          {activeTab === 'goal' && (
            <div className="space-y-4">
              <CurrencyInput
                label="Target Goal Corpus (Today's Value)"
                value={goalTarget}
                onChange={setGoalTarget}
                min={100000}
                max={50000000}
                step={100000}
              />

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Target Horizon (Years)</span>
                  <span className="font-bold text-emerald-700">{goalYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={goalYears}
                  onChange={(e) => setGoalYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Expected Portfolio CAGR</span>
                  <span className="font-bold text-emerald-700">{goalRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  value={goalRate}
                  onChange={(e) => setGoalRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 5: INFLATION */}
          {activeTab === 'inflation' && (
            <div className="space-y-4">
              <CurrencyInput
                label="Monthly SIP Amount"
                value={infMonthly}
                onChange={setInfMonthly}
                min={1000}
                max={200000}
                step={1000}
              />

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Expected Inflation Rate</span>
                  <span className="font-bold text-rose-600">{infInflation}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  step={0.5}
                  value={infInflation}
                  onChange={(e) => setInfInflation(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Nominal CAGR Return</span>
                  <span className="font-bold text-emerald-700">{infRate}%</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={20}
                  value={infRate}
                  onChange={(e) => setInfRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-medium text-slate-700">Years</span>
                  <span className="font-bold text-emerald-700">{infYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={infYears}
                  onChange={(e) => setInfYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Results & Stacked Area Chart (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Output Banner */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 border-l-4 border-l-emerald-600 shadow-xs space-y-5">
            
            {activeTab === 'goal' ? (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">
                  REQUIRED MONTHLY SIP TO HIT GOAL
                </span>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-emerald-700 mt-1 tabular-nums tracking-tight">
                  {formatINR(goalResult.requiredMonthlySIP, false)}
                  <span className="text-sm font-normal text-slate-500"> / month</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Adjusted for 6% inflation, future cost of goal will be ~ <strong className="text-slate-800">{formatCompactINR(goalResult.futureCostWithInflation)}</strong>.
                </p>
              </div>
            ) : activeTab === 'inflation' ? (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">
                  REAL PURCHASING POWER (TODAY'S MONEY)
                </span>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-emerald-700 mt-1 tabular-nums tracking-tight">
                  {formatCompactINR(infResult.realPurchasingPower)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Nominal Corpus: {formatCompactINR(infResult.nominalResult.totalValue)} • Real Net Return: <strong className="text-slate-800">+{infResult.realReturnRate}%</strong>
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">
                  ESTIMATED TOTAL WEALTH VALUE
                </span>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-emerald-700 mt-1 tabular-nums tracking-tight">
                  {formatCompactINR(currentResult.totalValue)}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Full value: {formatINR(currentResult.totalValue, false)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-500 font-mono">Total Invested</span>
                <p className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
                  {formatCompactINR(currentResult.investedAmount)}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-500 font-mono">Estimated Wealth Gain</span>
                <p className="text-xl font-bold font-mono text-emerald-700 tabular-nums mt-0.5">
                  +{formatCompactINR(currentResult.estimatedReturns)}
                </p>
              </div>
            </div>

          </div>

          {/* Growth by Year Stacked Area Chart */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Year-by-Year Compounding Trajectory
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentResult.breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#94A3B8" fontSize={10} fontFamily="monospace" tickFormatter={(y) => `Yr ${y}`} />
                  <YAxis orientation="right" stroke="#94A3B8" fontSize={10} fontFamily="monospace" tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val), false), 'Amount']}
                    labelFormatter={(lbl) => `End of Year ${lbl}`}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="invested" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.8} name="Principal Invested" />
                  <Area type="monotone" dataKey="returns" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.8} name="Compounding Gain" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* Collapsible Year-by-Year Amortization Schedule Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0F766E]" />
            <h3 className="font-serif text-lg font-bold text-[#0B1220]">
              Year-by-Year Amortization & Value Breakdown
            </h3>
          </div>
          {showTable ? <ChevronUp className="w-5 h-5 text-[#5B6572]" /> : <ChevronDown className="w-5 h-5 text-[#5B6572]" />}
        </button>

        {showTable && (
          <div className="overflow-x-auto pt-2 animate-in fade-in duration-150">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF7] text-[#5B6572]">
                <tr>
                  <th className="py-3 px-4 font-semibold">End of Year</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Invested</th>
                  <th className="py-3 px-4 font-semibold text-right">Compounded Returns</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Portfolio Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5DF]">
                {currentResult.breakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-black/5">
                    <td className="py-2.5 px-4 font-bold">Year {row.year}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-[#5B6572]">{formatINR(row.invested, false)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-600">+{formatINR(row.returns, false)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-[#0B1220]">{formatINR(row.total, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DisclaimerBanner
        type="warning"
        compact={true}
        className="mt-6"
      />

    </div>
  );
};
