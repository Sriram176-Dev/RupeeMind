import React from 'react';
import { ScoreGauge } from '../ui/ScoreGauge';
import {
  Sparkles,
  Shield,
  Compass,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Target,
  DollarSign,
  Info,
} from 'lucide-react';
import type {
  RiskBand,
  HealthBand,
  CapacityBand,
  FinancialGoalItem,
  GoalsAssessmentSummary,
} from '../../types';
import { formatCompactINR, formatINR } from '../../lib/utils';

interface OnboardingSummaryViewProps {
  // Psychological & Structural Split
  toleranceScore: number;
  toleranceBand: RiskBand;
  capacityScore: number;
  capacityBand: CapacityBand;
  effectiveScore: number;
  effectiveBand: RiskBand;
  isConstrained: boolean;
  constraintReason: string;

  // Goals Assessment
  goalsSummary?: GoalsAssessmentSummary;

  // Financial Health
  healthScore: number;
  healthBand: HealthBand;
  tips: string[];

  // Navigation
  onGoToRecommendations: () => void;
  onGoToDashboard: () => void;
}

export const OnboardingSummaryView: React.FC<OnboardingSummaryViewProps> = ({
  toleranceScore,
  toleranceBand,
  capacityScore,
  capacityBand,
  effectiveScore,
  effectiveBand,
  isConstrained,
  constraintReason,
  goalsSummary,
  healthScore,
  healthBand,
  tips,
  onGoToRecommendations,
  onGoToDashboard,
}) => {
  return (
    <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E7E5DF] shadow-xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.08em] bg-[#E6F4F1] text-[#0F766E] border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FIDUCIARY ASSESSMENT COMPLETE</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220]">
          Your Dual-Engine Investor Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] max-w-xl mx-auto">
          We separate your psychological appetite for risk from your structural financial ability to absorb losses, ensuring your portfolio never forces distress selling.
        </p>
      </div>

      {/* DUAL ENGINE: TOLERANCE VS CAPACITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Psychological Risk Tolerance */}
        <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex flex-col items-center justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <Compass className="w-4 h-4" />
              <span>Risk Tolerance (Willingness)</span>
            </div>
            <p className="text-[11px] text-[#5B6572]">
              Psychological comfort with market drawdowns & volatility
            </p>
          </div>
          <ScoreGauge
            score={toleranceScore}
            size={130}
            label={toleranceBand}
            sublabel="Behavioral Tolerance"
            type="risk"
          />
        </div>

        {/* Financial Risk Capacity */}
        <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex flex-col items-center justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Shield className="w-4 h-4" />
              <span>Risk Capacity (Ability)</span>
            </div>
            <p className="text-[11px] text-[#5B6572]">
              Balance sheet strength, liquidity cushion & debt buffer
            </p>
          </div>
          <ScoreGauge
            score={capacityScore}
            size={130}
            label={`${capacityBand} Capacity`}
            sublabel="Financial Resilience"
            type="health"
          />
        </div>
      </div>

      {/* SYNTHESIZED EFFECTIVE RISK POSTURE & CONSTRAINT CARD */}
      <div className={`p-5 sm:p-6 rounded-2xl border text-left max-w-2xl mx-auto space-y-3 transition-all ${
        isConstrained
          ? 'bg-amber-50/80 border-amber-300'
          : 'bg-[#E6F4F1]/60 border-[#0F766E]/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isConstrained ? (
              <Lock className="w-5 h-5 text-amber-700" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
            )}
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#0B1220]">
              Effective Target Posture: <span className="text-[#0F766E]">{effectiveBand}</span>
            </h2>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isConstrained
              ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {isConstrained ? 'Fiduciary Constraint Applied' : 'Harmoniously Aligned'}
          </span>
        </div>

        <p className="text-xs text-[#0B1220] leading-relaxed">
          {constraintReason}
        </p>
      </div>

      {/* INDIVIDUALLY ASSESSED FINANCIAL GOALS BREAKDOWN */}
      {goalsSummary && goalsSummary.goals.length > 0 && (
        <div className="text-left max-w-2xl mx-auto space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <Target className="w-4 h-4" />
              <span>Individually Assessed Milestones ({goalsSummary.goals.length})</span>
            </div>
            <span className="text-xs text-[#5B6572]">
              Total Required: <strong className="text-[#0B1220]">{formatINR(goalsSummary.totalMonthlySIPRequired)}/mo</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {goalsSummary.goals.map((goal) => {
              const reqSIP = goal.requiredMonthlySIP ?? 0;
              const alloc = goal.recommendedAllocation ?? { equity: 50, debt: 40, gold: 10 };

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B1220]">{goal.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        goal.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : goal.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5B6572]">
                      Target: <strong className="text-[#0B1220]">{formatCompactINR(goal.targetAmount)}</strong> in{' '}
                      <strong>{goal.horizonYears} Years</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-[#5B6572] uppercase tracking-wider block">
                        Monthly SIP
                      </span>
                      <strong className="text-sm font-serif font-bold text-[#0F766E]">
                        {formatINR(reqSIP)}
                      </strong>
                    </div>

                    <div className="border-l border-[#E7E5DF] pl-3 text-left">
                      <span className="text-[10px] text-[#5B6572] uppercase tracking-wider block">
                        Target Asset Mix
                      </span>
                      <span className="text-[11px] font-semibold text-[#0B1220]">
                        {alloc.equity}% Eq / {alloc.debt}% Debt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actionable Improvement Tips & Fiduciary Directives */}
      <div className="text-left max-w-2xl mx-auto space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
          <Lightbulb className="w-4 h-4" />
          <span>Fiduciary Action Directives</span>
        </div>
        <div className="space-y-2">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-start gap-2.5 text-xs text-[#0B1220] leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-[#E6F4F1] text-[#0F766E] font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onGoToRecommendations}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all shadow-md flex items-center justify-center gap-2 min-h-[48px]"
        >
          <span>See Constrained Fund Recommendations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-[#0B1220] bg-white border border-[#E7E5DF] hover:bg-black/5 transition-all min-h-[48px]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
