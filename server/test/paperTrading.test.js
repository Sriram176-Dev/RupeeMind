import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  calculateBrokerageCharges,
  getOrCreateWallet,
  placePaperOrder,
  getPaperTradingSummary,
  resetPaperTradingWallet,
} from '../src/services/paperTradingService.js';
import { PaperWallet } from '../src/models/PaperWallet.js';
import { PaperPosition } from '../src/models/PaperPosition.js';
import { PaperOrder } from '../src/models/PaperOrder.js';

describe('Paper Trading Engine Tests', () => {
  const testUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await PaperWallet.deleteMany({ userId: testUserId });
    await PaperPosition.deleteMany({ userId: testUserId });
    await PaperOrder.deleteMany({ userId: testUserId });
  });

  describe('Indian Statutory Brokerage Calculator', () => {
    it('calculates zero brokerage and 0.1% STT on Delivery BUY orders', () => {
      const charges = calculateBrokerageCharges('BUY', 'DELIVERY', 2000, 10);
      expect(charges.turnover).toBe(20000);
      expect(charges.brokerage).toBe(0);
      expect(charges.stt).toBe(20); // 0.1% of 20000
      expect(charges.stampDuty).toBe(3); // 0.015% of 20000
      expect(charges.totalCharges).toBeGreaterThan(23);
    });

    it('calculates max ₹20 brokerage and 0.025% STT on Intraday SELL orders', () => {
      const charges = calculateBrokerageCharges('SELL', 'INTRADAY', 2000, 50);
      expect(charges.turnover).toBe(100000);
      expect(charges.brokerage).toBe(20); // Capped at ₹20
      expect(charges.stt).toBe(25); // 0.025% of 100000
      expect(charges.stampDuty).toBe(0); // No stamp duty on sell
    });
  });

  describe('Virtual Wallet & Order Execution', () => {
    it('initializes a fresh wallet with ₹10,00,000 virtual balance', async () => {
      const wallet = await getOrCreateWallet(testUserId);
      expect(wallet).toBeDefined();
      expect(wallet.cashBalance).toBe(1000000);
      expect(wallet.initialCapital).toBe(1000000);
      expect(wallet.realizedPnL).toBe(0);
    });

    it('places a BUY order, deducts cash, and creates a position', async () => {
      await getOrCreateWallet(testUserId);

      const orderResult = await placePaperOrder(testUserId, {
        symbol: 'RELIANCE',
        transactionType: 'BUY',
        orderType: 'MARKET',
        productType: 'DELIVERY',
        quantity: 10,
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.order.status).toBe('EXECUTED');
      expect(orderResult.order.symbol).toBe('RELIANCE');
      expect(orderResult.order.quantity).toBe(10);

      // Verify position created
      const pos = await PaperPosition.findOne({ userId: testUserId, symbol: 'RELIANCE' });
      expect(pos).toBeDefined();
      expect(pos.quantity).toBe(10);

      // Verify wallet balance reduced
      const wallet = await PaperWallet.findOne({ userId: testUserId });
      expect(wallet.cashBalance).toBeLessThan(1000000);
    });

    it('rejects a BUY order when cash balance is insufficient', async () => {
      const wallet = await getOrCreateWallet(testUserId);
      wallet.cashBalance = 100; // Only ₹100
      await wallet.save();

      await expect(
        placePaperOrder(testUserId, {
          symbol: 'TCS',
          transactionType: 'BUY',
          orderType: 'MARKET',
          productType: 'DELIVERY',
          quantity: 100, // Requires ~₹3,50,000+
        })
      ).rejects.toThrow(/Insufficient virtual cash/);
    });

    it('resets wallet, clearing positions and orders back to initial ₹10,00,000', async () => {
      // Execute a buy first
      await placePaperOrder(testUserId, {
        symbol: 'INFY',
        transactionType: 'BUY',
        orderType: 'MARKET',
        quantity: 5,
      });

      const resetResult = await resetPaperTradingWallet(testUserId);
      expect(resetResult.success).toBe(true);

      const summary = await getPaperTradingSummary(testUserId);
      expect(summary.wallet.cashBalance).toBe(1000000);
      expect(summary.positions.length).toBe(0);
      expect(summary.wallet.resetCount).toBe(1);
    });
  });
});
