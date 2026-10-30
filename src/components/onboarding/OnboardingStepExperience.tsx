import React from 'react';
import type { UserProfile } from '../../types';
import { Award, Repeat, CheckCircle2, BookOpen } from 'lucide-react';

interface OnboardingStepExperienceProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  experiences: readonly string[];
}

export const OnboardingStepExperience: React.FC<OnboardingStepExperienceProps> = ({
  profileData,
  setProfileData,
  experiences,
}) => {
  const habits = [
    {
      value: 'Regularly',
      label: 'Disciplined Monthly SIPs',
      desc: 'Automated recurring investments every month on salary day.',
    },
    {
      value: 'Occasionally',
      label: 'Occasional Lumpsum',
      desc: 'Invest opportunistically when bonus or surplus funds accumulate.',
    },
    {
      value: 'Not yet',
      label: 'First-Time Investor',
      desc: 'Starting my structured wealth creation journey today.',
    },
  ] as const;

  const experienceDescriptions: Record<string, string> = {
    None: 'New to stock markets & mutual funds',
    Beginner: '< 2 years in mutual funds or fixed deposits',
    Intermediate: '2-5 years investing in direct equities & funds',
    Experienced: '5+ years active portfolio management & cycles',
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
          STEP 6 • MARKET EXPERIENCE & HABITS
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] mt-1">
          Investment Track Record & Regularity
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
          Calibrates portfolio recommendations to match your familiarity with capital market cycles.
        </p>
      </div>

      {/* Prior Experience Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6572] flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#0F766E]" />
          <span>Prior Capital Market Experience</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {experiences.map((exp) => {
            const isSelected = profileData.investingExperience === exp;
            return (
              <button
                key={exp}
                type="button"
                onClick={() =>
                  setProfileData({
                    ...profileData,
                    investingExperience: exp as UserProfile['investingExperience'],
                  })
                }
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#E6F4F1] border-[#0F766E] shadow-2xs'
                    : 'bg-[#FAFAF7] border-[#E7E5DF] hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-[#0B1220]">{exp}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />}
                </div>
                <p className="text-xs text-[#5B6572]">{experienceDescriptions[exp] || exp}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Investing Regularity */}
      <div className="space-y-3 pt-4 border-t border-[#E7E5DF]">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6572] flex items-center gap-1.5">
          <Repeat className="w-4 h-4 text-[#0F766E]" />
          <span>How Regularly Do You Plan to Invest?</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {habits.map((h) => {
            const isSelected = profileData.investingRegularity === h.value;
            return (
              <button
                key={h.value}
                type="button"
                onClick={() =>
                  setProfileData({
                    ...profileData,
                    investingRegularity: h.value as UserProfile['investingRegularity'],
                  })
                }
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#E6F4F1] border-[#0F766E] shadow-2xs'
                    : 'bg-[#FAFAF7] border-[#E7E5DF] hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm text-[#0B1220]">{h.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />}
                </div>
                <p className="text-[11px] text-[#5B6572]">{h.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guidance Note */}
      <div className="p-3.5 rounded-xl bg-gray-50 border border-[#E7E5DF] flex items-center gap-2.5 text-xs text-[#5B6572]">
        <BookOpen className="w-4 h-4 text-[#0F766E] shrink-0" />
        <span>
          Automating your monthly SIPs on salary day removes emotional timing and harnesses Rupee Cost Averaging automatically.
        </span>
      </div>
    </div>
  );
};

