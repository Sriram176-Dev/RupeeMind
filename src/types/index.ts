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
  folio?: string;
  invested?: number;
  currentValue?: number;
  gain?: number;
  absoluteReturn?: number;
  cagr?: number | null;
  xirr?: number | null;
}

export type TransactionType =
  | "PURCHASE"
  | "SIP"
  | "REDEMPTION"
  | "SWITCH_IN"
  | "SWITCH_OUT"
  | "DIVIDEND_REINVESTMENT";

export interface Transaction {
  id: string;
  holdingId?: string | null;
  folio?: string;
  schemeName: string;
  schemeCode: string;
  type: TransactionType;
  date: string;
  units: number;
  price: number;
  amount: number;
  source: "CAS_CAMS" | "CAS_KFINTECH" | "BROKER_CSV" | "MANUAL";
  unmatched?: boolean;
}

export interface MatchedCandidate {
  score: number;
  fundCode: string;
  schemeCode: string;
  name: string;
  category: string;
}

export interface ImportPreviewItem {
  folio?: string;
  schemeName: string;
  schemeCode?: string;
  type: TransactionType;
  date: string;
  units: number;
  price: number;
  amount: number;
  unmatched: boolean;
  confidence?: number;
  candidates?: MatchedCandidate[];
  source?: "CAS_CAMS" | "CAS_KFINTECH" | "BROKER_CSV" | "MANUAL";
}

export interface ImportParsePreview {
  detectedType: "CAS_CAMS" | "CAS_KFINTECH" | "BROKER_CSV";
  totalFolios: number;
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  transactions: ImportPreviewItem[];
}

export interface BenchmarkGrowthPoint {
  date: string;
  invested: number;
  portfolioValue: number;
  niftyValue: number;
}

export interface BenchmarkComparisonResponse {
  hasData: boolean;
  portfolioXirr: number | null;
  niftyXirr: number | null;
  alpha: number | null;
  portfolioCurrentValue: number;
  niftySimulatedValue: number;
  totalInvested: number;
  totalGain: number;
  niftyGain: number;
  growthCurve: BenchmarkGrowthPoint[];
}

export interface PerformanceSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalGain: number;
  absoluteReturn: number;
  cagr: number | null;
  xirr: number | null;
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

export interface FundExplainability {
  categoryFit: {
    userRiskBand: string;
    fundRiskLevel: string;
    fitScore: number;
    reason: string;
  };
  cagrComparison: {
    fund3YCagr: number;
    categoryAvg3Y: number;
    fund5YCagr: number;
    categoryAvg5Y: number;
    outperformancePercent: number;
    reason: string;
  };
  sharpeRatio: {
    fundSharpe: number;
    benchmarkSharpe: number;
    reason: string;
  };
  expenseRatio: {
    fundExpenseRatio: number;
    categoryAvgExpenseRatio: number;
    reason: string;
  };
  maxDrawdown: {
    fundDrawdown: number;
    benchmarkDrawdown: number;
    reason: string;
  };
  oneLineSummary: string;
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
  explainability?: FundExplainability;
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
  sources?: RagCitationSource[];
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
  sources?: RagCitationSource[];
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

// -------------------------------------------------------------
// Phase 2 Types: Tax, Rebalancing, Goals, Insurance Health
// -------------------------------------------------------------

export interface RealizedTaxLot {
  holdingId: string | null;
  name: string;
  symbolOrCode: string;
  assetClass: 'EQUITY' | 'DEBT' | 'GOLD' | 'HYBRID';
  buyDate: string;
  sellDate: string;
  financialYear: string;
  units: number;
  buyPrice: number;
  sellPrice: number;
  buyCost: number;
  sellProceeds: number;
  gain: number;
  holdingDays: number;
  gainType: 'STCG' | 'LTCG';
  estimatedTaxRate: number;
  estimatedTax: number;
}

export interface UnrealizedTaxLot {
  holdingId: string | null;
  name: string;
  symbolOrCode: string;
  assetClass: 'EQUITY' | 'DEBT' | 'GOLD' | 'HYBRID';
  buyDate: string;
  units: number;
  buyPrice: number;
  currentPrice: number;
  buyCost: number;
  currentValue: number;
  gain: number;
  holdingDays: number;
  gainType: 'STCG' | 'LTCG';
  isEligibleForHarvesting: boolean;
}

export interface TaxHarvestingOpportunity {
  holdingId: string | null;
  name: string;
  symbolOrCode: string;
  currentPrice: number;
  unitsToSell: number;
  saleValue: number;
  gainHarvested: number;
  estimatedTaxSaved: number;
  rationale: string;
}

export interface TaxReportResponse {
  currentFinancialYear: string;
  selectedFinancialYear: string;
  availableFinancialYears: string[];
  selectedFySummary: {
    financialYear: string;
    equityStcg: number;
    equityLtcg: number;
    debtGains: number;
    totalGains: number;
    totalEstimatedTax: number;
    equityLtcgExemptionUsed: number;
    equityLtcgTaxable: number;
    remainingLtcgExemption: number;
  };
  unrealizedSummary: {
    equityStcg: number;
    equityLtcg: number;
    debtGains: number;
    totalUnrealizedGains: number;
  };
  harvestingSuggestions: {
    annualExemptionLimit: number;
    exemptionUsedSoFar: number;
    remainingExemption: number;
    totalTaxSavable: number;
    opportunities: TaxHarvestingOpportunity[];
  };
  realizedLots: RealizedTaxLot[];
  unrealizedLots: UnrealizedTaxLot[];
}

export interface RebalanceAssetTrade {
  assetClass: string;
  currentValue: number;
  currentWeight: number;
  targetWeight: number;
  driftPercent: number;
  isDriftViolated: boolean;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  targetValue: number;
}

export interface RebalanceFundTrade {
  holdingId: string | null;
  name: string;
  symbolOrCode: string;
  assetClass: string;
  action: 'BUY' | 'SELL';
  amount: number;
  units: number | null;
  estimatedTax: number;
  rationale: string;
}

export interface SipRedirectionItem {
  assetClass: string;
  monthlyAmount: number;
  targetAmountToAccumulate: number;
  monthsRequired: number;
  recommendation: string;
}

export interface RebalancePlanResponse {
  portfolioValue: number;
  driftThreshold: number;
  maxDrift: number;
  rebalanceNeeded: boolean;
  targetSource: string;
  currentAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  targetAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  currentAssetValues: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  assetClassTrades: RebalanceAssetTrade[];
  fundTrades: RebalanceFundTrade[];
  sipRedirectionPlan: {
    monthlyCapacity: number;
    totalInflowNeeded: number;
    estimatedMonthsToBalance: number;
    allocations: SipRedirectionItem[];
  };
  taxImpact: {
    estimatedTotalTax: number;
    isTaxFreeSipOptionAvailable: boolean;
    taxNotes: string[];
  };
}

export interface GoalProjections {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  horizonYears: number;
  expectedReturnRate: number;
  projectedCorpus: number;
  fvLumpsum: number;
  fvSip: number;
  isOnTrack: boolean;
  status: 'ON_TRACK' | 'OFF_TRACK';
  shortfall: number;
  surplus: number;
  requiredTotalMonthlySip: number;
  extraSipNeeded: number;
  progressPercent: number;
  projectedProgressPercent: number;
}

export interface UserGoal {
  _id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  horizonYears: number;
  targetDate: string;
  priority: 'Critical' | 'Important' | 'Flexible';
  monthlyContribution: number;
  expectedReturnRate: number;
  status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED';
  projections?: GoalProjections;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSkipSimulationResponse {
  goalId: string;
  goalName: string;
  skipCount: number;
  baselineProjectedCorpus: number;
  simulatedProjectedCorpus: number;
  corpusDrop: number;
  monthsDelayed: number;
  targetAmount: number;
  stillOnTrack: boolean;
  summary: string;
}

export interface InsuranceEmergencyAuditResponse {
  compositeScore: number;
  monthlyBurn: number;
  annualIncome: number;
  dependents: number;
  emergencyFund: {
    status: 'HEALTHY' | 'INADEQUATE' | 'CRITICAL';
    isAdequate: boolean;
    actualAmount: number;
    recommendedAmount: number;
    actualMonths: number;
    targetMonths: number;
    shortfall: number;
    reason: string;
  };
  termInsurance: {
    status: 'HEALTHY' | 'INADEQUATE' | 'CRITICAL';
    isAdequate: boolean;
    hasInsurance: boolean;
    actualCover: number;
    recommendedCover: number;
    multipleOfIncome: number;
    shortfall: number;
    reason: string;
  };
  healthInsurance: {
    status: 'HEALTHY' | 'INADEQUATE' | 'CRITICAL';
    isAdequate: boolean;
    hasInsurance: boolean;
    actualCover: number;
    recommendedCover: number;
    shortfall: number;
    reason: string;
  };
  actionItems: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    title: string;
    action: string;
    shortfall: number;
  }>;
}

// -------------------------------------------------------------
// Phase 3 Types: Alerts & Notifications Engine
// -------------------------------------------------------------

export type AlertType =
  | 'PRICE_ABOVE'
  | 'PRICE_BELOW'
  | 'PERCENT_CHANGE'
  | 'SIGNAL_FLIP'
  | 'DRIFT_THRESHOLD'
  | 'SIP_DUE';

export type AlertComparator =
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'PERCENT_CHANGE_ABS'
  | 'FLIPS_TO'
  | 'DRIFT_EXCEEDED'
  | 'IS_DUE';

export type AlertDeliveryChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export type AlertStatus = 'ACTIVE' | 'PAUSED' | 'TRIGGERED' | 'DISABLED';

export interface AlertItem {
  _id: string;
  userId: string;
  name: string;
  type: AlertType;
  targetSymbol: string;
  targetName: string;
  targetValue: number;
  comparator: AlertComparator;
  targetSignal?: string;
  deliveryChannels: AlertDeliveryChannel[];
  status: AlertStatus;
  triggerCount: number;
  lastTriggeredAt: string | null;
  lastEvaluatedAt: string | null;
  lastTriggerValue: any;
  cooldownMinutes: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertPayload {
  name: string;
  type: AlertType;
  targetSymbol?: string;
  targetName?: string;
  targetValue: number;
  comparator?: AlertComparator;
  targetSignal?: string;
  deliveryChannels: AlertDeliveryChannel[];
  cooldownMinutes?: number;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  alertId?: {
    _id: string;
    name: string;
    type: string;
    targetSymbol: string;
  } | null;
  title: string;
  message: string;
  type: 'PRICE' | 'SIGNAL' | 'DRIFT' | 'SIP' | 'SYSTEM';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  isRead: boolean;
  readAt: string | null;
  deliveryStatus: {
    inApp: { sent: boolean; sentAt: string };
    email: { sent: boolean; sentAt: string | null; error: string | null; skipped: boolean };
    push: { status: string; note: string };
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AlertListResponse {
  alerts: AlertItem[];
  meta: {
    total: number;
    active: number;
    paused: number;
    maxLimit: number;
  };
}

// ==========================================
// Phase 4: Analytics, Backtest & Optimization
// ==========================================

export type BacktestStrategy = 'SIP_VS_LUMPSUM' | 'SMA_CROSSOVER' | 'BUY_AND_HOLD';

export interface BacktestParams {
  symbol: string;
  strategy: BacktestStrategy;
  startDate?: string;
  endDate?: string;
  initialCapital?: number;
  monthlySipAmount?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  transactionCostPercent?: number;
  stcgTaxPercent?: number;
  ltcgTaxPercent?: number;
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL' | 'SIP_INSTALLMENT';
  date: string;
  price: number;
  units: number;
  amount: number;
  costs?: number;
  capitalGain?: number;
  taxPaid?: number;
  reason?: string;
}

export interface EquityCurvePoint {
  date: string;
  strategyPortfolio: number;
  benchmarkPortfolio: number;
  investedCapital: number;
}

export interface BacktestMetrics {
  totalReturnPercent: number;
  cagrPercent: number;
  xirrPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalTransactionCostsPaid: number;
  totalTaxPaid: number;
}

export interface BacktestResponse {
  symbol: string;
  strategy: BacktestStrategy;
  dateRange: {
    start: string;
    end: string;
    totalTradingDays: number;
  };
  capital: {
    initial: number;
    totalInvested: number;
    strategyFinalValue: number;
    benchmarkFinalValue: number;
  };
  metrics: {
    strategy: BacktestMetrics;
    benchmark: {
      totalReturnPercent: number;
      cagrPercent: number;
      xirrPercent: number;
      maxDrawdownPercent: number;
      sharpeRatio: number;
    };
  };
  equityCurve: EquityCurvePoint[];
  trades: BacktestTrade[];
  disclaimer: string;
}

export interface AssetWeightAllocations {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
}

export interface EfficientFrontierPoint {
  volatilityPercent: number;
  returnPercent: number;
  sharpeRatio: number;
  weights: AssetWeightAllocations;
}

export interface PortfolioStats {
  totalValue?: number;
  volatilityPercent: number;
  returnPercent: number;
  sharpeRatio: number;
  weights: AssetWeightAllocations;
}

export interface OptimizationResponse {
  riskBand: string;
  constraints: {
    maxEquityPercent: number;
    minDebtPercent: number;
  };
  currentPortfolio: PortfolioStats;
  maxSharpePortfolio: PortfolioStats;
  minVariancePortfolio: PortfolioStats;
  efficientFrontier: EfficientFrontierPoint[];
  assetAssumptions: Record<string, { expectedReturn: number; volatility: number; label: string }>;
  disclaimer: string;
}

export interface WalkForwardFold {
  fold: number;
  trainBars: number;
  testBars: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  majorityBaselineAccuracy: number;
  strategyReturn: number;
  buyAndHoldReturn: number;
}

export interface ModelTransparencyReport {
  generatedAt: string;
  modelType: string;
  modelSizeMb: number;
  featureCount: number;
  featuresList: string[];
  totalValidatedBars: number;
  nSplits: number;
  overallMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    majorityClassBaseline: number;
    beatsBaseline: boolean;
  };
  folds: WalkForwardFold[];
  transparencyNotes: {
    lookaheadBiasPrevention: string;
    scaleFreeNormalization: string;
    walkForwardTemporalSplit: string;
    fallbackRulePolicy: string;
  };
}

// ==========================================
// Phase 5: RAG & Portfolio News Types
// ==========================================

export interface RagCitationSource {
  title: string;
  url: string;
  category: string;
  relevanceScore?: number;
}

export interface CopilotMessageResponse {
  role: 'assistant';
  content: string;
  suggestions?: string[];
  sources?: RagCitationSource[];
  contextSummary?: {
    riskTolerance: string;
    totalHoldingsValue: number;
    holdingsCount: number;
    paperCashBalance: number;
  };
  timestamp?: string;
}

export interface PortfolioNewsItem {
  id: string;
  headline: string;
  source: string;
  category: string;
  timeAgo: string;
  summary: string;
  url: string;
  gradient?: string;
  readTime?: string;
  publishedAt: string;
  imageUrl?: string;
  matchedAsset: {
    symbol: string;
    name: string;
    type: 'HOLDING' | 'WATCHLIST' | 'BENCHMARK';
  };
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number;
}
