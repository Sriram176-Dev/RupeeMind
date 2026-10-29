import React from 'react';
import type { UserProfile } from '../../types';

interface OnboardingStepDemographicsProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  occupations: string[];
}

export const OnboardingStepDemographics: React.FC<OnboardingStepDemographicsProps> = ({
  profileData,
  setProfileData,
  occupations,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
          STEP 1 • PERSONAL PROFILE
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          Tell us about your background
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
          Your age and income stability establish your foundational risk capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div>
          <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
            Your Age (Years)
          </label>
          <input
            type="number"
            min={18}
            max={90}
            value={profileData.age}
            onChange={(e) => setProfileData({ ...profileData, age: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
          />
          <span className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] mt-1 block">
            Younger investors have higher compounding capacity.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
            City of Residence
          </label>
          <input
            type="text"
            value={profileData.city}
            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
            placeholder="e.g. Mumbai, Bengaluru, Pune"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-2">
          Occupation Sector
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {occupations.map((occ) => (
            <button
              key={occ}
              type="button"
              onClick={() => setProfileData({ ...profileData, occupation: occ as UserProfile['occupation'] })}
              className={`p-3.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                profileData.occupation === occ
                  ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 text-[#0F766E] dark:text-emerald-300'
                  : 'border-[#E7E5DF] dark:border-[#1F2933] hover:border-[#0F766E]/40 text-[#0B1220] dark:text-[#E8EDF2]'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
