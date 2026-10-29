import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Profile } from '../src/models/Profile.js';
import { Watchlist } from '../src/models/Watchlist.js';
import { Holding } from '../src/models/Holding.js';
import { TrackedSIP } from '../src/models/TrackedSIP.js';
import { Recommendation } from '../src/models/Recommendation.js';
import { Notification } from '../src/models/Notification.js';
import { SavedCalculation } from '../src/models/SavedCalculation.js';

describe('Account Deletion Cascade Integrity Test', () => {
  let testUser;
  let accessToken = '';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('CascadePassword123!', 10);
    testUser = await User.create({
      name: 'Cascade Test User',
      email: `cascade_test_${Date.now()}@example.com`,
      passwordHash,
      onboardingDone: true,
    });

    // Populate every user-linked collection
    const userId = testUser._id;
    await Promise.all([
      Profile.create({ userId, monthlyIncome: 75000, monthlyExpenses: 30000 }),
      Watchlist.create({ userId, items: [{ symbol: 'TCS.NS', name: 'Tata Consultancy' }] }),
      Holding.create({ userId, type: 'STOCK', symbolOrCode: 'INFY.NS', name: 'Infosys', quantity: 10, buyPrice: 1500 }),
      TrackedSIP.create({ userId, fundName: 'Parag Parikh Flexi Cap', fundCode: '122639', amount: 5000 }),
      Recommendation.create({ userId, profileSnapshot: { riskScore: 65 }, assetAllocation: { equity: 70, debt: 30, gold: 0 }, recommendations: [] }),
      Notification.create({ userId, title: 'Welcome Test', body: 'Test Notification', type: 'system' }),
      SavedCalculation.create({ userId, type: 'SIP', inputs: { monthlyAmount: 5000, expectedReturn: 12, years: 10 }, result: { totalInvested: 600000 } }),
    ]);

    // Login to get token
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'CascadePassword123!',
    });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    if (testUser) {
      const userId = testUser._id;
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Profile.deleteMany({ userId }),
        Watchlist.deleteMany({ userId }),
        Holding.deleteMany({ userId }),
        TrackedSIP.deleteMany({ userId }),
        Recommendation.deleteMany({ userId }),
        Notification.deleteMany({ userId }),
        SavedCalculation.deleteMany({ userId }),
      ]);
    }
  });

  it('verifies all 7 user-linked collections are populated before deletion', async () => {
    const userId = testUser._id;
    const [p, w, h, s, r, n, c] = await Promise.all([
      Profile.countDocuments({ userId }),
      Watchlist.countDocuments({ userId }),
      Holding.countDocuments({ userId }),
      TrackedSIP.countDocuments({ userId }),
      Recommendation.countDocuments({ userId }),
      Notification.countDocuments({ userId }),
      SavedCalculation.countDocuments({ userId }),
    ]);
    expect(p).toBe(1);
    expect(w).toBe(1);
    expect(h).toBe(1);
    expect(s).toBe(1);
    expect(r).toBe(1);
    expect(n).toBe(1);
    expect(c).toBe(1);
  });

  it('permanently cascades deletion across User and all 7 associated collections on DELETE /api/account', async () => {
    const res = await request(app)
      .delete('/api/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'CascadePassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify all collections are completely wiped for this userId
    const userId = testUser._id;
    const [u, p, w, h, s, r, n, c] = await Promise.all([
      User.countDocuments({ _id: userId }),
      Profile.countDocuments({ userId }),
      Watchlist.countDocuments({ userId }),
      Holding.countDocuments({ userId }),
      TrackedSIP.countDocuments({ userId }),
      Recommendation.countDocuments({ userId }),
      Notification.countDocuments({ userId }),
      SavedCalculation.countDocuments({ userId }),
    ]);

    expect(u).toBe(0);
    expect(p).toBe(0);
    expect(w).toBe(0);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(r).toBe(0);
    expect(n).toBe(0);
    expect(c).toBe(0);
  });
});
