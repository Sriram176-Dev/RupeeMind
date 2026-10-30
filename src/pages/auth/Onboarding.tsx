import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, FinancialGoalItem } from '../../types';
import {
  calculateRiskTolerance,
  calculateRiskCapacity,
  synthesizeEffectiveRisk,
  assessIndividualGoals,
  calculateFinancialHealthScore,
} from '../../lib/scoring';
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
  OnboardingStepExperience,
  OnboardingSummaryView,
} from '../../components/onboarding';

const DRAFT_KEY = 'rupeemind_onboarding_draft';

export const Onboarding: React.FC = () => {
  const { user, saveUserProfile } = useAuth();
  const navigate = useNavigate();

  // Try to restore saved draft from localStorage
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [step, setStep] = useState<number>(savedDraft?.step || 1);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize initial goals
  const initialGoals: FinancialGoalItem[] = savedDraft?.profileData?.goals && savedDraft.profileData.goals.length > 0
    ? savedDraft.profileData.goals
    : user?.profile?.goals && user.profile.goals.length > 0
    ? user.profile.goals
    : [
        {
          id: 'goal-primary',
          name: user?.profile?.goalType || 'Wealth Creation',
          category: (user?.profile?.goalType as any) || 'Wealth creation',
          targetAmount: user?.profile?.targetAmount || 2500000,
          horizonYears: user?.profile?.horizonYears || 7,
          priority: 'Important',
        },
      ];

  // Form State - initialized from draft, user profile, or empty
  const [profileData, setProfileData] = useState<UserProfile>(() => {
    if (savedDraft?.profileData) {
      return savedDraft.profileData;
    }
    return {
      age: user?.profile?.age ?? ('' as unknown as number),
      occupation: user?.profile?.occupation || 'Private',
      city: user?.profile?.city || '',
      monthlyIncome: user?.profile?.monthlyIncome ?? ('' as unknown as number),
      monthlyExpenses: user?.profile?.monthlyExpenses ?? ('' as unknown as number),
      monthlyEMIs: user?.profile?.monthlyEMIs ?? 0,
      monthlySavings: user?.profile?.monthlySavings ?? ('' as unknown as number),
      emergencyFundAmount: user?.profile?.emergencyFundAmount ?? 0,
      goalType: user?.profile?.goalType || 'Wealth creation',
      targetAmount: user?.profile?.targetAmount || 2500000,
      horizonYears: user?.profile?.horizonYears || 7,
      goals: initialGoals,
      quizScores: user?.profile?.quizScores || [],
      hasLifeInsurance: user?.profile?.hasLifeInsurance ?? false,
      hasHealthInsurance: user?.profile?.hasHealthInsurance ?? false,
      dependentsCount: user?.profile?.dependentsCount ?? 0,
      investingExperience: user?.profile?.investingExperience || 'Beginner',
      investingRegularity: user?.profile?.investingRegularity || 'Regularly',
    };
  });

  // Keep draft updated in localStorage so details are never lost on reload or sleep
  useEffect(() => {
    if (!isFinished) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, profileData }));
      } catch {}
    }
  }, [step, profileData, isFinished]);

  // Synchronize with user profile if it loads later and no manual draft exists
  useEffect(() => {
    if (user?.profile && !savedDraft) {
      setProfileData((prev) => ({
        ...prev,
        age: user.profile?.age ?? prev.age,
        occupation: user.profile?.occupation || prev.occupation,
        city: user.profile?.city || prev.city,
        monthlyIncome: user.profile?.monthlyIncome ?? prev.monthlyIncome,
        monthlyExpenses: user.profile?.monthlyExpenses ?? prev.monthlyExpenses,
        monthlyEMIs: user.profile?.monthlyEMIs ?? prev.monthlyEMIs,
        monthlySavings: user.profile?.monthlySavings ?? prev.monthlySavings,
        emergencyFundAmount: user.profile?.emergencyFundAmount ?? prev.emergencyFundAmount,
        goalType: user.profile?.goalType || prev.goalType,
        targetAmount: user.profile?.targetAmount ?? prev.targetAmount,
        horizonYears: user.profile?.horizonYears ?? prev.horizonYears,
        goals: user.profile?.goals && user.profile.goals.length > 0 ? user.profile.goals : prev.goals,
        quizScores: user.profile?.quizScores && user.profile.quizScores.length > 0 ? user.profile.quizScores : prev.quizScores,
        hasLifeInsurance: user.profile?.hasLifeInsurance ?? prev.hasLifeInsurance,
        hasHealthInsurance: user.profile?.hasHealthInsurance ?? prev.hasHealthInsurance,
        dependentsCount: user.profile?.dependentsCount ?? prev.dependentsCount,
        investingExperience: user.profile?.investingExperience || prev.investingExperience,
        investingRegularity: user.profile?.investingRegularity || prev.investingRegularity,
      }));
    }
  }, [user?.profile]);

  // Quiz Questions (Scored 1 - 5: Pure Psychological Loss Aversion & Volatility Tolerance)
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

  const handleNext = async () => {
    // Step-by-step validations
    if (step === 1) {
      if (!profileData.age || profileData.age < 18) {
        toast.error('Please enter a valid age (18 or older).');
        return;
      }
      if (!profileData.city?.trim()) {
        toast.error('Please enter your city of residence.');
        return;
      }
    } else if (step === 2) {
      if (!profileData.monthlyIncome || profileData.monthlyIncome <= 0) {
        toast.error('Please enter your monthly income.');
        return;
      }
      if (profileData.monthlyExpenses === undefined || profileData.monthlyExpenses === ('' as unknown as number)) {
        toast.error('Please enter your monthly expenses.');
        return;
      }
    } else if (step === 3) {
      if (!profileData.goals || profileData.goals.length === 0) {
        toast.error('Please add at least one financial goal.');
        return;
      }
    } else if (step === 4) {
      if (!profileData.quizScores || profileData.quizScores.length < 5 || profileData.quizScores.some((s) => !s)) {
        toast.error('Please answer all 5 risk scenarios to evaluate your behavioral risk tolerance.');
        return;
      }
    }

    if (step < 6) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        // Step 6 completed: Execute Redesigned Assessment Engine
        const monthlySurplus = Math.max(
          0,
          (profileData.monthlyIncome || 0) - (profileData.monthlyExpenses || 0) - (profileData.monthlyEMIs || 0)
        );

        const tolerance = calculateRiskTolerance(profileData);
        const capacity = calculateRiskCapacity(profileData);
        const effective = synthesizeEffectiveRisk(tolerance, capacity, profileData);
        const goalsAssessment = assessIndividualGoals(profileData.goals || [], monthlySurplus);
        const health = calculateFinancialHealthScore(profileData);

        const updated: UserProfile = {
          ...profileData,
          monthlySavings: monthlySurplus,
          // Tolerance vs Capacity separation
          riskToleranceScore: tolerance.score,
          riskToleranceBand: tolerance.band,
          riskCapacityScore: capacity.score,
          riskCapacityBand: capacity.band,
          // Effective / Constrained synthesis
          effectiveRiskScore: effective.effectiveScore,
          effectiveRiskBand: effective.effectiveBand,
          isRiskConstrained: effective.isConstrained,
          riskConstraintReason: effective.constraintReason,
          // Individually assessed goals
          goalsAssessment,
          // Compatibility aliases
          riskScore: effective.effectiveScore,
          riskBand: effective.effectiveBand,
          financialHealthScore: health.score,
          financialHealthBand: health.band,
          calculatedAt: new Date().toISOString(),
        };

        setProfileData(updated);
        await saveUserProfile(updated);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setIsFinished(true);
        toast.success('Your dual-engine investor profile has been generated!');
      } catch (err: any) {
        console.error('Failed to save user profile:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Failed to save your profile. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Live computed scores for summary view
  const monthlySurplus = Math.max(
    0,
    (profileData.monthlyIncome || 0) - (profileData.monthlyExpenses || 0) - (profileData.monthlyEMIs || 0)
  );
  const toleranceResult = calculateRiskTolerance(profileData);
  const capacityResult = calculateRiskCapacity(profileData);
  const effectiveResult = synthesizeEffectiveRisk(toleranceResult, capacityResult, profileData);
  const goalsSummary = assessIndividualGoals(profileData.goals || [], monthlySurplus);
  const healthResult = calculateFinancialHealthScore(profileData);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {!isFinished ? (
        <div className="space-y-8">
          {/* Progress Header */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#5B6572] mb-2">
              <span className="uppercase tracking-wider">Step {step} of 6</span>
              <span>
                {step === 1 && 'Basic Demographics'}
                {step === 2 && 'Cash Flow & Balance Sheet'}
                {step === 3 && 'Individually Assessable Goals'}
                {step === 4 && 'Psychological Risk Tolerance'}
                {step === 5 && 'Risk Capacity & Protection'}
                {step === 6 && 'Market Experience & Habits'}
              </span>
            </div>
            <div className="w-full bg-[#E7E5DF] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0F766E] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E7E5DF] shadow-lg animate-in fade-in duration-200">
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
              />
            )}

            {step === 6 && (
              <OnboardingStepExperience
                profileData={profileData}
                setProfileData={setProfileData}
                experiences={experiences}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-[#E7E5DF] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-[#E7E5DF] text-xs sm:text-sm font-semibold text-[#0B1220] hover:bg-black/5 transition-all flex items-center gap-1.5 min-h-[44px]"
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
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 min-h-[44px]"
              >
                <span>
                  {isSubmitting
                    ? 'Saving Profile...'
                    : step === 6
                    ? 'Generate Fiduciary Assessment'
                    : 'Next Step'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <OnboardingSummaryView
          toleranceScore={toleranceResult.score}
          toleranceBand={toleranceResult.band}
          capacityScore={capacityResult.score}
          capacityBand={capacityResult.band}
          effectiveScore={effectiveResult.effectiveScore}
          effectiveBand={effectiveResult.effectiveBand}
          isConstrained={effectiveResult.isConstrained}
          constraintReason={effectiveResult.constraintReason}
          goalsSummary={goalsSummary}
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
