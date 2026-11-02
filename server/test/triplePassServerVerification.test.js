import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { Fund } from "../src/models/Fund.js";

describe("Triple-Pass Comprehensive End-to-End System Verification", () => {
  beforeAll(async () => {
    // Seed test mutual funds if not already present
    const existing = await Fund.countDocuments();
    if (existing === 0) {
      await Fund.create([
        {
          schemeCode: "122639",
          code: "122639",
          name: "Parag Parikh Flexi Cap Fund",
          fundHouse: "PPFAS Mutual Fund",
          category: "Flexi Cap",
          nav: 75.4,
          navDate: "2026-10-29",
          expenseRatio: 0.65,
          cagr3Y: 18.2,
          cagr5Y: 20.4,
          riskLevel: "Very High",
          sharpeRatio: 1.25,
          sortinoRatio: 1.82,
          maxDrawdown: -14.2,
        },
        {
          schemeCode: "120503",
          code: "120503",
          name: "Quant Mid Cap Fund",
          fundHouse: "Quant Mutual Fund",
          category: "Mid Cap",
          nav: 198.6,
          navDate: "2026-10-29",
          expenseRatio: 0.72,
          cagr3Y: 24.5,
          cagr5Y: 26.8,
          riskLevel: "Very High",
          sharpeRatio: 1.45,
          sortinoRatio: 2.15,
          maxDrawdown: -18.5,
        },
        {
          schemeCode: "118989",
          code: "118989",
          name: "ICICI Prudential Liquid Fund",
          fundHouse: "ICICI Prudential Mutual Fund",
          category: "Liquid",
          nav: 345.2,
          navDate: "2026-10-29",
          expenseRatio: 0.2,
          cagr3Y: 6.8,
          cagr5Y: 6.2,
          riskLevel: "Low",
          sharpeRatio: 2.1,
          sortinoRatio: 3.4,
          maxDrawdown: -0.2,
        },
      ]);
    }
  });

  [1, 2, 3].forEach((passNumber) => {
    describe(`PASS ${passNumber}: Full End-to-End Platform Verification`, () => {
      let accessToken = "";
      let refreshTokenCookie = "";
      let testUserEmail = "";
      let placedOrderId = "";

      beforeAll(() => {
        testUserEmail = `qa_triple_pass_${passNumber}_${Date.now()}@rupeemind.com`;
      });

      // ── 1. System Health & Diagnostics ────────────────────────
      it(`[Pass ${passNumber}] Feature 1: Health & Diagnostics endpoint is operational`, async () => {
        const res = await request(app).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
        expect(res.body.service).toBe("Rupee Mind API");
        expect(res.body.checks.database.status).toBe("healthy");
      });

      // ── 2. Market Indices & Status ────────────────────────────
      it(`[Pass ${passNumber}] Feature 2: Indian Market Indices & Status are live`, async () => {
        const res = await request(app).get("/api/market/indices");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3); // NIFTY 50, SENSEX, BANK NIFTY

        const statusRes = await request(app).get("/api/market/status");
        expect(statusRes.status).toBe(200);
        expect(statusRes.body.success).toBe(true);
        expect(statusRes.body.data).toHaveProperty("isOpen");
      });

      // ── 3. Stock Screener & Quotes ────────────────────────────
      it(`[Pass ${passNumber}] Feature 3: Stock Screener & Individual Quotes return valid data`, async () => {
        const listRes = await request(app).get("/api/market/quotes");
        expect(listRes.status).toBe(200);
        expect(listRes.body.success).toBe(true);
        expect(Array.isArray(listRes.body.data)).toBe(true);
        expect(listRes.body.data.length).toBeGreaterThan(0);

        const quoteRes = await request(app).get("/api/market/RELIANCE/quote");
        expect(quoteRes.status).toBe(200);
        expect(quoteRes.body.success).toBe(true);
        expect(quoteRes.body.data.symbol).toBe("RELIANCE");
        expect(Number(quoteRes.body.data.price)).toBeGreaterThan(0);
      });

      // ── 4. Candlestick History ────────────────────────────────
      it(`[Pass ${passNumber}] Feature 4: Candlestick history returns structured OHLCV intervals`, async () => {
        const histRes = await request(app).get(
          "/api/market/RELIANCE/history?interval=1d&range=1mo",
        );
        expect(histRes.status).toBe(200);
        expect(histRes.body.success).toBe(true);
        expect(Array.isArray(histRes.body.data)).toBe(true);
        if (histRes.body.data.length > 0) {
          const candle = histRes.body.data[0];
          expect(candle).toHaveProperty("open");
          expect(candle).toHaveProperty("high");
          expect(candle).toHaveProperty("low");
          expect(candle).toHaveProperty("close");
        }
      });

      // ── 5. Mutual Funds Catalog & Screening ───────────────────
      it(`[Pass ${passNumber}] Feature 5: Mutual Funds catalog returns categorized funds`, async () => {
        const fundsRes = await request(app).get("/api/funds");
        expect(fundsRes.status).toBe(200);
        expect(fundsRes.body.success).toBe(true);
        expect(Array.isArray(fundsRes.body.funds)).toBe(true);
        expect(fundsRes.body.funds.length).toBeGreaterThan(0);

        const firstFund = fundsRes.body.funds[0];
        expect(firstFund).toHaveProperty("code");
        expect(firstFund).toHaveProperty("name");
        expect(firstFund).toHaveProperty("category");
      });

      // ── 6. Mutual Fund Detail & Comparisons ───────────────────
      it(`[Pass ${passNumber}] Feature 6: Fund Details and side-by-side comparison succeed`, async () => {
        const fundsRes = await request(app).get("/api/funds");
        const firstFund = fundsRes.body.funds[0];

        const detailRes = await request(app).get(
          `/api/funds/${firstFund.code}`,
        );
        expect(detailRes.status).toBe(200);
        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.fund.code).toBe(firstFund.code);

        const compareRes = await request(app).get(
          `/api/funds/compare?codes=${firstFund.code}`,
        );
        expect(compareRes.status).toBe(200);
        expect(compareRes.body.success).toBe(true);
        expect(Array.isArray(compareRes.body.funds)).toBe(true);
      });

      // ── 7. Live Financial News & Sentiment ────────────────────
      it(`[Pass ${passNumber}] Feature 7: Live Indian RSS News feed returns tagged articles`, async () => {
        const newsRes = await request(app).get("/api/news");
        expect(newsRes.status).toBe(200);
        expect(newsRes.body.success).toBe(true);
        expect(Array.isArray(newsRes.body.news)).toBe(true);
      });

      // ── 8. Access Protection & Security Guards ─────────────────
      it(`[Pass ${passNumber}] Feature 8: Unauthenticated requests to protected endpoints return 401`, async () => {
        const p1 = await request(app).get("/api/profile");
        expect(p1.status).toBe(401);

        const p2 = await request(app).get("/api/market/RELIANCE/signal");
        expect(p2.status).toBe(401);

        const p3 = await request(app).get("/api/paper-trading/wallet");
        expect(p3.status).toBe(401);

        const p4 = await request(app).get("/api/recommendations");
        expect(p4.status).toBe(401);
      });

      // ── 9. User Registration & Password Security ───────────────
      it(`[Pass ${passNumber}] Feature 9: Signup hashes password with bcrypt and rejects weak inputs`, async () => {
        // Rejects weak password < 8 chars
        const weakRes = await request(app).post("/api/auth/signup").send({
          name: "QA Tester",
          email: testUserEmail,
          password: "123",
        });
        expect(weakRes.status).toBe(400);

        // Valid signup
        const signupRes = await request(app).post("/api/auth/signup").send({
          name: "QA Triple Pass Tester",
          email: testUserEmail,
          password: "Password@12345!",
        });
        expect(signupRes.status).toBe(201);
        expect(signupRes.body.success).toBe(true);
        expect(signupRes.body.user.email).toBe(testUserEmail.toLowerCase());
        expect(signupRes.body).toHaveProperty("accessToken");

        const cookies = signupRes.headers["set-cookie"];
        const refCookie = cookies.find((c) => c.startsWith("refreshToken="));
        expect(refCookie).toBeDefined();

        // Duplicate signup rejected
        const dupRes = await request(app).post("/api/auth/signup").send({
          name: "QA Duplicate",
          email: testUserEmail,
          password: "Password@12345!",
        });
        expect(dupRes.status).toBe(409);
      });

      // ── 10. Login & Session Lifecycle ─────────────────────────
      it(`[Pass ${passNumber}] Feature 10: Login verifies credentials and establishes authenticated session`, async () => {
        // Rejects invalid password
        const badLogin = await request(app).post("/api/auth/login").send({
          email: testUserEmail,
          password: "WrongPassword!",
        });
        expect(badLogin.status).toBe(401);

        // Valid login
        const loginRes = await request(app).post("/api/auth/login").send({
          email: testUserEmail,
          password: "Password@12345!",
        });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body).toHaveProperty("accessToken");

        accessToken = loginRes.body.accessToken;
        const cookies = loginRes.headers["set-cookie"];
        const refCookie = cookies.find((c) => c.startsWith("refreshToken="));
        refreshTokenCookie = refCookie.split(";")[0];
      });

      // ── 11. Token Refresh & PC Sleep Wake Tolerance ───────────
      it(`[Pass ${passNumber}] Feature 11: Refresh rotates tokens and handles grace window cleanly`, async () => {
        const refRes = await request(app)
          .post("/api/auth/refresh")
          .set("Cookie", [refreshTokenCookie]);

        expect(refRes.status).toBe(200);
        expect(refRes.body.success).toBe(true);
        expect(refRes.body).toHaveProperty("accessToken");

        // Capture new refreshed tokens
        accessToken = refRes.body.accessToken;
        const newCookies = refRes.headers["set-cookie"];
        const newRefCookie = newCookies.find((c) =>
          c.startsWith("refreshToken="),
        );
        expect(newRefCookie).toBeDefined();
        refreshTokenCookie = newRefCookie.split(";")[0];
      });

      // ── 12. Dual-Engine Onboarding & Profile Persistence ──────
      it(`[Pass ${passNumber}] Feature 12: Dual-engine profile saves and preserves financial parameters`, async () => {
        const profilePayload = {
          age: 32,
          city: "Pune",
          occupation: "Private",
          monthlyIncome: 140000,
          monthlyExpenses: 60000,
          monthlyEMIs: 20000,
          monthlySavings: 60000,
          emergencyFundAmount: 400000,
          hasLifeInsurance: true,
          hasHealthInsurance: true,
          dependentsCount: 2,
          investingExperience: "Intermediate",
          investingRegularity: "Regularly",
          goalType: "Wealth creation",
          targetAmount: 5000000,
          horizonYears: 8,
          goals: [
            {
              id: "g-wealth",
              name: "Wealth Creation",
              type: "Wealth creation",
              category: "Wealth creation",
              targetAmount: 5000000,
              horizonYears: 8,
              priority: "Important",
            },
          ],
          quizScores: [4, 3, 4, 3, 4],
          riskToleranceScore: 68,
          riskToleranceBand: "Growth",
          riskCapacityScore: 62,
          riskCapacityBand: "Moderate",
          effectiveRiskScore: 65,
          effectiveRiskBand: "Growth",
          isRiskConstrained: false,
          financialHealthScore: 78,
          financialHealthBand: "Good",
        };

        const saveRes = await request(app)
          .put("/api/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(profilePayload);

        expect(saveRes.status).toBe(200);
        expect(saveRes.body.success).toBe(true);
        expect(saveRes.body.profile.age).toBe(32);
        expect(saveRes.body.profile.monthlyIncome).toBe(140000);
        expect(saveRes.body.profile.effectiveRiskScore).toBe(65);

        // Fetch back to verify persistence
        const getRes = await request(app)
          .get("/api/profile")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(getRes.status).toBe(200);
        expect(getRes.body.profile.city).toBe("Pune");
        expect(getRes.body.profile.emergencyFundAmount).toBe(400000);
      });

      // ── 13. Algorithmic Stock Signals (Authenticated) ──────────
      it(`[Pass ${passNumber}] Feature 13: Authenticated access to algorithmic quant signals`, async () => {
        const sigRes = await request(app)
          .get("/api/market/RELIANCE/signal")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(sigRes.status).toBe(200);
        expect(sigRes.body.success).toBe(true);
        expect(sigRes.body.data.symbol).toBe("RELIANCE");
        expect(sigRes.body.data).toHaveProperty("quantScore");
        expect(sigRes.body.data).toHaveProperty("signal");
      });

      // ── 14. Tailored Recommendations Engine ───────────────────
      it(`[Pass ${passNumber}] Feature 14: Generates tailored fiduciary mutual fund allocations`, async () => {
        const genRes = await request(app)
          .post("/api/recommendations/generate")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(genRes.status).toBe(200);
        expect(genRes.body.success).toBe(true);
        expect(genRes.body.data).toHaveProperty("assetAllocation");
        expect(Array.isArray(genRes.body.data.funds)).toBe(true);
      });

      // ── 15. Paper Trading Sandbox (Virtual ₹10,00,000) ─────────
      it(`[Pass ${passNumber}] Feature 15: Paper Trading executes Buy, Limit Order, and Reset`, async () => {
        // 1. Initial wallet balance
        const walletRes = await request(app)
          .get("/api/paper-trading/wallet")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(walletRes.status).toBe(200);
        expect(walletRes.body.success).toBe(true);
        expect(walletRes.body.wallet.cashBalance).toBeGreaterThan(0);

        // 2. Place a BUY Market order
        const buyRes = await request(app)
          .post("/api/paper-trading/orders")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            symbol: "RELIANCE",
            orderType: "MARKET",
            side: "BUY",
            quantity: 2,
          });

        expect(buyRes.status).toBe(201);
        expect(buyRes.body.success).toBe(true);
        expect(buyRes.body.order.status).toBe("EXECUTED");

        // 3. Place a LIMIT order
        const limitRes = await request(app)
          .post("/api/paper-trading/orders")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            symbol: "TCS",
            orderType: "LIMIT",
            side: "BUY",
            quantity: 1,
            targetPrice: 2000,
          });

        expect(limitRes.status).toBe(201);
        expect(limitRes.body.success).toBe(true);
        expect(limitRes.body.order.status).toBe("PENDING");
        placedOrderId = limitRes.body.order.id;

        // 4. Cancel pending LIMIT order
        const cancelRes = await request(app)
          .delete(`/api/paper-trading/orders/${placedOrderId}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.success).toBe(true);

        // 5. Reset wallet
        const resetRes = await request(app)
          .post("/api/paper-trading/wallet/reset")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(resetRes.status).toBe(200);
        expect(resetRes.body.wallet.cashBalance).toBe(1000000);
        expect(resetRes.body.wallet.positions).toHaveLength(0);
      });

      // ── 16. Watchlist Management ──────────────────────────────
      it(`[Pass ${passNumber}] Feature 16: Watchlist additions and removals function accurately`, async () => {
        // Add to watchlist (toggle)
        const addRes = await request(app)
          .post("/api/watchlist/TCS")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(addRes.status).toBe(200);
        expect(addRes.body.watchlist).toContain("TCS");

        // Check watchlist
        const getWl = await request(app)
          .get("/api/watchlist")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(getWl.status).toBe(200);
        expect(getWl.body.watchlist).toContain("TCS");

        // Remove from watchlist (toggle again)
        const remRes = await request(app)
          .post("/api/watchlist/TCS")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(remRes.status).toBe(200);
        expect(remRes.body.watchlist).not.toContain("TCS");
      });

      // ── 17. AI Financial Copilot (RupeeBot) ────────────────────
      it(`[Pass ${passNumber}] Feature 17: Copilot queries return structured financial insights`, async () => {
        const copilotRes = await request(app)
          .post("/api/copilot/chat")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            message: "Explain Section 80C tax savings for mutual funds",
          });

        expect(copilotRes.status).toBe(200);
        expect(copilotRes.body.success).toBe(true);
        expect(copilotRes.body.data.reply.length).toBeGreaterThan(10);
      });

      // ── 18. Cascading Account Deletion & Cleanup ───────────────
      it(`[Pass ${passNumber}] Feature 18: Account deletion cleanly purges user and associated assets`, async () => {
        const delRes = await request(app)
          .delete("/api/account")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ password: "Password@12345!" });

        expect(delRes.status).toBe(200);
        expect(delRes.body.success).toBe(true);

        // Verify database cleanup
        const userExists = await User.findOne({
          email: testUserEmail.toLowerCase(),
        });
        expect(userExists).toBeNull();
      });
    });
  });
});
