import { apiClient } from "../lib/apiClient";
import type { UserProfile } from "../types";

export function mapServerProfileToUserProfile(
  doc: Record<string, unknown>,
): UserProfile {
  const scores = (doc.scores ?? {}) as Record<string, unknown>;
  const goals = Array.isArray(doc.goals) ? doc.goals : [];
  const goal = (goals[0] ?? {}) as Record<string, unknown>;
  const scoreHistory = Array.isArray(doc.scoreHistory) ? doc.scoreHistory : [];

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
      (goal.type as UserProfile["goalType"]) ||
      "Wealth creation",
    targetAmount: Number(doc.targetAmount ?? goal.targetAmount ?? 2500000),
    horizonYears: Number(doc.horizonYears ?? goal.horizonYears ?? 5),
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
    riskScore: Number(scores.risk ?? doc.riskScore ?? 0),
    riskBand:
      (scores.riskBand as UserProfile["riskBand"]) ??
      (doc.riskBand as UserProfile["riskBand"]),
    financialHealthScore: Number(
      scores.financialHealth ?? doc.financialHealthScore ?? 0,
    ),
    financialHealthBand:
      (scores.financialHealthLabel as UserProfile["financialHealthBand"]) ??
      (doc.financialHealthBand as UserProfile["financialHealthBand"]),
    calculatedAt:
      (scores.updatedAt as string) ||
      (doc.calculatedAt as string) ||
      (doc.updatedAt as string),
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
    goalType: profile.goalType,
    targetAmount: profile.targetAmount,
    horizonYears: profile.horizonYears,
    goals: [
      {
        type: profile.goalType,
        targetAmount: profile.targetAmount,
        horizonYears: profile.horizonYears,
      },
    ],
    quizScores: profile.quizScores,
    riskAnswers: profile.quizScores,
  };

  const response = await apiClient.put("/profile", payload);
  if (response.data?.profile) {
    return mapServerProfileToUserProfile(response.data.profile);
  }

  return profile;
}
