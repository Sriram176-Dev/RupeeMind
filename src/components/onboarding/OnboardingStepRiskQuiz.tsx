import React from 'react';
import type { UserProfile } from '../../types';

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
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
          STEP 4 • BEHAVIORAL RISK QUIZ
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          5 Real-World Volatility Scenarios
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
          Honest answers ensure we never recommend portfolios that cause panic selling.
        </p>
      </div>

      <div className="space-y-6 pt-2">
        {quizQuestions.map((q) => (
          <div
            key={q.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] space-y-3"
          >
            <p className="font-semibold text-xs sm:text-sm text-[#0B1220] dark:text-[#E8EDF2]">
              {q.id + 1}. {q.question}
            </p>
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
                        ? 'bg-white dark:bg-[#121821] border-[#0F766E] dark:border-emerald-500 font-semibold text-[#0F766E] dark:text-emerald-300 shadow-xs'
                        : 'bg-white/60 dark:bg-[#121821]/60 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-[#5B6572] dark:text-[#8A97A6]'
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
