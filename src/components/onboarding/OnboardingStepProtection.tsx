import React from 'react';
import type { UserProfile } from '../../types';

interface OnboardingStepProtectionProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  experiences: readonly string[];
}

export const OnboardingStepProtection: React.FC<OnboardingStepProtectionProps> = ({
  profileData,
  setProfileData,
  experiences,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
          STEP 5 • PROTECTION & EXPERIENCE
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          Insurance Shield & Investing Experience
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
          Ensuring adequate downside protection before scaling investment risk.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <label className="p-4 rounded-2xl border border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#0B0F14] flex items-center justify-between cursor-pointer hover:border-[#0F766E]/40 transition-colors">
          <div>
            <p className="font-semibold text-xs sm:text-sm text-[#0B1220] dark:text-[#E8EDF2]">Term Life Insurance</p>
            <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">Pure risk cover for family dependents</p>
          </div>
          <input
            type="checkbox"
            checked={profileData.hasLifeInsurance}
            onChange={(e) => setProfileData({ ...profileData, hasLifeInsurance: e.target.checked })}
            className="w-5 h-5 rounded-md text-[#0F766E] focus:ring-emerald-500 accent-[#0F766E]"
          />
        </label>

        <label className="p-4 rounded-2xl border border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#0B0F14] flex items-center justify-between cursor-pointer hover:border-[#0F766E]/40 transition-colors">
          <div>
            <p className="font-semibold text-xs sm:text-sm text-[#0B1220] dark:text-[#E8EDF2]">Health Insurance</p>
            <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">Individual or family floater health cover</p>
          </div>
          <input
            type="checkbox"
            checked={profileData.hasHealthInsurance}
            onChange={(e) => setProfileData({ ...profileData, hasHealthInsurance: e.target.checked })}
            className="w-5 h-5 rounded-md text-[#0F766E] focus:ring-emerald-500 accent-[#0F766E]"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#E7E5DF] dark:border-[#1F2933]">
        <div>
          <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
            Number of Financial Dependents
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setProfileData({ ...profileData, dependentsCount: num })}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  profileData.dependentsCount === num
                    ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 text-[#0F766E] dark:text-emerald-300'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2]'
                }`}
              >
                {num === 3 ? '3+' : num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
            Prior Stock/Mutual Fund Experience
          </label>
          <div className="grid grid-cols-2 gap-2">
            {experiences.map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setProfileData({ ...profileData, investingExperience: exp as UserProfile['investingExperience'] })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  profileData.investingExperience === exp
                    ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 text-[#0F766E] dark:text-emerald-300'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2]'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E7E5DF] dark:border-[#1F2933]">
        <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
          How regularly do you invest?
        </label>
        <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] mb-2.5">
          Used to gauge financial discipline and investing habit score.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['Regularly', 'Occasionally', 'Not yet'] as const).map((habit) => {
            const isSelected = (profileData.investingRegularity || 'Occasionally') === habit;
            return (
              <button
                key={habit}
                type="button"
                onClick={() => setProfileData({ ...profileData, investingRegularity: habit })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 text-[#0F766E] dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2] hover:border-[#0F766E]/40'
                }`}
              >
                <span>{habit}</span>
                <span className="text-[10px] font-normal opacity-80">
                  {habit === 'Regularly' ? 'Monthly SIPs' : habit === 'Occasionally' ? 'Ad-hoc lump sum' : 'Starting out'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
