# RupeeMind: Features & Mathematical Formulas Reference Manual

---

## Executive Overview

**RupeeMind** is an enterprise-grade financial intelligence, wealth analytics, and risk management platform engineered specifically for the Indian capital markets (NSE & BSE equities, AMFI direct mutual funds). It bridges the institutional analytical divide by equipping retail investors with Modern Portfolio Theory (MPT), machine-learning market direction classification (XGBoost), Basel III-compliant Value-at-Risk (VaR) engines, Monte Carlo simulation, and an authentic simulated paper trading sandbox pre-seeded with ₹10,00,000 in virtual capital.

---

# Part 1: Technology Stack & System Architecture

RupeeMind is engineered as a decoupled, multi-tier microservice architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RUPEEMIND ECOSYSTEM                             │
├─────────────────────┬──────────────────────┬────────────────────────────────┤
│   Presentation      │  Backend & Gateway   │      Data & Microservices      │
├─────────────────────┼──────────────────────┼────────────────────────────────┤
│ • React 19 SPA      │ • Node.js / Express  │ • MongoDB Community (Port 27017)│
│ • TypeScript 6      │ • Socket.IO Ticks    │ • Python FastAPI (Port 8000)   │
│ • Vite 8            │ • Dual-Token JWT Auth│ • XGBoost 56-Feature Engine    │
│ • Tailwind CSS 4    │ • Node-Cache In-Mem  │ • Google Gemini 2.5 Flash API  │
│ • Recharts & Lucide │ • Node-Cron AMFI Sync│ • Yahoo Finance & AMFI MFAPI   │
└─────────────────────┴──────────────────────┴────────────────────────────────┘
```

### Component Roles

1. **Frontend Presentation Tier (React 19 + TypeScript + Vite + Tailwind CSS 4)**
   - Delivers a non-blocking, responsive interface with concurrent rendering.
   - Features real-time price updates via WebSockets, interactive charts, and accessible dark/light financial themes.
2. **Backend API Gateway Tier (Node.js + Express.js)**
   - Manages user sessions with dual-token JWT authentication (15-minute access token + 7-day rotating refresh token in `httpOnly` cookie with session-reuse detection).
   - Ingests real-time market data from Yahoo Finance and AMFI, handles paper trading order execution, and orchestrates stress testing.
3. **Database Tier (MongoDB Community + Mongoose 8)**
   - Persists user profiles, portfolios, real and paper holdings, transactions, and audit trails.
4. **Machine Learning Microservice (Python + FastAPI + XGBoost)**
   - Computes 56 quantitative technical and statistical features to estimate 5-day forward price direction probabilities.
   - Protected by an Express-side circuit breaker with automated fallback to rule-based technical signals.
5. **Generative AI Copilot (Google Gemini 2.5 Flash)**
   - Powers **RupeeBot** (`Ctrl + J`), contextualized with the user's real holdings, risk capacity, and cashflow data, while enforcing SEBI-compliant educational disclaimers.

---

# Part 2: Comprehensive Platform Features

### 1. Authentication & Security

- **Dual-Token JWT Security**: Short-lived access token kept in memory; long-lived refresh token stored in an `httpOnly`, `secure`, `sameSite` cookie.
- **Session-Theft Reuse Detection**: Re-submitting an invalidated refresh token automatically invalidates all active sessions for that account.
- **Bcrypt Password Hashing**: Salted encryption with a cost factor of 12.

### 2. 5-Step Investor Risk & Health Profiling (`/onboarding`)

- **Step 1: Personal Profile & Time Horizon**: Collects age, dependants, and investment horizon.
- **Step 2: Financial Cashflow & Solvency**: Analyzes monthly income, non-discretionary expenses, monthly EMIs, and existing liquid emergency savings.
- **Step 3: Behavioral Risk Tolerance**: Administers a psychometric questionnaire measuring drawdown reactions.
- **Step 4: Protection & Habits**: Assesses term life and health insurance coverage, alongside investing regularity.
- **Step 5: Automated Scoring**: Generates a normalized **Risk Score (0–100)**, **Financial Health Score (0–100)**, and assigns the user to a calibrated risk band.

### 3. Executive Dashboard (`/dashboard`)

- **Real-Time Portfolio Overview**: Displays total net worth, day P&L, cumulative gain/loss %, and cash allocations.
- **Health & Risk Gauges**: Interactive dials showing current financial health status and assigned risk band.
- **Live Market Highlights**: Real-time ticker feeds for Nifty 50, Sensex, and top market gainers/losers.
- **Paper Trading Snapshot**: Instant view of virtual cash balance and active open positions.

### 4. Market Screener & Stock Intelligence (`/market` & `/market/:symbol`)

- **Live Tick Streaming**: Persistent Socket.IO updates during NSE trading hours (09:15 to 15:30 IST).
- **Dual-Engine Market Signals**: Displays `STRONG BUY`, `BUY`, `HOLD`, `SELL`, or `STRONG SELL` based on:
  - Deterministic indicator rules (RSI, MACD, Bollinger Bands, SMA-50/200, Volume).
  - 56-feature XGBoost machine learning forward prediction.
- **5-Year Walk-Forward Backtester**: Reports historical win rates, total trade counts, and average gain per trade.
- **Interactive Technical Candlesticks**: Candlestick charting with timeframe selection (1D, 1W, 1M, 1Y, 5Y) and indicator overlays.

### 5. Direct Mutual Funds Hub (`/funds`, `/funds/:code`, `/funds/compare`)

- **AMFI MFAPI Synchronization**: Daily automated cron synchronization of 40+ direct growth mutual fund schemes.
- **Quantitative Fund Ranking**: Ranks schemes using 3Y/5Y CAGR, Sharpe ratio, volatility, and max drawdown.
- **Fund Comparison Matrix**: Side-by-side comparison of up to 3 funds analyzing returns, expense ratios, and historical volatility.

### 6. Virtual Paper Trading Sandbox (`/paper-trading`)

- **Virtual Capital**: Pre-seeded with ₹10,00,000 in virtual cash for risk-free simulation.
- **Order Execution**:
  - `MARKET`: Instant fill at prevailing live price.
  - `LIMIT`: Queued in database and filled automatically when market price matches the limit criteria.
- **Product Types**: `DELIVERY` (long-term equity) and `INTRADAY` (day-trading).
- **Indian Statutory Charges Engine**: Deducts STT, NSE turnover charges, SEBI fees, GST (18%), and Stamp Duty.
- **Positions & Portfolio Table**: Real-time position tracking with weighted average buy price, current valuation, and unrealized P&L.

### 7. Portfolio Tracker & Diagnostics (`/portfolio`)

- **Unified Holdings View**: Combines real user-entered investments with paper trading positions.
- **Asset Allocation Charts**: Donut charts detailing equity vs. fund splits and market-cap distributions.
- **Concentration Risk Alerts**: Warns against single-stock concentration (>25%) and missing defensive assets.

### 8. Institutional Crisis Stress Simulator (`/crisis-simulator`)

- **Historical Crisis Replays**: Simulates the impact of historic market crises on the user's specific holdings:
  1. *2020 COVID-19 Pandemic Crash* (Nifty -38.4%)
  2. *2008 Lehman Brothers Global Financial Crisis* (Nifty -55.2%)
  3. *2022 Russia-Ukraine $130 Crude Conflict* (Nifty -15.5%)
  4. *Severe Stagflation & 150 bps RBI Rate Hike* (Nifty -22.0%)
- **Custom Market Shock Slider**: Allows user-defined shocks (-50% to +50%) mapped across individual asset Betas.
- **Vulnerability Insights**: Highlights hardest-hit holdings, resilient buffers, and defensive rebalancing recommendations.

### 9. Quantitative Risk Suite (VaR & CVaR) (`/analytics?tab=var`)

- **Basel III Parametric Value at Risk (VaR)**: Calculates 1-day and 30-day VaR at 95% and 99% confidence levels.
- **Conditional VaR (CVaR / Expected Shortfall)**: Estimates the expected loss when the 95% VaR threshold is breached.
- **Portfolio Sensitivity Metrics**: Displays weighted portfolio Beta and annualized portfolio volatility.

### 10. 1,000-Path Monte Carlo Simulation (`/analytics?tab=monte-carlo`)

- **Geometric Brownian Motion (GBM)**: Simulates 1,000 random asset trajectories over horizons of 30 to 252 trading days.
- **Percentile Distributions**: Evaluates 5th (Bear Case), 25th, 50th (Median), 75th, and 95th (Bull Case) percentile outcomes.

### 11. AI Financial Recommendations (`/recommendations`)

- **Risk-Calibrated Filtering**: Restricts fund choices strictly to categories aligned with the user's risk band.
- **Holdings-Aware AI Reasoning**: Leverages Google Gemini 2.5 Flash to synthesize portfolio allocations and financial goals into actionable, educational recommendations.

### 12. RupeeBot AI Copilot (`Ctrl + J`)

- **Persistent Floating Drawer**: Accessible globally via keyboard shortcut or floating trigger.
- **Context Injection**: Automatically injects live portfolio holdings, risk profile scores, cash balance, and market data into prompt context.
- **Compliance Guardrails**: Enforces SEBI-compliant educational disclaimers across all AI interactions.

### 13. Financial Calculators Suite (`/calculators`)

- Five dedicated calculation modules: Regular SIP, Annual Step-Up SIP, Lumpsum, Goal Target Planner, and Inflation-Adjusted Purchasing Power.
- Authenticated users can save calculation configurations directly to their profile.

### 14. Institutional Portfolio Audit Dossier (Print-Ready PDF)

- **Single-Click Audit Dossier**: Generates a clean, exportable PDF report summarizing asset allocation, risk metrics, and diversification.
- **Indian Tax Estimator (Budget 2024 Rules)**: Estimates Long-Term Capital Gains (LTCG) tax (12.5% above ₹1.25 Lakh exemption) and Short-Term Capital Gains (STCG) tax (20%), alongside tax-loss harvesting potential.

### 15. Learning Center & Financial News (`/learn` & `/news`)

- **Educational Modules**: Structured guides on risk mitigation, compounding, portfolio theory, and debt ratios.
- **Curated News Stream**: Real-time RSS ingestion from *The Economic Times*.

---

# Part 3: Financial & Technical Glossary

| Technical Term | Everyday Definition |
| --- | --- |
| **JWT Authentication** | A secure token-based mechanism verifying user identity without storing session state on the server. |
| **KYC Profiling** | A questionnaire evaluating an investor's financial health, experience, and risk tolerance. |
| **XGBoost** | A gradient-boosted decision tree algorithm that identifies non-linear patterns in financial data. |
| **RSI (Relative Strength Index)** | A momentum oscillator (0–100) measuring the speed and change of price movements to flag overbought/oversold states. |
| **MACD** | A trend-following momentum indicator displaying the relationship between two moving averages of an asset's price. |
| **Backtesting** | Simulating a quantitative trading strategy across historical price bars to evaluate past profitability and risk. |
| **Monte Carlo Simulation** | An algorithmic technique that models future uncertainty by calculating thousands of possible outcome trajectories. |
| **Value at Risk (VaR)** | A statistical metric estimating the maximum probable financial loss over a given timeframe at a specific confidence level. |
| **Expected Shortfall (CVaR)** | The expected average loss on occasions when the loss breaches the VaR threshold (tail risk). |
| **CAGR** | Compound Annual Growth Rate; represents the steady annual rate at which an investment grows over multiple years. |
| **XIRR** | Extended Internal Rate of Return; calculates annualized returns for investments with irregular cash inflow and outflow dates. |
| **Portfolio Diversification** | Allocating capital across uncorrelated assets to minimize idiosyncratic (single-stock) risk. |

---

# Part 4: Complete Mathematical Formulas & Logic

Below is the complete catalog of mathematical formulas and algorithms implemented across the RupeeMind codebase.

---

## 1. Financial Compounding Calculators (`src/lib/calculators.ts`)

### 1.1 Regular Systematic Investment Plan (SIP)

Calculated as an annuity due (investments made at the beginning of each monthly period):

$$\text{Monthly Interest Rate } (i) = \frac{R}{12 \times 100}$$

$$\text{Total Compounding Periods } (n) = \text{Duration in Years} \times 12$$

$$\text{Future Value } (FV) = P \times \left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)$$

$$\text{Total Invested Capital } (I) = P \times n$$

$$\text{Estimated Wealth Gain } (G) = FV - I$$

*Where:*

- $P$ = Monthly installment amount (₹)
- $R$ = Expected annual return rate (%)
- $i$ = Monthly fractional interest rate
- $n$ = Total number of monthly installments

---

### 1.2 Annual Step-Up SIP Calculator

Models annual percentage step-ups ($s\%$) in monthly investments:

$$\text{Monthly Contribution in Year } y: \quad P_y = P_0 \times \left(1 + \frac{s}{100}\right)^{y - 1}$$

For each month $m \in [1, 12]$ in year $y$, portfolio growth is updated recursively:

$$V_t = (V_{t-1} + P_{\text{current}}) \times (1 + i)$$

*Where:*

- $P_0$ = Initial monthly installment
- $s$ = Annual step-up percentage (e.g., 10%)
- $y$ = Current year index ($1 \le y \le \text{Years}$)
- $V_t$ = Accumulated value at month $t$

---

### 1.3 Lumpsum Investment Calculator

Standard compound growth formula:

$$FV = P_{\text{lump}} \times \left(1 + \frac{R}{100}\right)^Y$$

$$\text{Estimated Wealth Gain } (G) = FV - P_{\text{lump}}$$

*Where:*

- $P_{\text{lump}}$ = Initial one-time investment principal (₹)
- $Y$ = Investment horizon in years

---

### 1.4 Goal Target Planner

Computes the monthly contribution $P$ required to accumulate target corpus $T$:

$$P = \frac{T}{\left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)}$$

The platform rounds $P$ up to the nearest ₹100:

$$P_{\text{recommended}} = \left\lceil \frac{P}{100} \right\rceil \times 100$$

Inflation-adjusted future target corpus (assuming a 6% long-term Indian inflation baseline):

$$T_{\text{inflated}} = T \times (1 + 0.06)^Y$$

---

### 1.5 Inflation-Adjusted Returns (Fisher Equation)

Evaluates real purchasing power after discounting inflation:

$$r_n = \frac{R}{100}, \quad r_i = \frac{\text{Inflation Rate}}{100}$$

$$\text{Real Return Rate } (r_{\text{real}}) = \frac{1 + r_n}{1 + r_i} - 1$$

$$\text{Real Purchasing Power} = \frac{FV_{\text{nominal}}}{(1 + r_i)^Y}$$

---

## 2. Investor Risk Scoring Engine (`server/src/services/scoreService.js`)

### 2.1 Weighted Risk Score ($0 - 100$)

$$\text{Risk Score} = 0.35 S_{\text{quiz}} + 0.20 S_{\text{horizon}} + 0.15 S_{\text{age}} + 0.10 S_{\text{income}} + 0.10 S_{\text{dependents}} + 0.10 S_{\text{experience}}$$

1. **Normalized Psychometric Quiz ($S_{\text{quiz}}$)**:
   $$S_{\text{quiz}} = \max\left(0, \min\left(100, \frac{\bar{Q} - 1}{4} \times 100\right)\right)$$
   *(where $\bar{Q}$ is the average score from 1 to 5)*

2. **Investment Horizon ($S_{\text{horizon}}$)**:
   - $<1 \text{ year} \implies 10$
   - $1 - 3 \text{ years} \implies 30$
   - $3 - 5 \text{ years} \implies 55$
   - $5 - 10 \text{ years} \implies 80$
   - $>10 \text{ years} \implies 100$

3. **Age Component ($S_{\text{age}}$)**:
   - $\le 25 \text{ years} \implies 100$
   - $26 - 35 \text{ years} \implies 85$
   - $36 - 45 \text{ years} \implies 65$
   - $46 - 55 \text{ years} \implies 40$
   - $> 55 \text{ years} \implies 20$

4. **Income Stability ($S_{\text{income}}$)**:
   - Government employee $\implies 100$
   - Private sector employee $\implies 75$
   - Business owner / Self-employed $\implies 55$
   - Freelancer / Gig worker $\implies 45$
   - Student $\implies 35$

5. **Dependents Component ($S_{\text{dependents}}$)**:
   - $0 \text{ dependents} \implies 100$
   - $1 \text{ dependent} \implies 75$
   - $2 \text{ dependents} \implies 50$
   - $\ge 3 \text{ dependents} \implies 30$

6. **Market Experience ($S_{\text{experience}}$)**:
   - None $\implies 20$
   - Beginner $\implies 50$
   - Intermediate $\implies 75$
   - Experienced $\implies 100$

### 2.2 Risk Band Classification

| Score Range | Assigned Risk Band |
| --- | --- |
| $0 - 30$ | **Conservative** |
| $31 - 50$ | **Moderately Conservative** |
| $51 - 70$ | **Moderate** |
| $71 - 85$ | **Moderately Aggressive** |
| $86 - 100$ | **Aggressive** |

---

## 3. Financial Health Scoring Engine (`server/src/services/scoreService.js`)

### 3.1 Weighted Health Score ($0 - 100$)

$$\text{Health Score} = 0.30 S_{\text{savings}} + 0.25 S_{\text{emergency}} + 0.25 S_{\text{emi}} + 0.10 S_{\text{insurance}} + 0.10 S_{\text{habit}}$$

1. **Savings Rate Factor ($S_{\text{savings}}$)**:
   $$\text{Savings Rate} = \frac{\text{Monthly Savings}}{\text{Monthly Income}}$$
   - $\ge 30\% \implies 100$
   - $20\% - 30\% \implies 80$
   - $10\% - 20\% \implies 55$
   - $5\% - 10\% \implies 30$
   - $< 5\% \implies 10$

2. **Emergency Fund Runway ($S_{\text{emergency}}$)**:
   $$\text{Runway in Months} = \frac{\text{Liquid Emergency Savings}}{\text{Monthly Expenses}}$$
   - $\ge 6 \text{ months} \implies 100$
   - $3 - 6 \text{ months} \implies 70$
   - $1 - 3 \text{ months} \implies 40$
   - $< 1 \text{ month} \implies 10$

3. **Debt / EMI Ratio ($S_{\text{emi}}$)**:
   $$\text{EMI Ratio} = \frac{\text{Total Monthly EMIs}}{\text{Monthly Income}}$$
   - $\le 20\% \implies 100$
   - $20\% - 35\% \implies 70$
   - $35\% - 50\% \implies 40$
   - $> 50\% \implies 10$

4. **Insurance Protection ($S_{\text{insurance}}$)**:
   - Both Health & Term Life insurance active $\implies 100$
   - Either Health OR Term Life active $\implies 50$
   - Neither active $\implies 0$

5. **Investing Habit Regularity ($S_{\text{habit}}$)**:
   - Invests regularly $\implies 100$
   - Invests occasionally $\implies 50$
   - Not investing yet $\implies 0$

### 3.2 Health Rating Bands

- $0 - 40 \implies$ **Needs Attention**
- $41 - 70 \implies$ **Stable**
- $71 - 100 \implies$ **Strong**

---

## 4. Paper Trading Indian Statutory Fee Engine (`server/src/services/paperTradingService.js`)

Computes regulatory Indian exchange charges per trade:

$$\text{Turnover } (T) = \text{Execution Price} \times \text{Executed Quantity}$$

| Fee Component | Equity Delivery | Equity Intraday | Applicability |
| --- | --- | --- | --- |
| **Brokerage** | ₹0.00 | $\min(₹20, 0.03\% \times T)$ | Both Buy and Sell |
| **STT** (Securities Transaction Tax) | $0.1\% \times T$ | $0.025\% \times T$ | Delivery: Both sides; Intraday: Sell side only |
| **Exchange Turnover Fee** (NSE) | $0.00345\% \times T$ | $0.00345\% \times T$ | Both Buy and Sell |
| **SEBI Turnover Charge** | $0.0001\% \times T$ | $0.0001\% \times T$ | Both Buy and Sell (₹10 / Crore) |
| **Stamp Duty** | $0.015\% \times T$ | $0.003\% \times T$ | Buy side only |
| **GST** | $18\%$ | $18\%$ | On $(\text{Brokerage} + \text{Exchange Fee} + \text{SEBI Fee})$ |

$$\text{Total Deductions } (C) = \text{Brokerage} + \text{STT} + \text{Exchange Fee} + \text{SEBI Fee} + \text{Stamp Duty} + \text{GST}$$

$$\text{Net BUY Debit} = T + C$$

$$\text{Net SELL Credit} = T - C$$

### Weighted Average Price & Position P&L

When adding $Q_2$ shares at price $P_2$ to an existing holding of $Q_1$ shares at average price $P_1$:

$$P_{\text{avg, new}} = \frac{(Q_1 \times P_1) + (Q_2 \times P_2)}{Q_1 + Q_2}$$

$$\text{Unrealized P\&L (₹)} = (P_{\text{live}} - P_{\text{avg}}) \times Q_{\text{total}}$$

$$\text{Unrealized P\&L } (\%) = \frac{\text{Unrealized P\&L}}{P_{\text{avg}} \times Q_{\text{total}}} \times 100$$

---

## 5. Technical Signal Scoring Engine (`server/src/services/signalService.js`)

The rule-based signal engine scores stocks on a scale from **$-8$ to $+8$** across 5 indicators:

$$S_{\text{total}} = S_{\text{RSI}} + S_{\text{MACD}} + S_{\text{SMA}} + S_{\text{BB}} + S_{\text{VOL}}$$

```
Indicator Point System:

1. RSI (14-period Wilder):
   • RSI < 30 (Oversold)             --> +2 points
   • 30 <= RSI < 40                  --> +1 point
   • RSI > 70 (Overbought)           --> -2 points
   • 60 < RSI <= 70                  --> -1 point

2. MACD (12, 26, 9):
   • Bullish Crossover               --> +2 points
   • Bearish Crossover               --> -2 points
   • MACD > Signal Line              --> +1 point
   • MACD < Signal Line              --> -1 point

3. Moving Averages (SMA-50 & SMA-200):
   • Golden Cross (50 crosses > 200) --> +2 points
   • Death Cross (50 crosses < 200)  --> -2 points
   • Price > SMA-50                  --> +1 point
   • Price < SMA-50                  --> -1 point

4. Bollinger Bands (20-period, 2 std dev):
   • Price < Lower Band              --> +1 point
   • Price > Upper Band              --> -1 point

5. Volume Confirmation:
   • Vol > 20-day SMA & Close > Prev --> +1 point
   • Vol > 20-day SMA & Close < Prev --> -1 point
```

### Signal Action Mapping

- $S_{\text{total}} \ge +5 \implies$ **STRONG BUY**
- $S_{\text{total}} \in [+3, +4] \implies$ **BUY**
- $S_{\text{total}} \in [-2, +2] \implies$ **HOLD**
- $S_{\text{total}} \in [-4, -3] \implies$ **SELL**
- $S_{\text{total}} \le -5 \implies$ **STRONG SELL**

---

## 6. Portfolio Risk, Basel III VaR & Expected Shortfall (`server/src/services/stressTestService.js`)

### 6.1 Weighted Metrics

Given $k$ assets with current values $V_i$ in portfolio value $V_p = \sum_{i=1}^k V_i$:

$$\text{Asset Weight } (w_i) = \frac{V_i}{V_p}$$

$$\text{Portfolio Beta } (\beta_p) = \sum_{i=1}^k w_i \cdot \beta_i$$

$$\text{Portfolio Annual Volatility } (\sigma_p) = \sum_{i=1}^k w_i \cdot \sigma_i$$

$$\text{Daily Volatility } (\sigma_{\text{daily}}) = \frac{\sigma_p}{\sqrt{252}}$$

---

### 6.2 Parametric Value-at-Risk (VaR)

Using standard normal distribution critical values ($Z_{0.95} = 1.645$, $Z_{0.99} = 2.326$):

$$\text{VaR}_{95\%}^{1\text{ Day}} = V_p \times \sigma_{\text{daily}} \times 1.645$$

$$\text{VaR}_{99\%}^{1\text{ Day}} = V_p \times \sigma_{\text{daily}} \times 2.326$$

Scaling across a 30-day horizon:

$$\text{VaR}_{95\%}^{30\text{ Day}} = \text{VaR}_{95\%}^{1\text{ Day}} \times \sqrt{30}$$

$$\text{VaR}_{99\%}^{30\text{ Day}} = \text{VaR}_{99\%}^{1\text{ Day}} \times \sqrt{30}$$

---

### 6.3 Expected Shortfall / Conditional VaR (CVaR)

Measures the expected average loss given that the 95% VaR threshold is breached:

$$\text{CVaR}_{95\%}^{1\text{ Day}} = \text{VaR}_{95\%}^{1\text{ Day}} \times 1.25$$

$$\text{CVaR}_{95\%}^{30\text{ Day}} = \text{VaR}_{95\%}^{30\text{ Day}} \times 1.25$$

---

## 7. 1,000-Path Monte Carlo Simulation (GBM) (`server/src/services/stressTestService.js`)

Simulates portfolio trajectory $S_t$ using Geometric Brownian Motion:

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

Discrete daily update step ($dt = \frac{1}{252}$):

$$S_{t+1} = S_t \times \exp\left( \left(\mu - \frac{1}{2}\sigma^2\right) dt + \sigma \sqrt{dt} \cdot Z \right)$$

*Where:*

- $\mu = 0.135$ (Historical Nifty long-term 13.5% CAGR)
- $\sigma = \max(0.12, \sigma_p)$ (Portfolio volatility floored at 12%)
- $Z \sim \mathcal{N}(0, 1)$ generated via the **Box-Muller Transform**:
  $$Z = \sqrt{-2 \ln(U_1)} \cos(2\pi U_2), \quad U_1, U_2 \in (0, 1]$$

### Trajectory Percentile Sorts

Across 1,000 generated paths, values are sorted at each sampled time step to extract:

- **5th Percentile ($P_5$)**: Bear Case projection
- **25th Percentile ($P_{25}$)**: Below-average outcome
- **50th Percentile ($P_{50}$)**: Median expectation
- **75th Percentile ($P_{75}$)**: Above-average outcome
- **95th Percentile ($P_{95}$)**: Bull Case projection

---

## 8. Historical Crisis Stress Testing (`server/src/services/stressTestService.js`)

Evaluates portfolio losses under market stress:

$$\Delta_i = \begin{cases} \text{Sector Shock Rate} & \text{if Historical Crisis Scenario} \\ \beta_i \times \Delta_{\text{market}} & \text{if Custom Shock Slider} \end{cases}$$

$$\text{Projected Asset Value}_i = \max\left(0, V_i \times \left(1 + \frac{\Delta_i}{100}\right)\right)$$

$$\text{Total Portfolio Loss} = \sum_{i=1}^k \text{Projected Asset Value}_i - V_p$$

$$\text{Portfolio Drop } (\%) = \frac{\text{Total Portfolio Loss}}{V_p} \times 100$$

---

## 9. XIRR (Extended Internal Rate of Return) (`server/src/services/xirrService.js`)

Computes the annualized internal rate of return for irregular transaction cashflows:

$$f(r) = \sum_{j=0}^m \frac{C_j}{(1 + r)^{t_j}} = 0, \quad \text{where } t_j = \frac{d_j - d_0}{365.25}$$

*Where:*

- $C_j$ = Cash flow amount on date $d_j$ (investments are negative, withdrawals/current values are positive)
- $d_0$ = Date of initial transaction
- $t_j$ = Fractional elapsed time in years
- $r$ = Annualized XIRR return rate

### Newton-Raphson Numerical Solution

$$r_{k+1} = r_k - \frac{f(r_k)}{f'(r_k)}$$

Derivative function:

$$f'(r) = \sum_{j=1}^m -t_j \cdot C_j \cdot (1 + r)^{-t_j - 1}$$

- **Convergence Settings**: Stops when $|f(r)| < 10^{-6}$ within a maximum of 60 iterations.
- **Bisection Fallback**: If $|f'(r)| < 10^{-10}$ or divergence occurs, switches to bisection over $[-0.99, 10.0]$ with a tolerance of $10^{-6}$.

---

## 10. Mutual Fund Composite Scoring (`server/src/services/recommendationService.js`)

Evaluates and shortlists direct mutual funds mathematically:

$$\text{Composite Score} = \frac{0.30 \cdot \max(0, \text{CAGR}_{3Y}) + 0.20 \cdot \max(0, \text{CAGR}_{5Y}) + 0.20 \cdot (\text{Sharpe} \times 10) + 0.15 \cdot S_{\text{vol}} + 0.15 \cdot S_{\text{drawdown}}}{\sum \text{Weights Present}}$$

*Where:*

- **Volatility Penalty**: $S_{\text{vol}} = \max(0, 30 - \sigma_{\text{fund}})$
- **Drawdown Penalty**: $S_{\text{drawdown}} = \max(0, 40 - |\text{Max Drawdown}|)$

---

## 11. Portfolio Health & Diversification Scoring (`server/src/services/analyticsService.js`)

$$\text{Health Score} = 50 + \Delta_{\text{holdings}} + \Delta_{\text{top\_holding}} + \Delta_{\text{allocation}} + \Delta_{\text{pnl}}$$

1. **Asset Count Diversification ($\Delta_{\text{holdings}}$)**:
   - $\ge 8 \text{ assets} \implies +15$
   - $4 - 7 \text{ assets} \implies +10$
   - $2 - 3 \text{ assets} \implies +5$
   - $< 2 \text{ assets} \implies -5$

2. **Top Holding Concentration Risk ($\Delta_{\text{top\_holding}}$)**:
   - Top asset weight $< 20\% \implies +15$
   - Top asset weight $20\% - 35\% \implies +5$
   - Top asset weight $35\% - 55\% \implies 0$
   - Top asset weight $> 55\% \implies -10$

3. **Asset Allocation Balance ($\Delta_{\text{allocation}}$)**:
   - Both Equities $> 10\%$ AND Mutual Funds $> 10\% \implies +10$

4. **Performance Contribution ($\Delta_{\text{pnl}}$)**:
   - Overall gain $> 15\% \implies +10$
   - Overall gain $0\% - 15\% \implies +5$
   - Overall loss $< -15\% \implies -10$

$$\text{Final Health Score} = \min(98, \max(10, \text{Health Score}))$$

---

## 12. Institutional Capital Gains Tax Estimator (`server/src/services/reportService.js`)

Applies Indian Union Budget 2024 taxation rules for equity instruments:

$$\text{Holding Period Classification}: \quad \begin{cases} t > 365 \text{ days} & \implies \text{Long-Term (LTCG)} \\ t \le 365 \text{ days} & \implies \text{Short-Term (STCG)} \end{cases}$$

### Tax Liability Calculations

$$\text{Taxable LTCG} = \max(0, \text{Total LTCG Gains} - ₹1,25,000)$$

$$\text{LTCG Tax Liability} = \text{Taxable LTCG} \times 12.5\%$$

$$\text{STCG Tax Liability (Section 111A)} = \text{Total STCG Gains} \times 20.0\%$$

$$\text{Total Estimated Tax Liability} = \text{LTCG Tax Liability} + \text{STCG Tax Liability}$$

$$\text{Tax-Loss Harvesting Potential} = \sum |\text{Unrealized Capital Losses}|$$

---

# Part 5: Formula Index & Quick Reference

| # | Domain | Core Formulas & Algorithms | Primary Implementation File |
| --- | --- | --- | --- |
| **1** | SIP Compounding | $FV = P \left[\frac{(1+i)^n - 1}{i}\right](1+i)$ | `src/lib/calculators.ts` |
| **2** | Step-Up SIP | $P_y = P_0(1+s)^{y-1}, \quad V_t = (V_{t-1}+P)(1+i)$ | `src/lib/calculators.ts` |
| **3** | Lumpsum Growth | $FV = P(1+R/100)^Y$ | `src/lib/calculators.ts` |
| **4** | Goal Planner | $P = T / (\text{FVIFA} \times (1+i)), \quad T_{\text{inf}} = T(1.06)^Y$ | `src/lib/calculators.ts` |
| **5** | Real Purchasing Power | $r_{\text{real}} = \frac{1+r_n}{1+r_i} - 1, \quad PP = \frac{FV}{(1+r_i)^Y}$ | `src/lib/calculators.ts` |
| **6** | Investor Risk Score | 6-factor weighted linear combination ($0–100$) | `server/src/services/scoreService.js` |
| **7** | Financial Health Score | Savings rate, emergency fund, and EMI debt ratios | `server/src/services/scoreService.js` |
| **8** | Indian Statutory Taxes | STT, NSE Turnover, SEBI fees, GST (18%), Stamp Duty | `server/src/services/paperTradingService.js` |
| **9** | Technical Signals | RSI, MACD, Bollinger Bands, SMA-50/200, Volume scoring | `server/src/services/signalService.js` |
| **10** | Basel III VaR & CVaR | $\text{VaR} = V_p \sigma_{\text{daily}} Z, \quad \text{CVaR} = \text{VaR} \times 1.25$ | `server/src/services/stressTestService.js` |
| **11** | Monte Carlo (GBM) | $S_{t+1} = S_t \exp\left((\mu - \frac{1}{2}\sigma^2)dt + \sigma\sqrt{dt} Z\right)$ | `server/src/services/stressTestService.js` |
| **12** | Crisis Simulator | $\Delta_i = \beta_i \Delta_{\text{market}}$ or sector shock | `server/src/services/stressTestService.js` |
| **13** | XIRR Engine | Newton-Raphson root finding with bisection fallback | `server/src/services/xirrService.js` |
| **14** | Mutual Fund Ranking | Multi-metric weighted score (CAGR, Sharpe, Drawdown) | `server/src/services/recommendationService.js` |
| **15** | Portfolio Health Score | Concentration penalties and asset allocation bonuses | `server/src/services/analyticsService.js` |
| **16** | Capital Gains Tax | LTCG ($12.5\%$ above ₹1.25L), STCG (flat $20\%$) | `server/src/services/reportService.js` |
