import React from 'react';
import type { UserProfile } from '../../types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCompactINR } from '../../lib/utils';
import { CheckCircle2, LucideIcon } from 'lucide-react';

export interface GoalTypeOption {
  type: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

interface OnboardingStepGoalsProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  goalTypes: GoalTypeOption[];
}

export const OnboardingStepGoals: React.FC<OnboardingStepGoalsProps> = ({
  profileData,
  setProfileData,
  goalTypes,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
          STEP 3 • GOALS & HORIZON
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          What are you investing towards?
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
          Your time horizon directly dictates the ratio of equities versus debt in your portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {goalTypes.map((g) => {
          const Icon = g.icon;
          const isSelected = profileData.goalType === g.type;
          return (
            <button
              key={g.type}
              type="button"
              onClick={() => setProfileData({ ...profileData, goalType: g.type as UserProfile['goalType'] })}
              className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 shadow-xs'
                  : 'border-[#E7E5DF] dark:border-[#1F2933] hover:border-[#0F766E]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[#0F766E] dark:text-emerald-400' : 'text-[#5B6572]'}`} />
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0F766E] dark:text-emerald-400" />}
              </div>
              <div>
                <p className="font-bold text-sm text-[#0B1220] dark:text-[#E8EDF2]">{g.label}</p>
                <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] mt-0.5">{g.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#E7E5DF] dark:border-[#1F2933]">
        <CurrencyInput
          label="Target Corpus Amount (INR)"
          value={profileData.targetAmount}
          onChange={(val) => setProfileData({ ...profileData, targetAmount: val })}
          min={100000}
          max={100000000}
          step={500000}
          helperText={formatCompactINR(profileData.targetAmount)}
        />

        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <label className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">Time Horizon (Years)</label>
            <span className="font-serif font-bold text-sm text-[#0F766E] dark:text-emerald-400">
              {profileData.horizonYears} Years
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={profileData.horizonYears}
            onChange={(e) => setProfileData({ ...profileData, horizonYears: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
          />
          <div className="flex justify-between text-[10px] text-[#5B6572] dark:text-[#8A97A6] mt-1">
            <span>1 Year</span>
            <span>10 Years</span>
            <span>30 Years</span>
          </div>
        </div>
      </div>
    </div>
  );
};
