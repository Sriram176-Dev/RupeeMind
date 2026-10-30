import { apiClient } from "../lib/apiClient";
import type { UserProfile, FinancialGoalItem, GoalsAssessmentSummary } from "../types";

export function mapServerProfileToUserProfile(
  doc: Record<string, unknown>,
): UserProfile {
  const scores = (doc.scores ?? {}) as Record<string, unknown>;
  const rawGoals = Array.isArray(doc.goals) ? doc.goals : [];
  const primaryGoal = (rawGoals[0] ?? {}) as Record<string, unknown>;
  const scoreHistory = Array.isArray(doc.scoreHistory) ? doc.scoreHistory : [];

  const goals: FinancialGoalItem[] = rawGoals.map((g: any, index: number) => ({
    id: g.id || `goal-${index}`,
    name: g.name || g.type || 'Wealth Creation',
    category: g.category || g.type || 'Wealth creation',
    targetAmount: Number(g.targetAmount || 0),
    horizonYears: Number(g.horizonYears || 5),
    priority: g.priority || 'Important',
    requiredMonthlySIP: g.requiredMonthlySIP ? Number(g.requiredMonthlySIP) : undefined,
    feasible: g.feasible !== undefined ? Boolean(g.feasible) : undefined,
    recommendedAllocation: g.recommendedAllocation || undefined,
    deficitAmount: g.deficitAmount !== undefined ? Number(g.deficitAmount) : undefined,
  }));

  const riskScore = Number(scores.risk ?? doc.effectiveRiskScore ?? doc.riskScore ?? 0);
  const riskBand = (scores.riskBand ?? doc.effectiveRiskBand ?? doc.riskBand) as UserProfile["riskBand"];
  const healthScore = Number(scores.financialHealth ?? doc.financialHealthScore ?? 0);
  const healthBand = (scores.financialHealthLabel ?? doc.financialHealthBand) as UserProfile["financialHealthBand"];

  return {
    age: Number(doc.age ?? 28),
    occupation:
      (doc.occupation as UserProfile["occupation"]) ||
      (doc.occupationType as UserProfile["occupation"]) ||
      "Private",
    city: (doc.city as string) || "Bengaluru",
    monthlyIncome: Number(doc.monthlyIncome ?? 50000),
    monthlyExpenses: Number(doc.monthlyExpenses ?? 30000),
    monthlyEMIs: Number(doc.monthlyEMIs ?? doc.monthlyEMI ?? 0),
    monthlySavings: Number(doc.monthlySavings ?? 20000),
    emergencyFundAmount: Number(doc.emergencyFundAmount ?? 0),
    goalType:
      (doc.goalType as UserProfile["goalType"]) ||
      (primaryGoal.category as UserProfile["goalType"]) ||
      (primaryGoal.type as UserProfile["goalType"]) ||
      "Wealth creation",
    targetAmount: Number(doc.targetAmount ?? primaryGoal.targetAmount ?? 2500000),
    horizonYears: Number(doc.horizonYears ?? primaryGoal.horizonYears ?? 5),
    goals: goals.length > 0 ? goals : undefined,
    goalsAssessment: (doc.goalsAssessment as GoalsAssessmentSummary) || undefined,
    quizScores: Array.isArray(doc.quizScores)
      ? (doc.quizScores as number[])
      : Array.isArray(doc.riskAnswers)
        ? (doc.riskAnswers as number[])
        : [3, 3, 3, 3, 3],
    hasLifeInsurance: Boolean(doc.hasLifeInsurance),
    hasHealthInsurance: Boolean(doc.hasHealthInsurance),
    dependentsCount: Number(doc.dependentsCount ?? doc.dependents ?? 0),
    investingExperience:
      (doc.investingExperience as UserProfile["investingExperience"]) ||
      (doc.experienceLevel as UserProfile["investingExperience"]) ||
      "Beginner",
    investingRegularity:
      (doc.investingRegularity as UserProfile["investingRegularity"]) ||
      (doc.investingHabit as UserProfile["investingRegularity"]) ||
      "Regularly",
    // Dual-engine scores & constraints
    riskToleranceScore: doc.riskToleranceScore != null ? Number(doc.riskToleranceScore) : undefined,
    riskToleranceBand: (doc.riskToleranceBand as UserProfile["riskToleranceBand"]) || undefined,
    riskCapacityScore: doc.riskCapacityScore != null ? Number(doc.riskCapacityScore) : undefined,
    riskCapacityBand: (doc.riskCapacityBand as UserProfile["riskCapacityBand"]) || undefined,
    effectiveRiskScore: doc.effectiveRiskScore != null ? Number(doc.effectiveRiskScore) : (riskScore || undefined),
    effectiveRiskBand: (doc.effectiveRiskBand as UserProfile["effectiveRiskBand"]) || (riskBand || undefined),
    isRiskConstrained: doc.isRiskConstrained != null ? Boolean(doc.isRiskConstrained) : false,
    riskConstraintReason: (doc.riskConstraintReason as string) || undefined,
    // Unified score & health aliases
    riskScore,
    riskBand,
    financialHealthScore: healthScore,
    financialHealthBand: healthBand,
    calculatedAt:
      (scores.updatedAt as string) ||
      (doc.calculatedAt as string) ||
      (doc.updatedAt as string) ||
      new Date().toISOString(),
    scoreHistory: scoreHistory.map((entry) => ({
      date: String(
        (entry as Record<string, unknown>).date ?? new Date().toISOString(),
      ),
      risk: Number((entry as Record<string, unknown>).risk ?? 0),
      financialHealth: Number(
        (entry as Record<string, unknown>).financialHealth ?? 0,
      ),
      reason: String(
        (entry as Record<string, unknown>).reason ?? "Profile Evaluation",
      ),
    })),
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const response = await apiClient.get("/profile");
  if (response.data?.profile) {
    return mapServerProfileToUserProfile(response.data.profile);
  }
  return null;
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const formattedGoals = Array.isArray(profile.goals) && profile.goals.length > 0
    ? profile.goals.map((g) => ({
        id: g.id,
        name: g.name,
        type: g.category || g.name || profile.goalType,
        category: g.category || 'Wealth creation',
        targetAmount: Number(g.targetAmount || 0),
        horizonYears: Number(g.horizonYears || 5),
        priority: g.priority || 'Important',
        requiredMonthlySIP: g.requiredMonthlySIP,
        feasible: g.feasible,
        recommendedAllocation: g.recommendedAllocation,
        deficitAmount: g.deficitAmount,
      }))
    : [
        {
          type: profile.goalType || 'Wealth creation',
          category: profile.goalType || 'Wealth creation',
          targetAmount: Number(profile.targetAmount || 2500000),
          horizonYears: Number(profile.horizonYears || 5),
        },
      ];

  const payload = {
    age: profile.age,
    occupation: profile.occupation,
    occupationType: profile.occupation,
    city: profile.city,
    monthlyIncome: profile.monthlyIncome,
    monthlyExpenses: profile.monthlyExpenses,
    monthlyEMIs: profile.monthlyEMIs,
    monthlyEMI: profile.monthlyEMIs,
    monthlySavings: profile.monthlySavings,
    emergencyFundAmount: profile.emergencyFundAmount,
    hasLifeInsurance: profile.hasLifeInsurance,
    hasHealthInsurance: profile.hasHealthInsurance,
    dependentsCount: profile.dependentsCount,
    dependents: profile.dependentsCount,
    investingExperience: profile.investingExperience,
    experienceLevel: profile.investingExperience,
    investingHabit: profile.investingRegularity,
    investingRegularity: profile.investingRegularity,
    goalType: profile.goalType,
    targetAmount: profile.targetAmount,
    horizonYears: profile.horizonYears,
    goals: formattedGoals,
    goalsAssessment: profile.goalsAssessment,
    quizScores: profile.quizScores,
    riskAnswers: profile.quizScores,
    riskToleranceScore: profile.riskToleranceScore,
    riskToleranceBand: profile.riskToleranceBand,
    riskCapacityScore: profile.riskCapacityScore,
    riskCapacityBand: profile.riskCapacityBand,
    effectiveRiskScore: profile.effectiveRiskScore,
    effectiveRiskBand: profile.effectiveRiskBand,
    isRiskConstrained: profile.isRiskConstrained,
    riskConstraintReason: profile.riskConstraintReason,
    riskScore: profile.riskScore ?? profile.effectiveRiskScore,
    riskBand: profile.riskBand ?? profile.effectiveRiskBand,
    financialHealthScore: profile.financialHealthScore,
    financialHealthBand: profile.financialHealthBand,
  };

  const response = await apiClient.put("/profile", payload);
  if (response.data?.profile) {
    return mapServerProfileToUserProfile(response.data.profile);
  }

  return profile;
}
