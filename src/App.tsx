import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { MarketProvider } from "./context/MarketContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { MarketTickerMarquee } from "./components/layout/MarketTickerMarquee";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { AppRoutes } from "./app/AppRoutes";
import { Toaster } from "sonner";

const CopilotDrawer = lazy(() =>
  import("./components/copilot").then((m) => ({ default: m.CopilotDrawer })),
);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-emerald-500/15 selection:text-emerald-900 font-sans">
              <MarketTickerMarquee />
              <Navbar />

              <main className="flex-1 pb-16 lg:pb-0">
                <AppRoutes />
              </main>

              <Footer />
              <MobileTabBar />
            </div>

            {/* Global AI Financial Copilot (RupeeBot) - Lazy Loaded */}
            <Suspense fallback={null}>
              <CopilotDrawer />
            </Suspense>

            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "16px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                },
              }}
            />
          </BrowserRouter>
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
