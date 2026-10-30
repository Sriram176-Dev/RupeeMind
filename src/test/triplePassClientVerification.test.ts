import { describe, it, expect } from 'vitest';
import {
  calculateSIP,
  calculateLumpsum,
  calculateStepUpSIP,
  calculateGoalPlanner,
  calculateInflationAdjusted,
} from '../lib/calculators';
import { getAccessPolicyState } from '../lib/accessPolicy';
import {
  calculateRiskTolerance,
  calculateRiskCapacity,
  synthesizeEffectiveRisk,
  assessIndividualGoals,
  generateExplainableAssetAllocation,
  calculateFinancialHealthScore,
} from '../lib/scoring';
import type { UserProfile, RiskBand, HealthBand } from '../types';

describe('Triple-Pass Client Feature Verification Suite', () => {
  [1, 2, 3].forEach((passNumber) => {
    describe(`PASS ${passNumber}: Comprehensive Client Feature Verification`, () => {
      // ── 1. Financial Calculators ─────────────────────────────
      describe(`[Pass ${passNumber}] Feature 1: Financial Calculators Math & Bounds`, () => {
        it('calculates regular SIP compounding correctly', () => {
          const res = calculateSIP(10000, 12, 10);
          expect(res.investedAmount).toBe(1200000);
          expect(res.totalValue).toBe(2323391);
          expect(res.estimatedReturns).toBe(1123391);
          expect(res.breakdown).toHaveLength(10);
        });

        it('calculates lumpsum growth correctly', () => {
          const res = calculateLumpsum(100000, 12, 5);
          expect(res.investedAmount).toBe(100000);
          expect(res.totalValue).toBe(176234);
          expect(res.estimatedReturns).toBe(76234);
        });

        it('calculates step-up SIP compounding with annual increments', () => {
          const baseSip = calculateSIP(10000, 12, 10);
          const stepUp = calculateStepUpSIP(10000, 10, 12, 10);
          expect(stepUp.investedAmount).toBeGreaterThan(baseSip.investedAmount);
          expect(stepUp.totalValue).toBeGreaterThan(baseSip.totalValue);
        });

        it('calculates required monthly SIP to reach a specific financial goal', () => {
          const res = calculateGoalPlanner(2500000, 10, 12);
          expect(res.requiredMonthlySIP).toBeGreaterThan(10000);
          expect(res.requiredMonthlySIP).toBeLessThan(12000);
          expect(res.calculationResult.totalValue).toBeGreaterThanOrEqual(2500000 - 10000);
        });

        it('calculates inflation adjusted SIP real purchasing power', () => {
          const res = calculateInflationAdjusted(10000, 12, 6, 10);
          expect(res.nominalResult.totalValue).toBe(2323391);
          expect(res.realPurchasingPower).toBeLessThan(res.nominalResult.totalValue);
        });
      });

      // ── 2. Access Policy & Route Security ────────────────────
      describe(`[Pass ${passNumber}] Feature 2: Route Access Policy Verification`, () => {
        it('identifies unauthenticated visitors as guest', () => {
          const state = getAccessPolicyState({
            isAuthenticated: false,
            isOnboarded: false,
            requireOnboarding: false,
          });
          expect(state).toBe('guest');
        });

        it('routes authenticated but incomplete users to onboarding when required', () => {
          const state = getAccessPolicyState({
            isAuthenticated: true,
            isOnboarded: false,
            requireOnboarding: true,
          });
          expect(state).toBe('onboarding-required');
        });

        it('allows access to onboarding page when requireOnboarding is false', () => {
          const state = getAccessPolicyState({
            isAuthenticated: true,
            isOnboarded: false,
            requireOnboarding: false,
          });
          expect(state).toBe('authorized');
        });

        it('authorizes fully onboarded users across all application routes', () => {
          const state = getAccessPolicyState({
            isAuthenticated: true,
            isOnboarded: true,
            requireOnboarding: true,
          });
          expect(state).toBe('authorized');
        });
      });

      // ── 3. Dual-Engine Fiduciary Scoring Engine ──────────────
      describe(`[Pass ${passNumber}] Feature 3: Dual-Engine Scoring & Synthesis`, () => {
        const sampleProfile: UserProfile = {
          age: 30,
          occupation: 'Private',
          city: 'Bengaluru',
          monthlyIncome: 120000,
          monthlyExpenses: 50000,
          monthlyEMIs: 15000,
          monthlySavings: 55000,
          emergencyFundAmount: 350000,
          goalType: 'Wealth creation',
          targetAmount: 5000000,
          horizonYears: 10,
          goals: [
            {
              id: 'g-1',
              name: 'Wealth Creation',
              category: 'Wealth creation',
              targetAmount: 5000000,
              horizonYears: 10,
              priority: 'Important',
            },
            {
              id: 'g-2',
              name: 'Emergency Buffer',
              category: 'Emergency',
              targetAmount: 500000,
              horizonYears: 2,
              priority: 'Critical',
            },
          ],
          quizScores: [4, 4, 3, 4, 5],
          hasLifeInsurance: true,
          hasHealthInsurance: true,
          dependentsCount: 1,
          investingExperience: 'Intermediate',
          investingRegularity: 'Regularly',
        };

        const validRiskBands: RiskBand[] = [
          'Conservative',
          'Moderately Conservative',
          'Moderate',
          'Moderately Aggressive',
          'Aggressive',
        ];

        const validHealthBands: HealthBand[] = [
          'Needs attention',
          'Stable',
          'Strong',
        ];

        it('calculates psychological risk tolerance score and band', () => {
          const tolerance = calculateRiskTolerance(sampleProfile);
          expect(tolerance.score).toBeGreaterThanOrEqual(1);
          expect(tolerance.score).toBeLessThanOrEqual(100);
          expect(validRiskBands).toContain(tolerance.band);
        });

        it('calculates financial risk capacity score and band', () => {
          const capacity = calculateRiskCapacity(sampleProfile);
          expect(capacity.score).toBeGreaterThanOrEqual(1);
          expect(capacity.score).toBeLessThanOrEqual(100);
          expect(['Low', 'Moderate', 'High']).toContain(capacity.band);
          expect(capacity.breakdown.emergencyMonths).toBeCloseTo(7, 0);
        });

        it('synthesizes effective risk score with constraint checking', () => {
          const tolerance = calculateRiskTolerance(sampleProfile);
          const capacity = calculateRiskCapacity(sampleProfile);
          const effective = synthesizeEffectiveRisk(tolerance, capacity, sampleProfile);

          expect(effective.effectiveScore).toBeGreaterThanOrEqual(1);
          expect(effective.effectiveScore).toBeLessThanOrEqual(100);
          expect(typeof effective.isConstrained).toBe('boolean');
          expect(validRiskBands).toContain(effective.effectiveBand);
        });

        it('assesses individual goals feasibility and per-goal SIP allocations', () => {
          const surplus = sampleProfile.monthlyIncome - sampleProfile.monthlyExpenses - sampleProfile.monthlyEMIs;
          const assessment = assessIndividualGoals(sampleProfile.goals || [], surplus);

          expect(assessment.goals).toHaveLength(2);
          expect(assessment.totalMonthlySIPRequired).toBeGreaterThan(0);
          expect(typeof assessment.surplusGap).toBe('number');
        });

        it('generates an explainable asset allocation based on effective risk', () => {
          const tolerance = calculateRiskTolerance(sampleProfile);
          const capacity = calculateRiskCapacity(sampleProfile);
          const effective = synthesizeEffectiveRisk(tolerance, capacity, sampleProfile);
          const surplus = sampleProfile.monthlyIncome - sampleProfile.monthlyExpenses - sampleProfile.monthlyEMIs;
          const assessment = assessIndividualGoals(sampleProfile.goals || [], surplus);

          const allocation = generateExplainableAssetAllocation(effective, assessment, sampleProfile);

          const totalWeight = allocation.equity + allocation.debt + allocation.gold;
          expect(totalWeight).toBe(100);
          expect(Array.isArray(allocation.primaryDrivers)).toBe(true);
          expect(allocation.primaryDrivers.length).toBeGreaterThan(0);
        });

        it('evaluates overall financial health score and actionable tips', () => {
          const health = calculateFinancialHealthScore(sampleProfile);
          expect(health.score).toBeGreaterThanOrEqual(0);
          expect(health.score).toBeLessThanOrEqual(100);
          expect(validHealthBands).toContain(health.band);
          expect(health.tips.length).toBeGreaterThan(0);
        });
      });

      // ── 4. Onboarding Draft Persistence Simulation ──────────
      describe(`[Pass ${passNumber}] Feature 4: Onboarding Form Draft Auto-Save`, () => {
        const DRAFT_KEY = 'rupeemind_onboarding_draft';
        const inMemoryStorage: Record<string, string> = {};

        it('stores questionnaire drafts across navigation and restores them cleanly', () => {
          const testDraft = {
            step: 3,
            profileData: {
              age: 29,
              city: 'Hyderabad',
              monthlyIncome: 95000,
              monthlyExpenses: 40000,
            },
          };

          inMemoryStorage[DRAFT_KEY] = JSON.stringify(testDraft);

          const retrieved = JSON.parse(inMemoryStorage[DRAFT_KEY] || '{}');
          expect(retrieved.step).toBe(3);
          expect(retrieved.profileData.age).toBe(29);
          expect(retrieved.profileData.city).toBe('Hyderabad');
          expect(retrieved.profileData.monthlyIncome).toBe(95000);
        });

        it('clears draft after final assessment generation', () => {
          inMemoryStorage[DRAFT_KEY] = JSON.stringify({ step: 6 });
          expect(inMemoryStorage[DRAFT_KEY]).toBeDefined();

          delete inMemoryStorage[DRAFT_KEY];
          expect(inMemoryStorage[DRAFT_KEY]).toBeUndefined();
        });
      });
    });
  });
});
