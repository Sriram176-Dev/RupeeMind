import React from 'react';
import { Sparkles } from 'lucide-react';

interface RecommendationLoadingStepperProps {
  loadingSteps: string[];
  loadingStepIndex: number;
}

export const RecommendationLoadingStepper: React.FC<RecommendationLoadingStepperProps> = ({
  loadingSteps,
  loadingStepIndex,
}) => {
  return (
    <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#E7E5DF] shadow-md text-center space-y-6 max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center mx-auto animate-bounce">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-[#0B1220]">
          AI Portfolio Synthesis in Progress
        </h2>
        <p className="text-xs sm:text-sm text-[#0F766E] font-semibold min-h-[24px]">
          {loadingSteps[loadingStepIndex]}
        </p>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0F766E] rounded-full transition-all duration-300"
          style={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
