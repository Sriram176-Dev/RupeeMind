import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
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

// ── Market pages ─────────────────────────────────────────────
const Market = lazy(() =>
  import("../pages/market/Market").then((m) => ({ default: m.Market })),
);
const StockDetail = lazy(() =>
  import("../pages/market/StockDetail").then((m) => ({ default: m.StockDetail })),
);

// ── Funds pages ──────────────────────────────────────────────
const Funds = lazy(() =>
  import("../pages/funds/Funds").then((m) => ({ default: m.Funds })),
);
const FundDetail = lazy(() =>
  import("../pages/funds/FundDetail").then((m) => ({ default: m.FundDetail })),
);
const FundCompare = lazy(() =>
  import("../pages/funds/FundCompare").then((m) => ({ default: m.FundCompare })),
);

// ── Portfolio pages ───────────────────────────────────────────
const Portfolio = lazy(() =>
  import("../pages/portfolio/Portfolio").then((m) => ({ default: m.Portfolio })),
);
const PortfolioImport = lazy(() =>
  import("../pages/portfolio/PortfolioImport").then((m) => ({ default: m.PortfolioImport })),
);
const Analytics = lazy(() =>
  import("../pages/portfolio/Analytics").then((m) => ({ default: m.Analytics })),
);
const TaxReport = lazy(() =>
  import("../pages/tax/TaxReport").then((m) => ({ default: m.TaxReport })),
);
const RebalanceDashboard = lazy(() =>
  import("../pages/rebalance/RebalanceDashboard").then((m) => ({ default: m.RebalanceDashboard })),
);
const GoalDashboard = lazy(() =>
  import("../pages/goals/GoalDashboard").then((m) => ({ default: m.GoalDashboard })),
);
const HealthCheckPage = lazy(() =>
  import("../pages/healthCheck/HealthCheckPage").then((m) => ({ default: m.HealthCheckPage })),
);
const AlertsManagement = lazy(() =>
  import("../pages/alerts/AlertsManagement").then((m) => ({ default: m.AlertsManagement })),
);
const BacktestLab = lazy(() =>
  import("../pages/backtest/BacktestLab").then((m) => ({ default: m.BacktestLab })),
);
const PortfolioOptimizer = lazy(() =>
  import("../pages/optimize/PortfolioOptimizer").then((m) => ({ default: m.PortfolioOptimizer })),
);
const ModelTransparency = lazy(() =>
  import("../pages/analytics/ModelTransparency").then((m) => ({ default: m.ModelTransparency })),
);

// ── Trading pages ─────────────────────────────────────────────
const PaperTrading = lazy(() =>
  import("../pages/trading/PaperTrading").then((m) => ({ default: m.PaperTrading })),
);

// ── Recommendations ───────────────────────────────────────────
const Recommendations = lazy(() =>
  import("../pages/recommendations/Recommendations").then((m) => ({ default: m.Recommendations })),
);

// ── Tools & Education ─────────────────────────────────────────
const Calculators = lazy(() =>
  import("../pages/tools/Calculators").then((m) => ({ default: m.Calculators })),
);
const Learn = lazy(() =>
  import("../pages/tools/Learn").then((m) => ({ default: m.Learn })),
);

// ── News ──────────────────────────────────────────────────────
const News = lazy(() =>
  import("../pages/news/News").then((m) => ({ default: m.News })),
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
        <Route path="/market" element={<Market />} />
        <Route path="/market/:symbol" element={<StockDetail />} />
        <Route path="/funds" element={<Funds />} />
        <Route path="/funds/:code" element={<FundDetail />} />
        <Route path="/funds/compare" element={<FundCompare />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/news" element={<News />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute requireOnboarding>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requireOnboarding>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute requireOnboarding>
              <Portfolio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/import"
          element={
            <ProtectedRoute requireOnboarding>
              <PortfolioImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tax"
          element={
            <ProtectedRoute requireOnboarding>
              <TaxReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rebalance"
          element={
            <ProtectedRoute requireOnboarding>
              <RebalanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute requireOnboarding>
              <GoalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-check"
          element={
            <ProtectedRoute requireOnboarding>
              <HealthCheckPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute requireOnboarding>
              <AlertsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backtest"
          element={
            <ProtectedRoute requireOnboarding>
              <BacktestLab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/optimize"
          element={
            <ProtectedRoute requireOnboarding>
              <PortfolioOptimizer />
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
        <Route
          path="/paper-trading"
          element={
            <ProtectedRoute requireOnboarding>
              <PaperTrading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crisis-simulator"
          element={
            <ProtectedRoute requireOnboarding>
              <Analytics />
            </ProtectedRoute>
          }
        />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
