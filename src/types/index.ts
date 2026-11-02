export type RiskBand =
  | "Conservative"
  | "Moderately Conservative"
  | "Moderate"
  | "Moderately Aggressive"
  | "Aggressive";

export type HealthBand = "Needs attention" | "Stable" | "Strong";

export type CapacityBand = "Low" | "Moderate" | "High";

export type GoalCategory =
  | "Wealth creation"
  | "Retirement"
  | "House"
  | "Education"
  | "Child"
  | "Tax saving"
  | "Emergency"
  | "Other";

export type GoalPriority = "Critical" | "Important" | "Flexible";

export interface FinancialGoalItem {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  horizonYears: number;
  priority: GoalPriority;
  requiredMonthlySIP?: number;
  feasible?: boolean;
  recommendedAllocation?: { equity: number; debt: number; gold: number };
  deficitAmount?: number;
}

export interface GoalsAssessmentSummary {
  totalMonthlySIPRequired: number;
  investibleSurplus: number;
  surplusGap: number;
  isFullyFundable: boolean;
  goals: FinancialGoalItem[];
}

export interface UserProfile {
  // Step 1: Demographics & Horizon Runway
  age: number;
  occupation:
    | "Government"
    | "Private"
    | "Business"
    | "Freelance"
    | "Student"
    | "Other";
  city: string;

  // Step 2: Money (Monthly Cash Flow & Liquidity)
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEMIs: number;
  monthlySavings: number;
  emergencyFundAmount: number;

  // Step 3: Individually Assessable Goals
  goalType:
    | "Wealth creation"
    | "Retirement"
    | "House"
    | "Education"
    | "Child"
    | "Tax saving";
  targetAmount: number;
  horizonYears: number;
  goals?: FinancialGoalItem[];
  goalsAssessment?: GoalsAssessmentSummary;

  // Step 4: Psychological Risk Tolerance (Behavioral Quiz)
  quizScores: number[];
  riskToleranceScore?: number;
  riskToleranceBand?: RiskBand;

  // Step 5: Financial Risk Capacity (Structural Protection & Balance Sheet Ability)
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  dependentsCount: number;
  riskCapacityScore?: number;
  riskCapacityBand?: CapacityBand;

  // Step 6: Market Experience & Habits
  investingExperience: "None" | "Beginner" | "Intermediate" | "Experienced";
  investingRegularity?: "Regularly" | "Occasionally" | "Not yet";

  // Effective / Constrained Risk & Assessment Engine Outputs
  effectiveRiskBand?: RiskBand;
  effectiveRiskScore?: number;
  isRiskConstrained?: boolean;
  riskConstraintReason?: string;

  // Backwards compatibility aliases
  riskScore?: number;
  riskBand?: RiskBand;
  financialHealthScore?: number;
  financialHealthBand?: HealthBand;
  calculatedAt?: string;
  scoreHistory?: {
    date: string;
    risk: number;
    financialHealth: number;
    reason?: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  onboardingDone?: boolean;
  profile?: UserProfile;
}

export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  sparkline: number[];
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  previousClose?: number;
  sector: string;
  marketCap: number; // in Crores
  isNifty50: boolean;
  sparkline: number[];
}

export type SignalType = "BUY" | "SELL" | "HOLD";

export interface IndicatorData {
  rsi: number;
  rsiSignal: string;
  macd: number;
  macdSignal: string;
  sma50: number;
  sma200: number;
  smaSignal: string;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerPosition: string;
}

export interface BacktestResult {
  sampleSize: number;
  winRate: number | null;
  avgReturn: number | null;
  baselineAvgReturn: number | null;
  status?: "ok" | "insufficient_data";
  message?: string;
  pooledNifty50?: {
    label: string;
    sampleSize: number;
    winRate: number | null;
    avgReturn: number | null;
    baselineAvgReturn: number | null;
    status: string;
  };
}

export interface SignalData {
  symbol: string;
  signal: SignalType;
  score: number; // -8 to +8
  signalStrength: number; // percentage (|score| / 8 * 100)
  indicators: IndicatorData;
  reasons: {
    text: string;
    type: "positive" | "negative" | "neutral";
  }[];
  backtest: BacktestResult;
  mlModel?: {
    used: boolean;
    prediction?: string;
    confidence?: number;
    signalStrength?: string;
    riskLevel?: string;
  };
  generatedAt: string;
}

export interface PricePoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  fullDate?: string;
}

export type TimeRange = "1D" | "1W" | "1M" | "1Y" | "5Y";

export type FundCategory =
  | "Liquid"
  | "Short Duration Debt"
  | "Corporate Bond"
  | "Balanced Advantage"
  | "Large Cap Index"
  | "Flexi Cap"
  | "Large & Mid Cap"
  | "Mid Cap"
  | "Small Cap"
  | "ELSS";

export type FundRiskLevel =
  | "Low"
  | "Moderately Low"
  | "Moderate"
  | "Moderately High"
  | "Very High";

export interface MutualFund {
  code: string;
  schemeCode?: string;
  name: string;
  fundHouse: string;
  category: FundCategory | string;
  riskLevel: FundRiskLevel | string;
  nav: number;
  navDate?: string;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  volatility: number | null; // std dev %
  maxDrawdown: number | null; // %
  sharpeRatio?: number | null;
  expenseRatio?: number | null; // null if no free source -> UI shows "—"
  aum?: number | null; // null if no free source -> UI shows "—"
  navHistory?: { date: string; nav: number }[];
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  category:
    | "Markets"
    | "Economy"
    | "Mutual Funds"
    | "Companies"
    | "Personal Finance";
  timeAgo: string;
  summary: string;
  url: string;
  gradient: string;
  readTime: string;
  publishedAt?: string;
  imageUrl?: string;
}

export interface Holding {
  id: string;
  type: "STOCK" | "MUTUAL_FUND";
  symbolOrCode: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
  categoryOrSector: string;
}

export interface TrackedSIP {
  id: string;
  fundCode: string;
  fundName: string;
  amount: number;
  frequency: "Monthly" | "Weekly" | "Quarterly";
  startDate: string;
  installmentsCompleted: number;
  currentValue: number;
  investedValue: number;
  gain: number;
  gainPercent: number;
  totalUnits: number;
  xirr: number | null;
  nextDate: string;
  partialHistory: boolean;
  latestNav: number | null;
}

export interface AIReasoning {
  summary: string;
  keyDrivers: string[];
  portfolioAlignment: string;
}

export interface HoldingSnapshotItem {
  assetType: string;
  symbol: string;
  name: string;
  currentVal: number;
  allocationPercent: number;
}

export interface RecommendationItem {
  rank: number;
  fund: MutualFund;
  allocationPercent: number;
  rationale: string;
  role:
    | "Core Wealth Builder"
    | "Stability & Hedge"
    | "Growth Accelerator"
    | "Tax Saver & Compounding";
}

export interface FundRecommendationResponse {
  _id?: string;
  id?: string;
  profileSnapshot: {
    riskBand: RiskBand;
    riskScore: number;
    horizonYears: number;
    goalType: string;
    monthlySavings: number;
  };
  assetAllocation: {
    equity: number;
    debt: number;
    gold: number;
  };
  recommendations: RecommendationItem[];
  confidenceScore?: number;
  aiReasoning?: AIReasoning;
  holdingsSnapshot?: HoldingSnapshotItem[];
  marketContextNote: string;
  status?: "active" | "archived";
  createdAt?: string;
  generatedAt?: string;
}

export interface RecommendationComparison {
  rec1: {
    id: string;
    generatedAt: string;
    riskBand: RiskBand;
    confidenceScore: number;
    assetAllocation: { equity: number; debt: number; gold: number };
    recommendations: any[];
    weightedCagr3Y: number;
    aiReasoning?: AIReasoning;
    status: string;
  };
  rec2: {
    id: string;
    generatedAt: string;
    riskBand: RiskBand;
    confidenceScore: number;
    assetAllocation: { equity: number; debt: number; gold: number };
    recommendations: any[];
    weightedCagr3Y: number;
    aiReasoning?: AIReasoning;
    status: string;
  };
  comparisonSummary: {
    commonFundsCount: number;
    commonFunds: string[];
    uniqueToRec1: string[];
    uniqueToRec2: string[];
    equityAllocationDiff: number;
    debtAllocationDiff: number;
    weightedCagr3YDiff: number;
    confidenceDiff: number;
  };
}

export interface PortfolioHealthData {
  status: string;
  message?: string;
  healthScore: number;
  healthGrade: "Excellent" | "Good" | "Moderate" | "Needs Attention" | "N/A";
  metrics: {
    totalInvested: number;
    currentValue: number;
    totalPnl: number;
    pnlPercent: number;
    holdingsCount: number;
  };
  assetAllocation: {
    stocks: number;
    mutualFunds: number;
    other: number;
  };
  diversification: {
    concentrationRisk: "Low" | "Moderate" | "High" | "None";
    topHoldingWeight: number;
    topHoldingName: string;
    holdings: Array<{
      id: string;
      symbol: string;
      name: string;
      type: string;
      invested: number;
      currentValue: number;
      pnl: number;
      pnlPercent: number;
      weight: number;
    }>;
  };
  actionableInsights: string[];
}

export interface SignalQualityData {
  status: string;
  totalTracked: number;
  breakdown: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  flipsLast7Days: number;
  engineMetrics: {
    mlAdoptionPercent: number;
    ruleEnginePercent: number;
    historicalWinRate: number;
    avgForwardReturn: number;
    baselineAvgReturn: number;
    sampleSize: number;
  };
  recentSignals: Array<{
    symbol: string;
    signal: SignalType;
    previousSignal: SignalType;
    score: number;
    mlUsed: boolean;
    flippedAt: string | null;
    checkedAt: string;
  }>;
}

export interface AnalyticsOverviewData {
  portfolioHealth: PortfolioHealthData;
  signalQuality: SignalQualityData;
  latestRecommendation: {
    id: string;
    generatedAt: string;
    confidenceScore: number;
    assetAllocation: { equity: number; debt: number; gold: number };
    picksCount: number;
    summary: string;
  } | null;
  generatedAt: string;
}

export interface CalculationYearBreakdown {
  year: number;
  invested: number;
  returns: number;
  total: number;
}

export interface CalculationResult {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
  breakdown: CalculationYearBreakdown[];
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface PaperWallet {
  cashBalance: number;
  initialCapital: number;
  realizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  resetCount: number;
  lastResetAt: string | null;
}

export interface PaperPosition {
  _id?: string;
  symbol: string;
  yahooSymbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayPnL: number;
  dayChange: number;
  dayChangePercent: number;
  previousClose: number;
  productType: "DELIVERY" | "INTRADAY";
  createdAt?: string;
}

export interface BrokerageCharges {
  brokerage: number;
  stt: number;
  exchangeTurnover: number;
  gst: number;
  stampDuty: number;
  totalCharges: number;
  turnover: number;
}

export interface PaperOrder {
  _id?: string;
  orderId: string;
  symbol: string;
  companyName: string;
  transactionType: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  productType: "DELIVERY" | "INTRADAY";
  quantity: number;
  requestedPrice?: number | null;
  executedPrice?: number | null;
  status: "EXECUTED" | "PENDING" | "CANCELLED" | "REJECTED";
  charges: BrokerageCharges;
  realizedPnL?: number | null;
  rejectionReason?: string | null;
  executedAt?: string | null;
  createdAt: string;
}

export interface PaperPerformance {
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  todayUnrealizedPnL: number;
  overallPnL: number;
  overallPnLPercent: number;
  winRatePercent: number;
}

export interface PaperTradingSummary {
  wallet: PaperWallet;
  performance: PaperPerformance;
  positions: PaperPosition[];
  recentOrders: PaperOrder[];
}

export interface PlaceOrderPayload {
  symbol: string;
  transactionType: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  productType: "DELIVERY" | "INTRADAY";
  quantity: number;
  limitPrice?: number;
}

// ==================== STRESS TESTING & MONTE CARLO ====================

export interface StressScenario {
  id: string;
  title: string;
  period: string;
  marketDropPercent: number;
  description: string;
  sectorShocks: Record<string, number>;
  recoveryMonths: number;
  keyLessons: string;
}

export interface AssetImpact {
  symbol: string;
  name: string;
  sector: string;
  beta: number;
  currentValue: number;
  projectedValue: number;
  pnlImpact: number;
  percentageImpact: number;
}

export interface StressRecommendation {
  type: string;
  title: string;
  advice: string;
}

export interface StressTestResult {
  scenario: StressScenario;
  portfolioSource: "REAL_HOLDINGS" | "PAPER_POSITIONS" | "SAMPLE_DEMO";
  initialPortfolioValue: number;
  projectedPortfolioValue: number;
  totalLoss: number;
  totalPercentageDrop: number;
  portfolioBeta: number;
  assetImpacts: AssetImpact[];
  hardestHit: AssetImpact[];
  mostResilient: AssetImpact[];
  recommendations: StressRecommendation[];
}

export interface VaRMetricConfidence {
  oneDay: number;
  oneDayPercent: number;
  thirtyDay: number;
  thirtyDayPercent: number;
  confidence: string;
  meaning: string;
}

export interface PortfolioVaRMetrics {
  totalValue: number;
  portfolioVolPercent: number;
  portfolioBeta: number;
  dailyVolPercent: number;
  var95: VaRMetricConfidence;
  var99: VaRMetricConfidence;
  cvar95: {
    oneDay: number;
    thirtyDay: number;
    description: string;
  };
}

export interface MonteCarloTrajectoryPoint {
  day: string;
  dayNum: number;
  bullCase: number;
  aboveAvg: number;
  median: number;
  belowAvg: number;
  bearCase: number;
}

export interface MonteCarloSummary {
  bullCaseFinal: number;
  bullCaseReturn: number;
  medianFinal: number;
  medianReturn: number;
  bearCaseFinal: number;
  bearCaseReturn: number;
  profitProbability: number;
  doubleProbability: number;
}

export interface MonteCarloSimulationResult {
  initialValue: number;
  timeHorizonDays: number;
  simulationsRun: number;
  expectedReturnRate: number;
  volatilityApplied: number;
  trajectoryChartData: MonteCarloTrajectoryPoint[];
  summary: MonteCarloSummary;
}

// ==================== AI FINANCIAL COPILOT (RUPEEBOT) ====================

export interface CopilotMessage {
  _id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  suggestions?: string[];
  createdAt?: string;
}

export interface CopilotContextSummary {
  riskTolerance: string;
  totalHoldingsValue: number;
  holdingsCount: number;
  paperCashBalance: number;
}

export interface CopilotChatResponse {
  role: "assistant";
  content: string;
  suggestions: string[];
  contextSummary: CopilotContextSummary;
  timestamp: string;
}

export interface CopilotSession {
  _id?: string;
  title: string;
  messages: CopilotMessage[];
  contextSummary: CopilotContextSummary;
}

// ==================== INSTITUTIONAL AUDIT & PDF REPORT ====================

export interface InstitutionalAuditMeta {
  auditId: string;
  platform: string;
  generatedAt: string;
  complianceVersion: string;
}

export interface InstitutionalAuditExecutiveSummary {
  totalHoldingsCount: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  unrealizedPnLPercent: number;
  portfolioBeta: number;
  healthScore: number;
  healthGrade: string;
}

export interface InstitutionalAuditHolding {
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  holdingPeriod: string;
}

export interface InstitutionalAuditTaxPlanning {
  potentialLTCG: number;
  potentialSTCG: number;
  ltcgExemptionApplied: number;
  estimatedLTCGTax: number;
  estimatedSTCGTax: number;
  totalEstimatedTaxLiability: number;
  potentialLossHarvesting: number;
  advice: string;
}

export interface InstitutionalAuditDossier {
  meta: InstitutionalAuditMeta;
  investor: {
    name: string;
    email: string;
    memberSince: string;
    kycProfile: {
      riskTolerance: string;
      investmentHorizon: string;
      financialGoal: string;
      monthlySavings: number;
    };
  };
  executiveSummary: InstitutionalAuditExecutiveSummary;
  holdings: InstitutionalAuditHolding[];
  assetAllocation: {
    stocks: number;
    mutualFunds: number;
    other: number;
  };
  valueAtRisk: {
    portfolioVolPercent: number;
    dailyVolPercent: number;
    var95: { oneDay: number; thirtyDay: number; confidence: string };
    var99: { oneDay: number; thirtyDay: number; confidence: string };
    cvar95: { oneDay: number; thirtyDay: number };
  };
  stressTestSummary: {
    covid2020: {
      marketDrop: number;
      portfolioLoss: number;
      portfolioLossPercent: number;
      projectedValue: number;
    } | null;
    gfc2008: {
      marketDrop: number;
      portfolioLoss: number;
      portfolioLossPercent: number;
      projectedValue: number;
    } | null;
  };
  taxPlanning: InstitutionalAuditTaxPlanning;
  virtualSandboxStatus: {
    hasActiveWallet: boolean;
    virtualCashBalance: number;
    realizedPnL: number;
    winRate: number;
  };
  disclaimer: string;
}
