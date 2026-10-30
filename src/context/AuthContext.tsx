import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserProfile } from "../types";
import {
  calculateRiskScore,
  calculateFinancialHealthScore,
} from "../lib/scoring";
import {
  saveProfile as apiSaveProfile,
  getMeApi,
  refreshTokenApi,
  loginApi,
  signupApi,
  logoutApi,
} from "../services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isSessionLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const didRefresh = await refreshTokenApi();
        if (!didRefresh) {
          if (isMounted) setUser(null);
          return;
        }

        const me = await getMeApi();
        if (me && me.user && isMounted) {
          setUser({
            ...me.user,
            profile: me.profile || undefined,
          });
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await loginApi(email, password);
    setUser(res.user);
  };

  const signup = async (name: string, email: string, password?: string) => {
    const res = await signupApi(name, email, password);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    const risk = calculateRiskScore(profile);
    const health = calculateFinancialHealthScore(profile);

    const fullProfile: UserProfile = {
      ...profile,
      riskScore: profile.effectiveRiskScore ?? profile.riskScore ?? risk.score,
      riskBand: profile.effectiveRiskBand ?? profile.riskBand ?? risk.band,
      financialHealthScore: profile.financialHealthScore ?? health.score,
      financialHealthBand: profile.financialHealthBand ?? health.band,
      calculatedAt: new Date().toISOString(),
    };

    const saved = await apiSaveProfile(fullProfile);

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        onboardingDone: true,
        profile: saved || fullProfile,
      };
    });
  };

  const isAuthenticated = !!user;
  const isOnboarded = Boolean(
    user?.onboardingDone || (user?.profile?.riskScore !== undefined && user?.profile?.riskScore !== null),
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isOnboarded,
        isSessionLoading,
        login,
        signup,
        logout,
        saveUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
