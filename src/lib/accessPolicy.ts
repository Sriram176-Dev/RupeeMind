export type AccessDecision = "guest" | "onboarding-required" | "authorized";

export interface AccessPolicyInput {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  requireOnboarding?: boolean;
}

export function getAccessPolicyState({
  isAuthenticated,
  isOnboarded,
  requireOnboarding = false,
}: AccessPolicyInput): AccessDecision {
  if (!isAuthenticated) {
    return "guest";
  }

  if (requireOnboarding && !isOnboarded) {
    return "onboarding-required";
  }

  return "authorized";
}
