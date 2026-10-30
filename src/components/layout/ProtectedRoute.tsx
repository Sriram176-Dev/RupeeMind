import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAccessPolicyState } from "../../lib/accessPolicy";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { isAuthenticated, isOnboarded, isSessionLoading } = useAuth();
  const location = useLocation();

  if (isSessionLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#5B6572]">
        Loading session…
      </div>
    );
  }

  const accessState = getAccessPolicyState({
    isAuthenticated,
    isOnboarded,
    requireOnboarding,
  });

  if (accessState === "guest") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (accessState === "onboarding-required") {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
