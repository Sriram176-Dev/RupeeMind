import { describe, it, expect } from "vitest";
import {
  calculateXIRR,
  calculateAbsoluteReturn,
  calculateCAGR,
} from "../lib/xirr";

describe("XIRR & Performance Utilities (Phase 1)", () => {
  it("calculates exact 1-year simple annualized XIRR", () => {
    // ₹10,000 invested on Jan 1, 2023, valued at ₹11,200 on Jan 1, 2024 (12% gain)
    const cashFlows = [
      { amount: -10000, date: new Date("2023-01-01T00:00:00Z") },
      { amount: 11200, date: new Date("2024-01-01T00:00:00Z") },
    ];

    const xirr = calculateXIRR(cashFlows);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeGreaterThanOrEqual(11.9);
    expect(xirr!).toBeLessThanOrEqual(12.1);
  });

  it("calculates multi-installment SIP XIRR correctly", () => {
    // 3 monthly installments of ₹5,000 each
    const cashFlows = [
      { amount: -5000, date: new Date("2023-01-01T00:00:00Z") },
      { amount: -5000, date: new Date("2023-02-01T00:00:00Z") },
      { amount: -5000, date: new Date("2023-03-01T00:00:00Z") },
      { amount: 16500, date: new Date("2023-07-01T00:00:00Z") }, // Gain on ₹15,000 invested
    ];

    const xirr = calculateXIRR(cashFlows);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeGreaterThan(15.0); // Annualized return should be strong
  });

  it("handles redemptions and cash outflows accurately", () => {
    const cashFlows = [
      { amount: -50000, date: new Date("2023-01-01T00:00:00Z") },
      { amount: 20000, date: new Date("2023-06-01T00:00:00Z") }, // Partial redemption
      { amount: 40000, date: new Date("2024-01-01T00:00:00Z") }, // Terminal value
    ];

    const xirr = calculateXIRR(cashFlows);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeGreaterThan(20.0);
  });

  it("returns null for invalid cash flows without both positive and negative entries", () => {
    expect(calculateXIRR([])).toBeNull();
    expect(calculateXIRR([{ amount: -10000, date: "2023-01-01" }])).toBeNull();
    expect(
      calculateXIRR([
        { amount: -10000, date: "2023-01-01" },
        { amount: -20000, date: "2023-06-01" },
      ])
    ).toBeNull();
  });

  it("calculates absolute return percentage accurately", () => {
    expect(calculateAbsoluteReturn(100000, 125000)).toBe(25.0);
    expect(calculateAbsoluteReturn(100000, 85000)).toBe(-15.0);
    expect(calculateAbsoluteReturn(0, 10000)).toBe(0);
  });

  it("calculates multi-year CAGR accurately", () => {
    // Doubling in 3 years is approx 25.99% CAGR
    const cagr = calculateCAGR(100000, 200000, 3);
    expect(cagr).toBe(25.99);

    // Negative growth
    const negCagr = calculateCAGR(100000, 80000, 2);
    expect(negCagr).toBe(-10.56);

    // Invalid zero inputs
    expect(calculateCAGR(0, 10000, 2)).toBeNull();
    expect(calculateCAGR(10000, 0, 2)).toBeNull();
    expect(calculateCAGR(10000, 15000, 0)).toBeNull();
  });
});
