import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Holding } from "../src/models/Holding.js";
import { SignalHistory } from "../src/models/SignalHistory.js";
import {
  getPortfolioHealth,
  getSignalQuality,
  getAnalyticsOverview,
} from "../src/services/analyticsService.js";

describe("Analytics Service Tests", () => {
  const testUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Holding.deleteMany({ userId: testUserId });
    await SignalHistory.deleteMany({ userId: testUserId });
  });

  it("returns clean no_data state when user has zero holdings", async () => {
    const health = await getPortfolioHealth(testUserId);
    expect(health.status).toBe("no_data");
    expect(health.healthScore).toBe(0);
    expect(health.metrics.holdingsCount).toBe(0);
  });

  it("calculates portfolio health, weights, and concentration metrics accurately", async () => {
    await Holding.create([
      {
        userId: testUserId,
        type: "STOCK",
        symbolOrCode: "RELIANCE",
        name: "Reliance Industries",
        quantity: 10,
        buyPrice: 2000,
        currentPrice: 2500, // 25,000 value, +5,000 PnL
      },
      {
        userId: testUserId,
        type: "STOCK",
        symbolOrCode: "TCS",
        name: "Tata Consultancy Services",
        quantity: 5,
        buyPrice: 3000,
        currentPrice: 3500, // 17,500 value, +2,500 PnL
      },
      {
        userId: testUserId,
        type: "MUTUAL_FUND",
        symbolOrCode: "122639",
        name: "Parag Parikh Flexi Cap Fund",
        quantity: 100,
        buyPrice: 50,
        currentPrice: 75, // 7,500 value, +2,500 PnL
      },
    ]);

    const health = await getPortfolioHealth(testUserId);
    expect(health.status).toBe("ok");
    expect(health.metrics.holdingsCount).toBe(3);
    expect(health.metrics.totalInvested).toBe(20000 + 15000 + 5000); // 40,000
    expect(health.metrics.currentValue).toBe(25000 + 17500 + 7500); // 50,000
    expect(health.metrics.totalPnl).toBe(10000);
    expect(health.metrics.pnlPercent).toBe(25); // +25%
    expect(health.healthScore).toBeGreaterThan(50);
    expect(["Excellent", "Good", "Moderate"]).toContain(health.healthGrade);
    expect(health.assetAllocation.stocks).toBeGreaterThan(0);
    expect(health.assetAllocation.mutualFunds).toBeGreaterThan(0);
  });

  it("aggregates signal quality telemetry and flip tracking", async () => {
    await SignalHistory.create([
      {
        userId: testUserId,
        symbol: "INFY",
        previousSignal: "HOLD",
        currentSignal: "BUY",
        previousScore: 1,
        currentScore: 4,
        mlUsed: true,
        flippedAt: new Date(),
      },
      {
        userId: testUserId,
        symbol: "WIPRO",
        previousSignal: "HOLD",
        currentSignal: "HOLD",
        previousScore: 0,
        currentScore: 0,
        mlUsed: false,
      },
    ]);

    const signalQuality = await getSignalQuality(testUserId);
    expect(signalQuality.status).toBe("ok");
    expect(signalQuality.totalTracked).toBe(2);
    expect(signalQuality.breakdown.BUY).toBe(1);
    expect(signalQuality.breakdown.HOLD).toBe(1);
    expect(signalQuality.flipsLast7Days).toBe(1);
    expect(signalQuality.engineMetrics.mlAdoptionPercent).toBe(50);
  });

  it("generates unified analytics overview", async () => {
    const overview = await getAnalyticsOverview(testUserId);
    expect(overview.portfolioHealth).toBeDefined();
    expect(overview.signalQuality).toBeDefined();
    expect(typeof overview.generatedAt).toBe("string");
  });
});
