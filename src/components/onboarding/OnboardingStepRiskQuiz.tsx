import React, { useMemo } from 'react';
import type { UserProfile } from '../../types';
import { calculateRiskTolerance } from '../../lib/scoring';
import { Compass, CheckCircle2 } from 'lucide-react';

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    score: number;
  }[];
}

interface OnboardingStepRiskQuizProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  quizQuestions: QuizQuestion[];
}

export const OnboardingStepRiskQuiz: React.FC<OnboardingStepRiskQuizProps> = ({
  profileData,
  setProfileData,
  quizQuestions,
}) => {
  const answeredCount = profileData.quizScores.filter(Boolean).length;
  const toleranceResult = useMemo(() => {
    return calculateRiskTolerance(profileData);
  }, [profileData.quizScores]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
            STEP 4 • PSYCHOLOGICAL RISK TOLERANCE
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] mt-1">
            Behavioral Willingness to Endure Volatility
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
            Measures your emotional comfort with market swings, evaluated separately from your balance sheet capacity.
          </p>
        </div>

        {/* Live Tolerance Status Card */}
        {answeredCount > 0 && (
          <div className="p-3 sm:p-4 rounded-2xl bg-[#E6F4F1] border border-[#0F766E]/30 shrink-0 text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#5B6572] font-semibold block">
              Tolerance Willingness
            </span>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <Compass className="w-4 h-4 text-[#0F766E]" />
              <span className="font-serif font-bold text-sm text-[#0F766E]">
                {toleranceResult.band} ({toleranceResult.score}/100)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5 pt-2">
        {quizQuestions.map((q) => (
          <div
            key={q.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-xs sm:text-sm text-[#0B1220]">
                {q.id + 1}. {q.question}
              </p>
              {profileData.quizScores[q.id] && (
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {q.options.map((opt) => {
                const isSelected = profileData.quizScores[q.id] === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => {
                      const updated = [...profileData.quizScores];
                      updated[q.id] = opt.score;
                      setProfileData({ ...profileData, quizScores: updated });
                    }}
                    className={`p-3 rounded-xl text-left text-xs border transition-all ${
                      isSelected
                        ? 'bg-white border-[#0F766E] font-semibold text-[#0F766E] shadow-2xs ring-1 ring-[#0F766E]/20'
                        : 'bg-white/70 border-transparent hover:border-gray-300 text-[#5B6572]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
