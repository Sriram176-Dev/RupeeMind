import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../types';
import { calculateRiskScore, calculateFinancialHealthScore } from '../../lib/scoring';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Target,
  Compass,
  Zap,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  OnboardingStepDemographics,
  OnboardingStepCashFlow,
  OnboardingStepGoals,
  OnboardingStepRiskQuiz,
  OnboardingStepProtection,
  OnboardingSummaryView,
} from '../../components/onboarding';

export const Onboarding: React.FC = () => {
  const { user, saveUserProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState<UserProfile>({
    age: user?.profile?.age || 28,
    occupation: user?.profile?.occupation || 'Private',
    city: user?.profile?.city || 'Bengaluru',
    monthlyIncome: user?.profile?.monthlyIncome || 80000,
    monthlyExpenses: user?.profile?.monthlyExpenses || 40000,
    monthlyEMIs: user?.profile?.monthlyEMIs || 10000,
    monthlySavings: user?.profile?.monthlySavings || 30000,
    emergencyFundAmount: user?.profile?.emergencyFundAmount || 240000,
    goalType: user?.profile?.goalType || 'Wealth creation',
    targetAmount: user?.profile?.targetAmount || 10000000, // 1 Cr
    horizonYears: user?.profile?.horizonYears || 7,
    quizScores: user?.profile?.quizScores || [3, 4, 3, 4, 3],
    hasLifeInsurance: user?.profile?.hasLifeInsurance ?? true,
    hasHealthInsurance: user?.profile?.hasHealthInsurance ?? true,
    dependentsCount: user?.profile?.dependentsCount ?? 1,
    investingExperience: user?.profile?.investingExperience || 'Beginner',
    investingRegularity: user?.profile?.investingRegularity || 'Occasionally',
  });

  // Quiz Questions (Scored 1 - 5)
  const quizQuestions = [
    {
      id: 0,
      question: 'Your portfolio drops 20% in a broad market correction. What is your immediate reaction?',
      options: [
        { label: 'Panic and sell all holdings to prevent further loss', score: 1 },
        { label: 'Sell some volatile portions and move to bank FD', score: 2 },
        { label: 'Do nothing and wait for market recovery', score: 3 },
        { label: 'Invest some additional funds to lower average cost', score: 4 },
        { label: 'Aggressively deploy reserve cash into quality equities', score: 5 },
      ],
    },
    {
      id: 1,
      question: 'How do you describe your primary investment philosophy?',
      options: [
        { label: 'Preserve capital at all costs; zero tolerance for capital loss', score: 1 },
        { label: 'Beat inflation with modest returns and minimal volatility', score: 2 },
        { label: 'Balanced mix of stability and capital appreciation', score: 3 },
        { label: 'High long-term capital growth, accepting occasional 15-25% swings', score: 4 },
        { label: 'Maximum aggressive growth and high alpha opportunities', score: 5 },
      ],
    },
    {
      id: 2,
      question: 'When an investment experiences 6 months of flat or negative returns, you usually:',
      options: [
        { label: 'Exit immediately and switch to fixed deposits', score: 1 },
        { label: 'Feel anxious and continuously monitor NAV daily', score: 2 },
        { label: 'Review fund fundamentals before making any decision', score: 3 },
        { label: 'Stick to the automated SIP without emotional disturbance', score: 4 },
        { label: 'View it as an extended compounding accumulation window', score: 5 },
      ],
    },
    {
      id: 3,
      question: 'What is your comfort level with stock market fluctuations?',
      options: [
        { label: 'Cannot sleep peacefully if portfolio drops even 5%', score: 1 },
        { label: 'Uncomfortable with more than 10% drawdowns', score: 2 },
        { label: 'Comfortable with normal 10-15% annual market volatility', score: 3 },
        { label: 'Understand that volatility is the price of high returns', score: 4 },
        { label: 'Thrive on market volatility to buy great assets at discounts', score: 5 },
      ],
    },
    {
      id: 4,
      question: 'How long do you plan to keep your core wealth invested without withdrawal?',
      options: [
        { label: 'Less than 1 year (Short term parking)', score: 1 },
        { label: '1 to 3 years', score: 2 },
        { label: '3 to 5 years', score: 3 },
        { label: '5 to 10 years', score: 4 },
        { label: 'More than 10 years (Generational compounding)', score: 5 },
      ],
    },
  ];

  const goalTypes = [
    { type: 'Wealth creation', label: 'Wealth Creation', desc: 'Long-term equity compounding & financial freedom', icon: TrendingUp },
    { type: 'Retirement', label: 'Retirement Corpus', desc: 'Build inflation-proof post-career independence', icon: Shield },
    { type: 'House', label: 'Buy a House', desc: 'Save down payment for dream home in 3-7 yrs', icon: Target },
    { type: 'Education', label: 'Higher Education', desc: 'Fund master’s or overseas specialization', icon: Compass },
    { type: 'Child', label: 'Child Future', desc: 'Higher education & marriage milestones', icon: HeartHandshake },
    { type: 'Tax saving', label: 'Tax Saving (80C)', desc: 'ELSS tax saving with 3-year lock-in', icon: Zap },
  ];

  const occupations = ['Government', 'Private', 'Business', 'Freelance', 'Student', 'Other'] as const;
  const experiences = ['None', 'Beginner', 'Intermediate', 'Experienced'] as const;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Calculate and finish
      const risk = calculateRiskScore(profileData);
      const health = calculateFinancialHealthScore(profileData);

      const updated = {
        ...profileData,
        riskScore: risk.score,
        riskBand: risk.band,
        financialHealthScore: health.score,
        financialHealthBand: health.band,
      };

      setProfileData(updated);
      saveUserProfile(updated);
      setIsFinished(true);
      toast.success('Your personalized investor profile is ready!');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const riskResult = calculateRiskScore(profileData);
  const healthResult = calculateFinancialHealthScore(profileData);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {!isFinished ? (
        <div className="space-y-8">
          {/* Progress Header */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#5B6572] dark:text-[#8A97A6] mb-2">
              <span className="uppercase tracking-wider">Step {step} of 5</span>
              <span>
                {step === 1 && 'Basic Demographics'}
                {step === 2 && 'Income & Cash Flow'}
                {step === 3 && 'Financial Goals'}
                {step === 4 && 'Behavioral Risk Quiz'}
                {step === 5 && 'Protection & Experience'}
              </span>
            </div>
            <div className="w-full bg-[#E7E5DF] dark:bg-[#1F2933] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0F766E] dark:bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-lg animate-in fade-in duration-200">
            {step === 1 && (
              <OnboardingStepDemographics
                profileData={profileData}
                setProfileData={setProfileData}
                occupations={occupations as unknown as string[]}
              />
            )}

            {step === 2 && (
              <OnboardingStepCashFlow
                profileData={profileData}
                setProfileData={setProfileData}
              />
            )}

            {step === 3 && (
              <OnboardingStepGoals
                profileData={profileData}
                setProfileData={setProfileData}
                goalTypes={goalTypes}
              />
            )}

            {step === 4 && (
              <OnboardingStepRiskQuiz
                profileData={profileData}
                setProfileData={setProfileData}
                quizQuestions={quizQuestions}
              />
            )}

            {step === 5 && (
              <OnboardingStepProtection
                profileData={profileData}
                setProfileData={setProfileData}
                experiences={experiences}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] text-xs sm:text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 min-h-[44px]"
              >
                <span>{step === 5 ? 'Generate My Scores' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <OnboardingSummaryView
          riskScore={riskResult.score}
          riskBand={riskResult.band}
          healthScore={healthResult.score}
          healthBand={healthResult.band}
          tips={healthResult.tips}
          onGoToRecommendations={() => navigate('/recommendations')}
          onGoToDashboard={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default Onboarding;
