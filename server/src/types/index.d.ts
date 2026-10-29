import { Request } from 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email?: string;
      name?: string;
      role?: string;
      sessionId?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export interface TechnicalIndicators {
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

export interface SignalComputation {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  score: number;
  signalStrength: 'Strong' | 'Moderate' | 'Weak';
  indicators: TechnicalIndicators;
  reasons: Array<{
    type: 'positive' | 'negative' | 'neutral';
    text: string;
  }>;
  backtest: {
    status: 'ok' | 'insufficient_data';
    sampleSize: number;
    winRate?: number;
    avgReturn?: number;
    baselineAvgReturn?: number;
    message?: string;
    pooledNifty50?: {
      sampleSize: number;
      winRate: number;
      avgReturn: number;
      baselineAvgReturn: number;
    };
  };
  generatedAt: string;
}

export interface AssetAllocation {
  equity: number;
  debt: number;
  gold: number;
}

export interface RecommendationSummary {
  userId: string;
  status: 'active' | 'archived';
  riskBand: string;
  confidenceScore: number;
  assetAllocation: AssetAllocation;
  marketContextNote?: string;
  aiReasoning?: {
    summary: string;
    keyDrivers: string[];
    portfolioAlignment: string;
  };
  recommendations: Array<{
    fund: {
      code: string;
      name: string;
      category: string;
      fundHouse: string;
      nav?: number;
      cagr3Y?: number;
    };
    rank: number;
    role: string;
    allocationPercent: number;
    rationale: string;
  }>;
  generatedAt: string;
}
