import { describe, expect, it } from "vitest";
import { getAccessPolicyState } from "../lib/accessPolicy";
import { mapServerProfileToUserProfile } from "../services/profileService";

describe("access policy", () => {
  it("returns guest when unauthenticated", () => {
    expect(
      getAccessPolicyState({ isAuthenticated: false, isOnboarded: false }),
    ).toBe("guest");
  });

  it("requires onboarding for authenticated but unprofiled users", () => {
    expect(
      getAccessPolicyState({
        isAuthenticated: true,
        isOnboarded: false,
        requireOnboarding: true,
      }),
    ).toBe("onboarding-required");
  });

  it("allows authorized access only after onboarding is complete", () => {
    expect(
      getAccessPolicyState({
        isAuthenticated: true,
        isOnboarded: true,
        requireOnboarding: true,
      }),
    ).toBe("authorized");
  });
});

describe("profile mapping", () => {
  it("normalizes server profile data into the frontend shape", () => {
    const mapped = mapServerProfileToUserProfile({
      age: 31,
      occupation: "Private",
      city: "Pune",
      monthlyIncome: 120000,
      monthlyExpenses: 45000,
      monthlyEMIs: 15000,
      monthlySavings: 60000,
      emergencyFundAmount: 300000,
      goalType: "Wealth creation",
      targetAmount: 2000000,
      horizonYears: 7,
      quizScores: [4, 5, 3, 4, 5],
      hasLifeInsurance: true,
      hasHealthInsurance: false,
      dependentsCount: 1,
      investingExperience: "Intermediate",
      scores: {
        risk: 72,
        riskBand: "Moderately Aggressive",
        financialHealth: 81,
        financialHealthLabel: "Strong",
      },
    });

    expect(mapped.riskScore).toBe(72);
    expect(mapped.riskBand).toBe("Moderately Aggressive");
    expect(mapped.financialHealthBand).toBe("Strong");
    expect(mapped.city).toBe("Pune");
    expect(mapped.quizScores).toHaveLength(5);
  });
});
