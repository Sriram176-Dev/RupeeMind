import { describe, it, expect } from 'vitest';
import {
  calculateRiskTolerance,
  calculateRiskCapacity,
  synthesizeEffectiveRisk,
  assessIndividualGoals,
  calculateFinancialHealthScore,
} from '../lib/scoring';
import type { UserProfile } from '../types';

describe('Onboarding live scoring execution', () => {
  it('does not throw with empty initial profile data', () => {
    const profileData: UserProfile = {
      age: '' as unknown as number,
      occupation: 'Private',
      city: '',
      monthlyIncome: '' as unknown as number,
      monthlyExpenses: '' as unknown as number,
      monthlyEMIs: 0,
      monthlySavings: '' as unknown as number,
      emergencyFundAmount: 0,
      goalType: 'Wealth creation',
      targetAmount: 2500000,
      horizonYears: 7,
      goals: [
        {
          id: 'goal-primary',
          name: 'Wealth Creation',
          category: 'Wealth creation',
          targetAmount: 2500000,
          horizonYears: 7,
          priority: 'Important',
        },
      ],
      quizScores: [],
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      dependentsCount: 0,
      investingExperience: 'Beginner',
      investingRegularity: 'Regularly',
    };

    const monthlySurplus = Math.max(
      0,
      (profileData.monthlyIncome || 0) - (profileData.monthlyExpenses || 0) - (profileData.monthlyEMIs || 0)
    );

    expect(() => {
      const tolerance = calculateRiskTolerance(profileData);
      const capacity = calculateRiskCapacity(profileData);
      const effective = synthesizeEffectiveRisk(tolerance, capacity, profileData);
      const goals = assessIndividualGoals(profileData.goals || [], monthlySurplus);
      const health = calculateFinancialHealthScore(profileData);
      expect(tolerance).toBeDefined();
      expect(capacity).toBeDefined();
      expect(effective).toBeDefined();
      expect(goals).toBeDefined();
      expect(health).toBeDefined();
    }).not.toThrow();
  });
});

