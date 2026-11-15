# RupeeMind Architecture Documentation

**RupeeMind** is an institutional-grade, full-stack quantitative financial intelligence and fiduciary portfolio analytics platform tailored for Indian equity and mutual fund markets.

---

## 1. System Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, React Router v7, Sonner, Lucide React.
- **Backend**: Node.js (ES Modules), Express, MongoDB (Mongoose), Zod validation, JWT authentication with refresh token rotation.
- **Quant & ML Service**: Python 3.14+, FastAPI, Uvicorn, Scikit-learn, NumPy, Pandas.
- **Data Integrations**: Yahoo Finance (real quotes & daily OHLCV bars), RSS Feeds (Economic Times, Mint), CAMS/KFintech CAS statement parsers, broker CSV parsers.
- **Testing**: Vitest, React Testing Library.

---

## 2. Platform Directory Structure

```
RupeeMind/
├── src/                                  # Frontend React application
│   ├── app/                              # Route registrations (AppRoutes.tsx)
│   ├── components/
│   │   ├── copilot/                      # RupeeBot AI Copilot drawer & RAG citation badges
│   │   ├── layout/                       # Navbar, Footer, ProtectedRoute
│   │   ├── market/                       # Global search & market status
│   │   ├── portfolio/                    # Holdings, SIPs, Transactions, Benchmark tabs
│   │   ├── recommendations/              # Fund recommendation cards with Explainability drawer
│   │   ├── stresstest/                   # Basel III VaR, Monte Carlo & Crisis scenario cards
│   │   └── ui/                           # DisclaimerBanner, StatCard, ScoreGauge, etc.
│   ├── context/                          # AuthContext, MarketContext
│   ├── pages/
│   │   ├── alerts/                       # AlertsManagement.tsx (/alerts)
│   │   ├── analytics/                    # ModelTransparency.tsx (/model-transparency)
│   │   ├── backtest/                     # BacktestLab.tsx (/backtest)
│   │   ├── dashboard/                    # Dashboard.tsx with portfolio news panel
│   │   ├── goals/                        # GoalDashboard.tsx (/goals)
│   │   ├── healthCheck/                  # HealthCheckPage.tsx (/health-check)
│   │   ├── optimize/                     # PortfolioOptimizer.tsx (/optimize)
│   │   ├── portfolio/                    # Portfolio.tsx, PortfolioImport.tsx, Analytics.tsx
│   │   ├── rebalance/                    # RebalanceDashboard.tsx (/rebalance)
│   │   └── tax/                          # TaxReport.tsx (/tax)
│   ├── services/                         # Typed API client wrappers
│   ├── test/                             # Automated client & calculation test suites
│   └── types/                            # Core TypeScript definitions (index.ts)
├── server/                               # Node.js Express backend
│   └── src/
│       ├── config/                       # taxRules.js, marketUniverse.js, ragSources.json
│       ├── controllers/                  # Zod-validated endpoint controllers
│       ├── middleware/                   # JWT auth, rateLimiter, error handler
│       ├── models/                       # Mongoose schemas
│       ├── routes/                       # Express router mounts
│       ├── scripts/                      # ingestRagDocuments.js admin script
│       └── services/                     # Backtest, optimization, RAG, alerts, tax, news
└── rupeemind-ml/                         # Python Quantitative Microservice
    └── src/
        ├── api/                          # FastAPI route endpoints
        └── models/                       # Scale-free logistic regression & feature extraction
```

---

## 3. Data Models (Mongoose)

1. **`User`**: Account identity, hashed passwords, refresh token secrets, role (`user` / `admin`).
2. **`Profile`**: Fiduciary risk score, risk band (`Conservative`, `Moderate`, `Aggressive`), investment horizon, emergency fund months, term/health insurance coverage.
3. **`Holding`**: Consolidated holdings across stocks, mutual funds, gold, and fixed income.
4. **`Transaction`**: Detailed FIFO transaction ledger (BUY, SELL, SIP, SWITCH), date, units, price, amount, source (CAS, Broker CSV, Manual).
5. **`Alert`**: User-defined price, percentage change, signal flip, allocation drift, and SIP due alert rules.
6. **`Notification`**: Persistent in-app and email delivery audit records with severity levels.
7. **`Goal`**: Financial targets (e.g. Retirement, Home, Child Education) with corpus target, linked SIPs, and projected completion.
8. **`Recommendation`**: Model-suggested asset allocations and fund picks with deep quantitative explainability factors.
9. **`KnowledgeChunk`**: Vectorized RAG document chunks storing public statutory circulars, AMFI guidance, and tax laws with embeddings.
10. **`PaperWallet` & `PaperPosition`**: Simulated ₹10 Lakh virtual trading sandbox.
11. **`CopilotChat`**: Persistent conversation sessions with RupeeBot.

---

## 4. API Endpoints Catalog

### **Portfolio, Import & Benchmarking (Phase 1)**
- `POST /api/holdings/import/cas` — Parse password-protected CAMS/KFintech CAS PDFs.
- `POST /api/holdings/import/broker-csv` — Ingest Zerodha/Groww/INDmoney broker CSVs.
- `GET /api/holdings/xirr` — Compute exact XIRR (Newton-Raphson with bisection fallback) per holding and portfolio.
- `GET /api/holdings/benchmark-comparison` — Compare user cash flow growth curve against NIFTY 50.

### **Tax, Rebalancing, Goals & Defense (Phase 2)**
- `GET /api/tax/capital-gains?fy=...` — FIFO tax lot analysis, STCG (20%), LTCG (12.5% above ₹1.25L), and Section 112A harvest suggestions.
- `GET /api/tax/capital-gains/csv` — Downloadable ITR-compliant capital gains report.
- `GET /api/rebalance?driftThreshold=...` — Asset drift diagnosis vs fiduciary target, trade generation, and zero-tax SIP redirection.
- `GET /api/goals`, `POST /api/goals` — Corpus projections, on-track status, and "What if I skip N SIPs" simulation.
- `GET /api/health-check` — Emergency fund audit (6–12 months), term insurance multiple, and health cover gap analysis.

### **Alerts & Notifications (Phase 3)**
- `GET /api/alerts`, `POST /api/alerts` — Create and list rule-based alerts (Price, %, Signal Flip, Drift, SIP).
- `PATCH /api/alerts/:id/toggle` — Pause/resume alert evaluation.
- `DELETE /api/alerts/:id` — Delete alert rule.
- `POST /api/alerts/evaluate-now` — On-demand worker evaluation cycle.
- `GET /api/notifications` — Notification inbox with read status management.

### **Analytics, Optimization & Backtest (Phase 4)**
- `POST /api/backtest` — Strategy simulation (SMA Crossover, SIP vs Lumpsum, Buy & Hold) against real market prices with 0.10% slippage and Indian taxes.
- `GET /api/optimize?riskBand=...` — Markowitz Efficient Frontier generation with Max-Sharpe and Min-Variance allocations.
- `GET /api/model-transparency` — Walk-forward validation audit metrics and majority baseline benchmark comparison.

### **AI Upgrades, RAG & News Linking (Phase 5)**
- `POST /api/copilot/chat` — RupeeBot AI Copilot with RAG statutory retrieval, markdown citations, and no-source honesty disclosure.
- `GET /api/rag/sources` — List public SEBI circulars and Income Tax Act guidance available for RAG.
- `POST /api/rag/ingest` — Admin ingestion trigger to parse and embed public sources into MongoDB.
- `GET /api/news/portfolio` — RSS articles matched to user holdings/watchlist with sentiment tagging (`BULLISH`, `BEARISH`, `NEUTRAL`).

---

## 5. Automated Test Suites (Vitest)

1. `src/test/triplePassClientVerification.test.ts` (51 tests) — Navigation, routes, accessibility, error boundaries.
2. `src/test/scoringOnboarding.test.ts` (1 test) — Fiduciary risk band scoring algorithm.
3. `src/test/calculators.test.ts` (5 tests) — SIP, Step-Up SIP, SWP, Lumpsum calculations.
4. `src/test/xirrPerformance.test.ts` (6 tests) — Newton-Raphson XIRR convergence, CAGR, cash flow validation.
5. `src/test/accessPolicy.test.ts` (4 tests) — JWT protection and onboarding gates.
6. `src/test/taxRebalanceGoals.test.ts` (10 tests) — FIFO lots, STCG 20%, LTCG 12.5%, drift threshold, skip-SIP simulator.
7. `src/test/alertsEngine.test.ts` (12 tests) — Price above/below, signal flip, allocation drift, cooldown triggers.
8. `src/test/backtestOptimization.test.ts` (9 tests) — Portfolio variance math, correlation matrix symmetry, Max Drawdown, Win Rate, model transparency baseline.
9. `src/test/aiRagExplainability.test.ts` (7 tests) — Cosine similarity, unit vector normalization, explainability factor computation, news sentiment classification.

**Total passing tests:** 105 tests across 9 suites (100% pass rate).

---

## 6. Statutory & Educational Compliance

In accordance with SEBI (Investment Advisers) Regulations, 2013 and AMFI Code of Conduct:
- RupeeMind is designed strictly as an educational and analytical research platform.
- Persistent `DisclaimerBanner` components are rendered on Tax, Signals, Backtest, and Advisory views:
  > *"Educational use only. Not SEBI-registered investment advice or certified chartered accountancy tax filing advice."*
- Capital gains computations reflect the **Finance (No. 2) Act 2024** provisions (20% STCG under Section 111A, 12.5% LTCG under Section 112A above ₹1.25 Lakhs annual threshold).
