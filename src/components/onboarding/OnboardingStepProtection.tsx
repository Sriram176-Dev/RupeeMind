import React, { useMemo } from 'react';
import type { UserProfile } from '../../types';
import { calculateRiskCapacity } from '../../lib/scoring';
import { Shield, ShieldAlert, ShieldCheck, AlertCircle, Users, CheckCircle2 } from 'lucide-react';

interface OnboardingStepProtectionProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const OnboardingStepProtection: React.FC<OnboardingStepProtectionProps> = ({
  profileData,
  setProfileData,
}) => {
  const capacityResult = useMemo(() => {
    return calculateRiskCapacity(profileData);
  }, [
    profileData.monthlyIncome,
    profileData.monthlyExpenses,
    profileData.monthlyEMIs,
    profileData.emergencyFundAmount,
    profileData.hasLifeInsurance,
    profileData.hasHealthInsurance,
    profileData.dependentsCount,
    profileData.age,
    profileData.occupation,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
            STEP 5 • FINANCIAL RISK CAPACITY & PROTECTION
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] mt-1">
            Downside Resilience & Safety Net
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
            Evaluates your balance sheet's structural ability to absorb market downturns without triggering forced liquidation.
          </p>
        </div>

        {/* Live Capacity Gauge Card */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border shrink-0 text-right ${
          capacityResult.band === 'High'
            ? 'bg-emerald-50/80 border-emerald-300'
            : capacityResult.band === 'Moderate'
            ? 'bg-blue-50/80 border-blue-200'
            : 'bg-amber-50/80 border-amber-300'
        }`}>
          <span className="text-[10px] uppercase tracking-wider text-[#5B6572] font-semibold block">
            Financial Risk Capacity
          </span>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <Shield className={`w-4 h-4 ${
              capacityResult.band === 'High'
                ? 'text-emerald-700'
                : capacityResult.band === 'Moderate'
                ? 'text-blue-700'
                : 'text-amber-700'
            }`} />
            <span className={`font-serif font-bold text-sm ${
              capacityResult.band === 'High'
                ? 'text-emerald-700'
                : capacityResult.band === 'Moderate'
                ? 'text-blue-700'
                : 'text-amber-700'
            }`}>
              {capacityResult.band} Capacity ({capacityResult.score}/100)
            </span>
          </div>
        </div>
      </div>

      {/* Insurance Shields */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6572]">
          Downside Insurance Shields
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            profileData.hasLifeInsurance
              ? 'bg-[#E6F4F1] border-[#0F766E]'
              : 'bg-[#FAFAF7] border-[#E7E5DF] hover:border-gray-400'
          }`}>
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${profileData.hasLifeInsurance ? 'text-[#0F766E]' : 'text-gray-400'}`} />
                <p className="font-semibold text-xs sm:text-sm text-[#0B1220]">Term Life Insurance</p>
              </div>
              <p className="text-[11px] text-[#5B6572]">
                Pure risk cover protecting dependents against loss of earnings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={profileData.hasLifeInsurance}
              onChange={(e) => setProfileData({ ...profileData, hasLifeInsurance: e.target.checked })}
              className="w-5 h-5 rounded-md text-[#0F766E] focus:ring-emerald-500 accent-[#0F766E]"
            />
          </label>

          <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            profileData.hasHealthInsurance
              ? 'bg-[#E6F4F1] border-[#0F766E]'
              : 'bg-[#FAFAF7] border-[#E7E5DF] hover:border-gray-400'
          }`}>
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${profileData.hasHealthInsurance ? 'text-[#0F766E]' : 'text-gray-400'}`} />
                <p className="font-semibold text-xs sm:text-sm text-[#0B1220]">Health Insurance</p>
              </div>
              <p className="text-[11px] text-[#5B6572]">
                Comprehensive hospitalization cover shielding investments from medical costs.
              </p>
            </div>
            <input
              type="checkbox"
              checked={profileData.hasHealthInsurance}
              onChange={(e) => setProfileData({ ...profileData, hasHealthInsurance: e.target.checked })}
              className="w-5 h-5 rounded-md text-[#0F766E] focus:ring-emerald-500 accent-[#0F766E]"
            />
          </label>
        </div>
      </div>

      {/* Dependents Selection */}
      <div className="pt-2 border-t border-[#E7E5DF]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#0B1220] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0F766E]" />
            <span>Number of Financial Dependents</span>
          </label>
          <span className="text-[11px] text-[#5B6572]">
            Parents, spouse, or children reliant on your income
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setProfileData({ ...profileData, dependentsCount: num })}
              className={`py-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                profileData.dependentsCount === num
                  ? 'bg-[#E6F4F1] border-[#0F766E] text-[#0F766E] shadow-2xs'
                  : 'border-[#E7E5DF] bg-[#FAFAF7] text-[#0B1220] hover:border-gray-300'
              }`}
            >
              <span>{num === 3 ? '3+ Dependents' : num === 0 ? '0 (Self only)' : `${num} Dependent${num > 1 ? 's' : ''}`}</span>
              {profileData.dependentsCount === num && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity Constraint Insights */}
      {capacityResult.limitingFactors.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Balance Sheet Constraints Detected</span>
          </div>
          <div className="space-y-1">
            {capacityResult.limitingFactors.map((factor, idx) => (
              <p key={idx} className="text-xs text-amber-900 flex items-start gap-1.5 leading-relaxed">
                <span className="text-amber-600 font-bold">•</span>
                <span>{factor}</span>
              </p>
            ))}
          </div>
          <p className="text-[11px] text-amber-800/80 italic pt-1 border-t border-amber-200/60">
            * Our fiduciary algorithm will automatically constrain higher risk recommendations to protect your essential capital.
          </p>
        </div>
      )}
    </div>
  );
};
