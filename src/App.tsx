import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { MarketProvider } from "./context/MarketContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { AppRoutes } from "./app/AppRoutes";
import { CopilotDrawer } from "./components/copilot";
import { Toaster } from "sonner";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-[#0B1220] selection:bg-emerald-500/20 selection:text-emerald-800">
              <Navbar />

              <main className="flex-1">
                <AppRoutes />
              </main>

              <Footer />
            </div>

            {/* Global AI Financial Copilot (RupeeBot) */}
            <CopilotDrawer />

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
