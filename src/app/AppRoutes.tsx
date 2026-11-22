import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";

// ── Auth pages ──────────────────────────────────────────────
const Landing = lazy(() =>
  import("../pages/landing/Landing").then((m) => ({ default: m.Landing })),
);
const Login = lazy(() =>
  import("../pages/auth/Login").then((m) => ({ default: m.Login })),
);
const Signup = lazy(() =>
  import("../pages/auth/Signup").then((m) => ({ default: m.Signup })),
);
const ForgotPassword = lazy(() =>
  import("../pages/auth/ForgotPassword").then((m) => ({ default: m.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import("../pages/auth/ResetPassword").then((m) => ({ default: m.ResetPassword })),
);
const Onboarding = lazy(() =>
  import("../pages/auth/Onboarding").then((m) => ({ default: m.Onboarding })),
);

// ── Core app pages ───────────────────────────────────────────
const Dashboard = lazy(() =>
  import("../pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);

// ── 5 Core Zones Hubs ────────────────────────────────────────
const MarketsHub = lazy(() =>
  import("../pages/market/MarketsHub").then((m) => ({ default: m.MarketsHub })),
);
const PortfolioHub = lazy(() =>
  import("../pages/portfolio/PortfolioHub").then((m) => ({ default: m.PortfolioHub })),
);
const ToolsHub = lazy(() =>
  import("../pages/tools/ToolsHub").then((m) => ({ default: m.ToolsHub })),
);

// ── Security Detail & Secondary Pages ─────────────────────────
const StockDetail = lazy(() =>
  import("../pages/market/StockDetail").then((m) => ({ default: m.StockDetail })),
);
const FundDetail = lazy(() =>
  import("../pages/funds/FundDetail").then((m) => ({ default: m.FundDetail })),
);
const FundCompare = lazy(() =>
  import("../pages/funds/FundCompare").then((m) => ({ default: m.FundCompare })),
);
const PortfolioImport = lazy(() =>
  import("../pages/portfolio/PortfolioImport").then((m) => ({ default: m.PortfolioImport })),
);
const BacktestLab = lazy(() =>
  import("../pages/backtest/BacktestLab").then((m) => ({ default: m.BacktestLab })),
);
const PortfolioOptimizer = lazy(() =>
  import("../pages/optimize/PortfolioOptimizer").then((m) => ({ default: m.PortfolioOptimizer })),
);
const HealthCheckPage = lazy(() =>
  import("../pages/healthCheck/HealthCheckPage").then((m) => ({ default: m.HealthCheckPage })),
);
const ModelTransparency = lazy(() =>
  import("../pages/analytics/ModelTransparency").then((m) => ({ default: m.ModelTransparency })),
);

// ── Settings / Profile ────────────────────────────────────────
const Profile = lazy(() =>
  import("../pages/settings/Profile").then((m) => ({ default: m.Profile })),
);
const Settings = lazy(() =>
  import("../pages/settings/Settings").then((m) => ({ default: m.Settings })),
);

// ── Misc ──────────────────────────────────────────────────────
const Disclaimer = lazy(() =>
  import("../pages/misc/Disclaimer").then((m) => ({ default: m.Disclaimer })),
);
const NotFound = lazy(() =>
  import("../pages/misc/NotFound").then((m) => ({ default: m.NotFound })),
);

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="grid min-h-[45vh] place-items-center"
          role="status"
          aria-label="Loading page"
        >
          <span className="sr-only">Loading page</span>
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
        </div>
      }
    >
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* ── ZONE 1: Home Dashboard ─────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── ZONE 2: Markets & Research Hub ─────────────────────── */}
        <Route path="/markets" element={<MarketsHub />} />
        {/* Detail & Action Sub-Routes */}
        <Route path="/markets/:symbol" element={<StockDetail />} />
        <Route path="/market/:symbol" element={<StockDetail />} />
        <Route path="/funds/:code" element={<FundDetail />} />
        <Route path="/funds/compare" element={<FundCompare />} />

        {/* Backwards-compatibility redirects into Markets Hub tabs */}
        <Route path="/market" element={<Navigate to="/markets?tab=stocks" replace />} />
        <Route path="/funds" element={<Navigate to="/markets?tab=funds" replace />} />
        <Route path="/news" element={<Navigate to="/markets?tab=news" replace />} />
        <Route path="/recommendations" element={<Navigate to="/markets?tab=picks" replace />} />

        {/* ── ZONE 3: Portfolio Intelligence Hub ─────────────────── */}
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute requireOnboarding>
              <PortfolioHub />
            </ProtectedRoute>
          }
        />
        {/* Contextual Sub-Routes */}
        <Route
          path="/portfolio/import"
          element={
            <ProtectedRoute requireOnboarding>
              <PortfolioImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backtest"
          element={<Navigate to="/portfolio?tab=analytics&subtab=backtest" replace />}
        />
        <Route
          path="/optimize"
          element={<Navigate to="/portfolio?tab=analytics&subtab=optimizer" replace />}
        />
        <Route
          path="/health-check"
          element={
            <ProtectedRoute requireOnboarding>
              <HealthCheckPage />
            </ProtectedRoute>
          }
        />

        {/* Backwards-compatibility redirects into Portfolio Hub tabs */}
        <Route path="/analytics" element={<Navigate to="/portfolio?tab=analytics" replace />} />
        <Route path="/tax" element={<Navigate to="/portfolio?tab=tax" replace />} />
        <Route path="/rebalance" element={<Navigate to="/portfolio?tab=rebalance" replace />} />
        <Route path="/goals" element={<Navigate to="/portfolio?tab=goals" replace />} />
        <Route path="/alerts" element={<Navigate to="/portfolio?tab=alerts" replace />} />
        <Route path="/paper-trading" element={<Navigate to="/portfolio?tab=paper-trading" replace />} />
        <Route path="/crisis-simulator" element={<Navigate to="/portfolio?tab=analytics" replace />} />

        {/* ── ZONE 4: Financial Tools Hub ────────────────────────── */}
        <Route path="/tools" element={<ToolsHub />} />
        <Route path="/calculators" element={<Navigate to="/tools" replace />} />

        {/* ── ZONE 5: Account & Governance ───────────────────────── */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireOnboarding>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireOnboarding>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/model-transparency"
          element={
            <ProtectedRoute requireOnboarding>
              <ModelTransparency />
            </ProtectedRoute>
          }
        />

        {/* Legal & Compliance */}
        <Route path="/disclaimer" element={<Disclaimer />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
