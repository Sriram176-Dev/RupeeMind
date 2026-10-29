import React from 'react';
import { ScoreGauge } from '../ui/ScoreGauge';
import { Sparkles, Lightbulb, ArrowRight } from 'lucide-react';

interface OnboardingSummaryViewProps {
  riskScore: number;
  riskBand: string;
  healthScore: number;
  healthBand: string;
  tips: string[];
  onGoToRecommendations: () => void;
  onGoToDashboard: () => void;
}

export const OnboardingSummaryView: React.FC<OnboardingSummaryViewProps> = ({
  riskScore,
  riskBand,
  healthScore,
  healthBand,
  tips,
  onGoToRecommendations,
  onGoToDashboard,
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.08em] bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-300 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ASSESSMENT COMPLETE</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
          Your Dual Investor Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] max-w-md mx-auto">
          Based on your answers, here is your calculated risk tolerance posture and financial health score.
        </p>
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 max-w-xl mx-auto border-y border-[#E7E5DF] dark:border-[#1F2933]">
        <div className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
          <ScoreGauge
            score={riskScore}
            size={140}
            label={riskBand}
            sublabel="Investor Risk Band"
            type="risk"
          />
        </div>

        <div className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
          <ScoreGauge
            score={healthScore}
            size={140}
            label={healthBand}
            sublabel="Financial Health Score"
            type="health"
          />
        </div>
      </div>

      {/* Actionable Improvement Tips */}
      <div className="text-left max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400">
          <Lightbulb className="w-4 h-4" />
          <span>Tailored Action Points for You</span>
        </div>
        <div className="space-y-2">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex items-start gap-2.5 text-xs text-[#0B1220] dark:text-[#E8EDF2] leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-[#E6F4F1] dark:bg-emerald-950 text-[#0F766E] dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Action Button */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onGoToRecommendations}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 min-h-[48px]"
        >
          <span>See My Fund Recommendations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] hover:bg-black/5 dark:hover:bg-white/5 transition-all min-h-[48px]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
