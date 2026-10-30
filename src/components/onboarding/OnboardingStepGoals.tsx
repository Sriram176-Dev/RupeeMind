import React, { useMemo } from 'react';
import type { UserProfile, FinancialGoalItem, GoalCategory, GoalPriority } from '../../types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCompactINR, formatINR } from '../../lib/utils';
import { assessIndividualGoals } from '../../lib/scoring';
import {
  TrendingUp,
  Shield,
  Target,
  Compass,
  HeartHandshake,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calendar,
} from 'lucide-react';

export interface GoalTypeOption {
  type: string;
  label: string;
  desc: string;
  icon: any;
}

interface OnboardingStepGoalsProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  goalTypes: GoalTypeOption[];
}

const PRESET_GOAL_CONFIGS: Record<GoalCategory, { defaultHorizon: number; defaultAmount: number; priority: GoalPriority }> = {
  'Wealth creation': { defaultHorizon: 7, defaultAmount: 2500000, priority: 'Important' },
  'Retirement': { defaultHorizon: 20, defaultAmount: 15000000, priority: 'Critical' },
  'House': { defaultHorizon: 5, defaultAmount: 2000000, priority: 'Important' },
  'Education': { defaultHorizon: 4, defaultAmount: 1500000, priority: 'Critical' },
  'Child': { defaultHorizon: 12, defaultAmount: 3000000, priority: 'Critical' },
  'Tax saving': { defaultHorizon: 3, defaultAmount: 150000, priority: 'Important' },
  'Emergency': { defaultHorizon: 1, defaultAmount: 300000, priority: 'Critical' },
  'Other': { defaultHorizon: 5, defaultAmount: 1000000, priority: 'Flexible' },
};

export const OnboardingStepGoals: React.FC<OnboardingStepGoalsProps> = ({
  profileData,
  setProfileData,
}) => {
  // Monthly investible surplus from Step 2
  const monthlySurplus = Math.max(
    0,
    (profileData.monthlyIncome || 0) - (profileData.monthlyExpenses || 0) - (profileData.monthlyEMIs || 0)
  );

  // Initialize goals if not present
  const goals: FinancialGoalItem[] = useMemo(() => {
    if (profileData.goals && profileData.goals.length > 0) {
      return profileData.goals;
    }
    // Default initial goal from legacy fields
    return [
      {
        id: 'goal-1',
        name: profileData.goalType || 'Wealth Creation',
        category: (profileData.goalType as GoalCategory) || 'Wealth creation',
        targetAmount: profileData.targetAmount || 2500000,
        horizonYears: profileData.horizonYears || 7,
        priority: 'Important',
      },
    ];
  }, [profileData.goals, profileData.goalType, profileData.targetAmount, profileData.horizonYears]);

  // Run assessment on individual goals
  const assessment = useMemo(() => {
    return assessIndividualGoals(goals, monthlySurplus);
  }, [goals, monthlySurplus]);

  const updateGoals = (updated: FinancialGoalItem[]) => {
    const primary = updated[0];
    const newAssessment = assessIndividualGoals(updated, monthlySurplus);

    setProfileData((prev) => ({
      ...prev,
      goals: updated,
      goalsAssessment: newAssessment,
      goalType: (primary?.category as any) || 'Wealth creation',
      targetAmount: primary?.targetAmount || 2500000,
      horizonYears: primary?.horizonYears || 5,
    }));
  };

  const handleAddGoal = (category: GoalCategory) => {
    const config = PRESET_GOAL_CONFIGS[category] || PRESET_GOAL_CONFIGS['Other'];
    const newGoal: FinancialGoalItem = {
      id: `goal-${Date.now()}`,
      name: category === 'Other' ? 'Custom Goal' : category,
      category,
      targetAmount: config.defaultAmount,
      horizonYears: config.defaultHorizon,
      priority: config.priority,
    };
    updateGoals([...goals, newGoal]);
  };

  const handleRemoveGoal = (id: string) => {
    if (goals.length <= 1) return; // Keep at least one goal
    const updated = goals.filter((g) => g.id !== id);
    updateGoals(updated);
  };

  const handleUpdateGoal = (id: string, updates: Partial<FinancialGoalItem>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    updateGoals(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
          STEP 3 • INDIVIDUALLY ASSESSABLE GOALS
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] mt-1">
          Your Financial Milestones & Time Horizons
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
          Define each goal independently. Our assessment engine calculates the exact monthly SIP and asset allocation needed to reach each milestone.
        </p>
      </div>

      {/* Aggregate Cash Flow & Feasibility Tracker */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        assessment.isFullyFundable
          ? 'bg-[#E6F4F1]/60 border-[#0F766E]/30'
          : 'bg-amber-50/70 border-amber-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {assessment.isFullyFundable ? (
                <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <h2 className="font-semibold text-sm text-[#0B1220]">
                {assessment.isFullyFundable
                  ? 'All Goals Are 100% Fundable Within Your Cash Flow'
                  : 'Goal Deficit Warning: SIP Exceeds Investible Surplus'}
              </h2>
            </div>
            <p className="text-xs text-[#5B6572]">
              Investible Monthly Surplus: <strong className="text-[#0B1220]">{formatINR(monthlySurplus)}</strong> •
              Total Required SIP: <strong className="text-[#0F766E]">{formatINR(assessment.totalMonthlySIPRequired)}</strong>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-[#E7E5DF] sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-[#5B6572] font-semibold block">
              {assessment.isFullyFundable ? 'Surplus Buffer' : 'Monthly Deficit'}
            </span>
            <span className={`text-base font-bold font-serif ${assessment.isFullyFundable ? 'text-[#0F766E]' : 'text-amber-700'}`}>
              {assessment.isFullyFundable
                ? `+ ${formatINR(assessment.surplusGap)}/mo`
                : `- ${formatINR(Math.abs(assessment.surplusGap))}/mo`}
            </span>
          </div>
        </div>
      </div>

      {/* Goal Cards List */}
      <div className="space-y-4">
        {goals.map((goal, idx) => {
          const assessedItem = assessment.goals.find((g) => g.id === goal.id);
          const reqSIP = assessedItem?.requiredMonthlySIP ?? 0;
          const allocation = assessedItem?.recommendedAllocation ?? { equity: 50, debt: 40, gold: 10 };

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] hover:border-[#0F766E]/40 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#E7E5DF] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <input
                      type="text"
                      value={goal.name}
                      onChange={(e) => handleUpdateGoal(goal.id, { name: e.target.value })}
                      className="font-bold text-sm text-[#0B1220] bg-transparent border-b border-dashed border-[#5B6572]/40 focus:border-[#0F766E] focus:outline-none px-0.5"
                    />
                    <span className="text-[10px] text-[#5B6572] ml-2 font-medium">({goal.category})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority Pill */}
                  <div className="flex items-center gap-1 bg-white border border-[#E7E5DF] rounded-xl p-0.5 text-[11px]">
                    {(['Critical', 'Important', 'Flexible'] as GoalPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleUpdateGoal(goal.id, { priority: p })}
                        className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                          goal.priority === p
                            ? p === 'Critical'
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : p === 'Important'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'text-[#5B6572] hover:text-[#0B1220]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Goal Inputs: Target Amount & Horizon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Target Amount (INR)"
                  value={goal.targetAmount}
                  onChange={(val) => handleUpdateGoal(goal.id, { targetAmount: val })}
                  min={50000}
                  max={100000000}
                  step={100000}
                  helperText={formatCompactINR(goal.targetAmount)}
                />

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-[#0B1220]">Time Horizon</label>
                    <span className="font-serif font-bold text-sm text-[#0F766E]">
                      {goal.horizonYears} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={goal.horizonYears}
                    onChange={(e) => handleUpdateGoal(goal.id, { horizonYears: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5B6572]">
                    <span>1 yr</span>
                    <span>5 yrs</span>
                    <span>15 yrs</span>
                    <span>30 yrs</span>
                  </div>
                </div>
              </div>

              {/* Goal Assessment Output Bar */}
              <div className="p-3 rounded-xl bg-white border border-[#E7E5DF] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-[#5B6572]">Required Monthly SIP:</span>
                  <strong className="text-sm font-serif font-bold text-[#0B1220]">
                    {formatINR(reqSIP)}/mo
                  </strong>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#5B6572]">Horizon Target Mix:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {allocation.equity}% Equity
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                    {allocation.debt}% Debt
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                    {allocation.gold}% Gold
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Preset Goal Buttons */}
      <div className="pt-2">
        <label className="block text-xs font-semibold text-[#5B6572] mb-2 uppercase tracking-wider">
          + Add Another Milestone Goal
        </label>
        <div className="flex flex-wrap gap-2">
          {(['Retirement', 'House', 'Education', 'Child', 'Emergency', 'Other'] as GoalCategory[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleAddGoal(cat)}
                className="px-3 py-1.5 rounded-xl border border-[#E7E5DF] bg-white hover:border-[#0F766E] text-xs font-medium text-[#0B1220] hover:text-[#0F766E] transition-all flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{cat === 'Emergency' ? 'Emergency Fund' : cat}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
