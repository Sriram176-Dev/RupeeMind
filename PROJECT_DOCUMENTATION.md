# RupeeMind (रुपया माइंड) — Complete Architecture & Project Documentation

> **Next-Generation Indian Personal Finance, Algorithmic Stock Signals & Fiduciary Wealth Advisory Platform**

---

## 1. Executive Summary & Vision

**RupeeMind** is an end-to-end, enterprise-grade full-stack personal finance and investment management platform engineered specifically for the Indian financial ecosystem. Built from the ground up to respect Indian market dynamics, SEBI regulations, Indian taxation laws (Section 80C, LTCG/STCG regimes), and Indian currency numbering formats (Lakhs and Crores — ₹), RupeeMind bridges the gap between raw market data and actionable, personalized fiduciary advice.

Unlike conventional financial trackers that treat risk as a single subjective number, RupeeMind introduces a **Dual-Engine Fiduciary Architecture** that strictly bifurcates:

1. **Psychological Risk Tolerance** (an investor's emotional and behavioral ability to endure market drawdowns).
2. **Financial Risk Capacity** (an investor's balance sheet ability to absorb financial shocks based on cash flow, debt burden, emergency reserves, and dependents).

The platform features real-time equity analytics, interactive candlestick charting, automated mutual fund recommendation models, a risk-free **₹10,00,000 Paper Trading sandbox**, portfolio crisis stress testing (2008 GFC, 2020 COVID shock), live Indian financial RSS sentiment analysis, and a specialized **AI Financial Copilot (RupeeBot)**.

---

## 2. Comprehensive Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RUPEEMIND ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend Client           Backend API Gateway        ML & Quant Engine │
│  (React 19 + TypeScript)   (Node.js + Express)        (FastAPI + Python)│
│  Port: 5173                Port: 5000                 Port: 8000        │
│                                                                        │
│  ┌──────────────────┐      ┌────────────────────┐    ┌───────────────┐ │
│  │ Tailwind CSS v4  │ <--> │ JWT + Cookie Auth  │ <->│ Uvicorn       │ │
│  │ Recharts Visuals │      │ MongoDB / Mongoose │    │ Scikit-Learn  │ │
│  │ React Router v7  │      │ Zod Schema Guard   │    │ NumPy/Pandas  │ │
│  │ Axios Retry Queues      │ Rate Limiting      │    │ Quant Rules   │ │
│  └──────────────────┘      └────────────────────┘    └───────────────┘ │
│                                      │                                 │
│                                      ▼                                 │
│                          ┌──────────────────────┐                      │
│                          │ External Integrations│                      │
│                          │ • NSE / BSE Quotes   │                      │
│                          │ • Economic Times RSS │                      │
│                          │ • Google Gemini LLM  │                      │
│                          └──────────────────────┘                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Frontend Client Layer

* **Framework:** React 19 (`react` ^19.2.8, `react-dom` ^19.2.8) with modern functional components and hooks.
* **Language:** TypeScript 6.0 (`strict: true`, zero emit errors).
* **Build System:** Vite 8.3 with `@vitejs/plugin-react` and `@tailwindcss/vite`.
* **Styling & UI:**
  * Tailwind CSS v4 with bespoke Indian financial styling.
  * **Zero Dark Classes Policy:** Pure, high-contrast, professional editorial light palette (`#FAFAF7` canvas, `#0B1220` ink, `#0F766E` deep teal accents, `#E7E5DF` borders).
  * **Typography:** Fraunces (editorial serif headers), Inter (clean transactional body), JetBrains Mono (financial figures and percentages).
* **Data Visualization:** Recharts 3.10 for custom OHLCV Candlestick charts, portfolio allocation donuts, drawdown curves, and Monte Carlo paths.
* **Component Primitives & Icons:** Lucide React (150+ financial and telemetry icons).
* **Notification System:** Sonner for dismissible, accessible toast alerts.
* **Routing:** React Router v7 with declarative route matching and custom `ProtectedRoute` access policies.
* **Network & State Resilience:**
  * Axios 1.20 with request interceptor appending JWT `Bearer` headers.
  * Response interceptor with a **thread-safe queued retry mechanism** resolving concurrent requests on PC wake-up and token rotation.
  * Local draft synchronization (`rupeemind_onboarding_draft`) preventing input loss during page reloads or operating system sleep.

### Backend Application Server Layer

* **Runtime:** Node.js (ES Modules, `type: "module"`).
* **Framework:** Express 4.21.
* **Database & ODM:** MongoDB with Mongoose 8.9.
* **Authentication & Cryptography:**
  * JSON Web Tokens (`jsonwebtoken`): 15-minute cryptographically signed Access Tokens + 7-day httpOnly Secure Refresh Tokens with automatic token rotation.
  * Password Hashing: `bcryptjs` with salt round cost factor 12.
  * Sleep & Race Condition Tolerance: 15-second grace window and active session tracking preventing spurious logouts when computers suspend and resume.
* **Input Validation & Sanitization:** Zod 3.24 schemas validating all request bodies, route parameters, and query parameters.
* **Security & Hardening:**
  * Rate Limiting: `express-rate-limit` with differentiated limits for auth, market reads, and search (with automated test-mode bypass).
  * CORS: Configured for credentials (`withCredentials: true`) scoped strictly to client origins.
  * Cascading Deletion: Complete GDPR-style account deletion purging profile, watchlists, paper wallet, orders, positions, and notifications.
* **Data Ingestion & Feed Services:**
  * Live RSS parser syncing articles from *The Economic Times*, *Livemint*, and *Moneycontrol*.
  * Real-time and historical equity quotes utilizing Yahoo Finance APIs with integrated fallback dictionaries for top Indian equities (RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, SBIN, etc.).

### Python Machine Learning & Quant Microservice Layer

* **Framework:** FastAPI with Uvicorn.
* **Libraries:** Python 3.14, Scikit-learn, Pandas, NumPy.
* **Features:**
  * Portfolio Variance / Covariance computation.
  * Monte Carlo simulation running 1,000 multi-asset trajectories.
  * Parametric & Historical Value at Risk (VaR 95%, VaR 99%).
  * Automated rule fallback allowing the platform to run seamlessly even when the ML service is offline.

### AI Financial Copilot (RupeeBot)

* **Model:** Google Gemini API (`@google/genai`).
* **Context Awareness:** Injects user risk band, surplus, paper trading holdings, and goals directly into the copilot prompt.
* **Quant Rule Fallback:** Deterministic financial rules provide accurate Indian tax answers (Section 80C, LTCG/STCG, ELSS) even without an active Gemini API key.

---

## 3. Core Feature Walkthrough

### 3.1. Dual-Engine Fiduciary Onboarding & Scoring

Traditional robo-advisors ask 5 questions and assign an arbitrary label. RupeeMind operates on two independent financial engines:

1. **Engine 1: Psychological Risk Tolerance (0–100 Score)**
   * Assessed through 5 realistic behavioral scenarios (market drops 20%, flat returns for 6 months, volatility sleep score, investment philosophy, investment horizon).
   * Categories: *Conservative*, *Moderately Conservative*, *Moderate*, *Moderately Aggressive*, *Aggressive*.

2. **Engine 2: Financial Risk Capacity (0–100 Score)**
   * Calculated directly from the investor's balance sheet:
     $$\text{Savings Rate} = \frac{\text{Monthly Income} - \text{Expenses} - \text{EMIs}}{\text{Monthly Income}}$$
     $$\text{Emergency Runway (Months)} = \frac{\text{Liquid Emergency Fund}}{\text{Monthly Expenses}}$$
     $$\text{Debt Burden Ratio} = \frac{\text{Monthly EMIs}}{\text{Monthly Income}}$$
   * Categories: *Low*, *Moderate*, *High*.

3. **Fiduciary Synthesis & Safety Constraints:**
   * If an investor has aggressive risk tolerance but less than 3 months of emergency expenses, the system **clamps** their effective risk score and explicitly issues a constraint warning.
   * Produces an **Explainable Asset Allocation** (e.g., Equity: 60%, Debt: 30%, Gold: 10%) with actionable fiduciary rationales.

4. **Individually Assessable Financial Goals:**
   * Users can configure multiple distinct goals: *Wealth Creation*, *Retirement*, *House Down Payment*, *Child Higher Education*, *Section 80C Tax Saving*, *Emergency Reserve*.
   * Evaluates each goal's timeline, target corpus, and required monthly SIP against the user's actual monthly surplus.

---

### 3.2. Market Intelligence, Screener & Candlestick Charts (`/market`)

* **Live Benchmarks:** Real-time tracking of NIFTY 50, SENSEX, NIFTY BANK, and NIFTY IT with day point/percentage changes.
* **Market Status Badge:** Live second-by-second IST clock showing whether the Indian market is Open (09:15–15:30 IST) or Closed, with countdown timers.
* **Stock Screener:** Filterable by Market Cap (Large, Mid, Small Cap) and Sectors (Banking, IT, Energy, FMCG, Auto, Pharma).
* **Interactive Candlestick Charts (`/market/:symbol`):**
  * Time intervals: 1D, 1W, 1M, 1Y, 5Y.
  * Real Open, High, Low, Close, and Volume bars.
  * Technical scorecards: Momentum Score, Quality Score, Valuation Score, and Overall Health Gauge.
* **Personal Watchlist:** Instant toggle with real-time tracking from the dashboard and market view.

---

### 3.3. Mutual Fund Intelligence & Tailored Recommendations (`/funds`)

* **SEBI Category Screener:** Large Cap, Mid Cap, Small Cap, Flexi Cap, Balanced Advantage, ELSS Tax Savers, and Liquid Debt funds.
* **Fund Metrics:** Annualized returns (1Y, 3Y, 5Y CAGR), Expense Ratio, NAV history, Sharpe Ratio, Sortino Ratio, and Maximum Drawdown.
* **Side-by-Side Fund Comparison (`/funds/compare`):** Direct visual comparison of up to 3 funds analyzing risk-adjusted alpha, rolling consistency, and expense drag.
* **Tailored Fund Allocations (`/recommendations`):**
  * Generates concrete fund choices matching the user's effective risk band.
  * Distributes the monthly SIP surplus across funds aligned with specific goal horizons.

---

### 3.4. Paper Trading Sandbox (`/paper-trading`)

* **Virtual Capital:** Starts with **₹10,00,000** virtual cash.
* **Order Execution:**
  * **Market Orders:** Immediate execution at prevailing market quotes with real brokerage/STT fee simulation.
  * **Limit Orders:** Queued in `PENDING` state until market price conditions are satisfied.
* **Position Tracking:** Tracks Average Buy Price, Current Valuation, Unrealized P&L, and Total Returns.
* **Risk Sandbox Controls:** Cancel active limit orders anytime or trigger **Reset Wallet** to clear positions and restore the initial ₹10,00,000 balance.

---

### 3.5. Portfolio Analytics & Crisis Stress Testing (`/analytics`)

* **Value at Risk (VaR):** Computes parametric downside risk at 95% and 99% confidence intervals for 1-day and 1-month horizons.
* **Monte Carlo Simulation:** Simulates 1,000 randomized wealth trajectories over 5 to 20 years, plotting:
  * 90th Percentile (Optimistic)
  * 50th Percentile (Median Expected)
  * 10th Percentile (Conservative / Stress Case)
* **Historical Crisis Stress Testing (`/crisis-simulator`):**
  Simulates exact historical market drawdowns against the user's portfolio asset allocation:
  1. *2008 Global Financial Crisis (Subprime Crash)*
  2. *2020 COVID-19 Liquidity Shock*
  3. *2022 Global Rate Hike & Inflation Shock*
  4. *2016 Demonetization & Liquidity Shock*

---

### 3.6. Interactive Financial Calculators (`/calculators`)

* **SIP Calculator:** Computes compounded future wealth and return-on-investment with complete year-by-year principal vs. interest breakdown tables.
* **Step-Up SIP Calculator:** Models annual percentage increments in monthly investment as salary increases over career stages.
* **Goal Planner Calculator:** Reverse-engineers the precise monthly SIP required to reach a specific target corpus within a set horizon.
* **Lumpsum Calculator:** Compound interest calculator for one-time capital investments.
* **Section 80C Tax Saver Calculator:** Compares tax deductions under the Old Tax Regime across ELSS Mutual Funds, PPF, NPS, and 5-Year Tax Saver FDs (including 30% slab + 4% health & education cess computations).
* **Inflation-Adjusted Purchasing Power:** Models the real purchasing power of the future corpus at different inflation rates (e.g., 6%).

---

### 3.7. Live Financial News & Sentiment Tracking (`/news`)

* Automated background RSS ingestion from India's premier financial publishers: *The Economic Times*, *Mint*, and *Moneycontrol*.
* Natural language categorization into *Markets*, *Economy*, *Corporate*, and *Policy*.
* Rule-based sentiment tagging (*Bullish*, *Neutral*, *Bearish*) to evaluate broader market sentiment at a glance.

---

### 3.8. AI Financial Copilot — RupeeBot

* Floating, responsive drawer widget available globally across all screens.
* Explains complex financial topics in conversational, accessible language:
  * Indian taxation rules (LTCG exemption limit of ₹1.25L, STCG at 20%).
  * Asset allocation adjustments based on current market valuations.
  * Direct reviews of the user's paper trading positions.
  * Quant fallback engine ensuring instant answers even without third-party LLM API connectivity.

---

## 4. Database Architecture & Schema Models

MongoDB is utilized with strict Mongoose schemas:

| Model Name | File Location | Key Responsibilities |
| --- | --- | --- |
| **User** | `server/src/models/User.js` | User credentials, bcrypt hash, active session arrays (`tokenHash`, `previousTokenHash`, `rotatedAt`, `expiresAt`), user preferences, alert flags. |
| **Profile** | `server/src/models/Profile.js` | Demographics, cash flow (income, expenses, EMIs), emergency fund, insurance, goals array, risk quiz answers, computed dual-engine scores, score revision history. |
| **Fund** | `server/src/models/Fund.js` | Mutual fund catalog: scheme code, fund house, category, risk level, NAV, historical CAGRs (1Y, 3Y, 5Y), expense ratios, Sharpe and Sortino ratios. |
| **Holding** | `server/src/models/Holding.js` | Portfolio assets (Stocks, Mutual Funds, Gold, FDs, EPF), purchase dates, unit quantities, buy prices. |
| **TrackedSIP** | `server/src/models/TrackedSIP.js` | Automated SIP reminders, scheduled amounts, frequency, target fund. |
| **PaperWallet** | `server/src/models/PaperWallet.js` | Virtual cash balance, total portfolio value, realized and unrealized P&L. |
| **PaperOrder** | `server/src/models/PaperOrder.js` | Virtual trade orders (BUY/SELL, MARKET/LIMIT, price, quantity, status: EXECUTED/PENDING/CANCELLED). |
| **PaperPosition** | `server/src/models/PaperPosition.js` | Aggregated paper equity positions with volume-weighted average buy price. |
| **Recommendation** | `server/src/models/Recommendation.js` | Fiduciary recommendation snapshots, assigned fund schemes, asset allocation percentages, status (active/archived). |
| **Watchlist** | `server/src/models/Watchlist.js` | User's tracked stock symbols with limit capped at 50 tickers. |
| **Notification** | `server/src/models/Notification.js` | User alerts, signal flips, price threshold triggers, read/unread states. |
| **CopilotChat** | `server/src/models/CopilotChat.js` | Persisted conversation history for RupeeBot sessions. |
| **JobLog** | `server/src/models/JobLog.js` | Scheduled task execution logs, attempts, execution duration, cron telemetry. |

---

## 5. Security & Session Persistence Architecture

### Dual-Token Lifecycle & Sleep Wake-Up Resilience

```
User Login ──> Server generates:
                 ├── Access Token (JWT, 15-min lifespan, Authorization: Bearer)
                 └── Refresh Token (JWT, 7-day lifespan, httpOnly Cookie)

When Access Token Expires:
  1. Frontend Axios interceptor catches 401.
  2. Sets `isRefreshing = true` and queues all subsequent outgoing requests into `failedQueue`.
  3. Dispatches POST /api/auth/refresh with credentials.
  4. Server validates Refresh Token:
     - If matches current active token: rotates token, sets new cookie, updates `previousTokenHash`.
     - If matches previous token within grace window (e.g. concurrent requests or PC waking from sleep):
       re-synchronizes the client and issues refreshed tokens without invalidating the session.
  5. Interceptor receives new Access Token:
     - Explicitly injects `Authorization: Bearer <NEW_TOKEN>` into the failed request AND all queued requests.
     - Resolves the queue and transparently re-executes all requests.
  6. Zero disruption to the user experience.
```

### Protection Against Data Vanishing

* **Onboarding Local Draft:** Every change across Steps 1 through 6 is saved to `localStorage` under `rupeemind_onboarding_draft`. If the user accidentally closes the tab, reloads, or puts their computer to sleep, their entered progress is immediately restored upon return. The draft is purged only after final fiduciary assessment generation.
* **Profile Synchronization:** The `/profile` settings page uses reactive synchronization hooks so asynchronous database fetches immediately populate income, expense, and EMI fields rather than falling back to zero.

---

## 6. Directory Structure

```
e:\RupeeMind\
├── index.html                   # HTML entry point with Fraunces & Inter font preconnects
├── package.json                 # Client dependencies & concurrently orchestration scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
│
├── src/                         # Frontend Application Source
│   ├── main.tsx                 # React DOM root entry
│   ├── App.tsx                  # Root App provider tree (Auth, Market, Notifications)
│   ├── app/
│   │   └── AppRoutes.tsx        # React Router v7 routes with code-split lazy loading
│   ├── components/              # Modular UI components
│   │   ├── copilot/             # Global AI Copilot drawer (RupeeBot)
│   │   ├── funds/               # Mutual fund cards and comparison tables
│   │   ├── layout/              # Navbar, Footer, ProtectedRoute, ScrollToTop
│   │   ├── market/              # Candlestick chart, stock screener, global search
│   │   ├── notifications/       # Notification dropdown panel
│   │   ├── onboarding/          # 6-step onboarding subcomponents & summary view
│   │   ├── trading/             # Order modal, order history, position table
│   │   └── ui/                  # CurrencyInput, PriceChangeChip, ScoreGauge, etc.
│   ├── context/                 # React Contexts (AuthContext, MarketContext, etc.)
│   ├── lib/                     # Client scoring engine, calculators, access policy, utils
│   │   ├── accessPolicy.ts      # Route authorization policy matrix
│   │   ├── apiClient.ts         # Axios client with concurrent retry queue
│   │   ├── calculators.ts       # Mathematical implementations for SIP, 80C, etc.
│   │   ├── scoring.ts           # Dual-engine risk, capacity, and allocation algorithms
│   │   └── utils.ts             # INR currency formatting (Lakhs/Crores)
│   ├── pages/                   # Top-level route views
│   │   ├── auth/                # Login, Signup, ForgotPassword, Onboarding
│   │   ├── dashboard/           # Executive Dashboard view
│   │   ├── funds/               # Fund directory, fund details, fund compare
│   │   ├── market/              # Market overview & StockDetail candlestick view
│   │   ├── news/                # Live financial news feed
│   │   ├── portfolio/           # Portfolio tracking & risk analytics
│   │   ├── recommendations/     # Tailored mutual fund allocations
│   │   ├── settings/            # User profile and account preferences
│   │   ├── tools/               # Financial calculators & educational academy
│   │   └── trading/             # Paper trading sandbox
│   └── types/                   # TypeScript interfaces and domain models
│
├── server/                      # Backend API Server Source
│   ├── package.json             # Express server dependencies & scripts
│   ├── src/
│   │   ├── server.js            # Express server bootstrap & MongoDB connection
│   │   ├── app.js               # Express application middleware pipeline
│   │   ├── config/              # Environment variables & constants
│   │   ├── controllers/         # Auth, market, profile, paper trading controllers
│   │   ├── middleware/          # JWT auth guard, Zod validator, rate limiters
│   │   ├── models/              # Mongoose schemas (User, Profile, Fund, etc.)
│   │   ├── routes/              # Express API route declarations
│   │   ├── scripts/             # Mutual fund synchronization script
│   │   ├── services/            # Business logic (scoreService, recommendationService)
│   │   └── utils/               # JWT token utilities, cookie helpers, logger
│   └── test/                    # Server Vitest test suites (auth, scoring, paper trading)
│
└── rupeemind-ml/                # Python ML Microservice Source
    ├── requirements.txt         # FastAPI, uvicorn, scikit-learn, pandas
    └── src/
        └── api/
            └── app.py           # FastAPI entrypoint for quant analytics
```

---

## 7. Setup & Local Development Guide

### Prerequisites

* **Node.js:** v18.0.0 or higher (v20+ recommended).
* **MongoDB:** Community Edition running locally on default port `27017` (e.g. `mongodb://127.0.0.1:27017/rupeemind`).
* **Python:** 3.10+ with `virtualenv` (optional, for ML microservice).

### Installation Steps

1. **Clone & Install Client Dependencies:**

   ```powershell
   cd e:\RupeeMind
   npm install
   ```

2. **Install Server Dependencies:**

   ```powershell
   cd e:\RupeeMind\server
   npm install
   ```

3. **Configure Environment Variables:**
   * Server environment variables are located in `server/.env`:

     ```env
     PORT=5000
     NODE_ENV=development
     CLIENT_URL=http://localhost:5173
     MONGODB_URI=mongodb://127.0.0.1:27017/rupeemind
     JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
     JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
     ACCESS_TOKEN_EXPIRY=15m
     REFRESH_TOKEN_EXPIRY=7d
     USE_ML_MODEL=true
     ML_API_URL=http://localhost:8000
     GEMINI_API_KEY=your_gemini_api_key_optional
     ```

4. **Start All Services Concurrently:**
   From the project root:

   ```powershell
   npm run dev
   ```

   This automatically launches:
   * **Vite Client:** [`http://localhost:5173`](http://localhost:5173)
   * **Express API Server:** [`http://localhost:5000`](http://localhost:5000)
   * **FastAPI Python Service:** [`http://localhost:8000`](http://localhost:8000)

---

## 8. Automated Test Suites & Verification

RupeeMind features comprehensive unit, integration, and security test suites across both the frontend and backend:

### Running Tests

* **Run All Tests:**

  ```powershell
  npm run test
  ```

* **Run Client Tests:**

  ```powershell
  npm run test:client
  ```

* **Run Server Tests:**

  ```powershell
  npm run test:server
  ```

* **TypeScript Compilation Check:**

  ```powershell
  npx tsc --noEmit
  ```

* **Production Production Build:**

  ```powershell
  npm run build
  ```

### Test Coverage Highlights

* **Authentication Flow:** Registration, password hashing (bcrypt 12), login, cookie path verification, 15s grace-window token rotation, session invalidation.
* **Calculators:** Exact compound interest, lumpsum, step-up SIP increments, goal planner targets, Section 80C tax deduction amounts.
* **Access Policy:** Unauthenticated guest redirection, incomplete profile redirection to onboarding, authorized access for onboarded users.
* **Paper Trading Engine:** Buy market order, cash balance deduction, position creation, limit order placement, order cancellation, and wallet reset.
* **Job Runner:** Concurrent task locking, max retry logic, failure recording.
* **Analytics & Telemetry:** Signal flip tracking, quality scoring, VaR calculations.
