import React from 'react';
import type { UserProfile } from '../../types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatINR } from '../../lib/utils';

interface OnboardingStepCashFlowProps {
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const OnboardingStepCashFlow: React.FC<OnboardingStepCashFlowProps> = ({
  profileData,
  setProfileData,
}) => {
  const investibleSurplus = Math.max(
    0,
    profileData.monthlyIncome - profileData.monthlyExpenses - profileData.monthlyEMIs
  );
  const savingsRate = (
    (investibleSurplus / (profileData.monthlyIncome || 1)) *
    100
  ).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
          STEP 2 • FINANCIAL HEALTH
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          Monthly Cash Flow & Liquidity
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
          Used to calculate your savings rate, debt-to-income EMI load, and emergency resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <CurrencyInput
          label="Monthly Take-Home Income"
          value={profileData.monthlyIncome}
          onChange={(val) => setProfileData({ ...profileData, monthlyIncome: val })}
          min={10000}
          max={500000}
          step={5000}
        />

        <CurrencyInput
          label="Monthly Living Expenses"
          value={profileData.monthlyExpenses}
          onChange={(val) => setProfileData({ ...profileData, monthlyExpenses: val })}
          min={5000}
          max={300000}
          step={2500}
        />

        <CurrencyInput
          label="Monthly Loan EMIs / Debt"
          value={profileData.monthlyEMIs}
          onChange={(val) => setProfileData({ ...profileData, monthlyEMIs: val })}
          min={0}
          max={200000}
          step={2500}
          helperText="Home loans, auto loans, personal loans"
        />

        <CurrencyInput
          label="Emergency Fund in Bank / Liquid"
          value={profileData.emergencyFundAmount}
          onChange={(val) => setProfileData({ ...profileData, emergencyFundAmount: val })}
          min={0}
          max={2000000}
          step={25000}
          helperText={`Currently covers ${(profileData.emergencyFundAmount / (profileData.monthlyExpenses || 1)).toFixed(1)} months of expenses`}
        />
      </div>

      <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#5B6572] dark:text-[#8A97A6]">
            Estimated Monthly Investible Surplus
          </span>
          <p className="font-serif text-xl font-bold text-[#0F766E] dark:text-emerald-400">
            {formatINR(investibleSurplus)}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
          {savingsRate}% Savings Rate
        </span>
      </div>
    </div>
  );
};
