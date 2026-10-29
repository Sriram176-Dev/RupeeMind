import http from 'http';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User } from '../src/models/User.js';
import { Profile } from '../src/models/Profile.js';
import { Watchlist } from '../src/models/Watchlist.js';
import { Holding } from '../src/models/Holding.js';
import { SavedCalculation } from '../src/models/SavedCalculation.js';

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const cookies = response.headers.get('set-cookie');
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, cookies, headers: response.headers };
}

async function runTests() {
  console.log('--- Starting Backend Integration Tests ---');
  
  // Wait for mongoose connection if available
  await new Promise((resolve) => setTimeout(resolve, 1000));

  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  try {
    const testEmail = `test_${Date.now()}@rupeemind.com`;
    const testPassword = 'Password@123';

    // 1. Health check
    const health = await request('/health');
    console.log('[Test 1] Health Check:', health.status === 200 ? 'PASSED' : 'FAILED', health.data);

    // 2. Signup
    const signupRes = await request('/auth/signup', {
      method: 'POST',
      body: {
        name: 'Test Investor',
        email: testEmail,
        password: testPassword,
      },
    });
    console.log('[Test 2] Signup:', signupRes.status === 201 ? 'PASSED' : `FAILED (${signupRes.status})`, signupRes.data?.user?.email);

    const cookieHeader = signupRes.cookies ? { Cookie: signupRes.cookies } : {};

    // 3. Login
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    console.log('[Test 3] Login:', loginRes.status === 200 ? 'PASSED' : `FAILED (${loginRes.status})`, loginRes.data?.user?.name);
    const authCookies = loginRes.cookies ? { Cookie: loginRes.cookies } : cookieHeader;

    // 4. Get Current User (/auth/me)
    const meRes = await request('/auth/me', {
      headers: authCookies,
    });
    console.log('[Test 4] Session /auth/me:', meRes.status === 200 && meRes.data?.user?.email === testEmail ? 'PASSED' : 'FAILED', meRes.data?.user);

    // 5. Update Profile & Verify Server-Side Score Computation
    const profileRes = await request('/profile', {
      method: 'PUT',
      headers: authCookies,
      body: {
        age: 30,
        occupation: 'Private',
        city: 'Mumbai',
        monthlyIncome: 120000,
        monthlyExpenses: 40000,
        monthlyEMIs: 15000,
        monthlySavings: 65000,
        emergencyFundAmount: 300000,
        goalType: 'Wealth creation',
        targetAmount: 20000000,
        horizonYears: 8,
        quizScores: [4, 5, 4, 4, 3],
        hasLifeInsurance: true,
        hasHealthInsurance: true,
        dependentsCount: 1,
        investingExperience: 'Intermediate',
      },
    });

    const scores = profileRes.data?.profile?.scores;
    console.log('[Test 5] Profile Save & Server Score Calculation:',
      profileRes.status === 200 && scores?.risk > 0 && scores?.financialHealth > 0 ? 'PASSED' : 'FAILED',
      scores
    );

    // 6. Watchlist Toggle
    const wlAdd = await request('/watchlist/TCS', {
      method: 'POST',
      headers: authCookies,
    });
    console.log('[Test 6a] Watchlist Add TCS:', wlAdd.status === 200 && wlAdd.data?.inWatchlist === true ? 'PASSED' : 'FAILED', wlAdd.data?.watchlist);

    const wlList = await request('/watchlist', {
      headers: authCookies,
    });
    console.log('[Test 6b] Watchlist Get:', wlList.status === 200 && wlList.data?.symbols?.includes('TCS') ? 'PASSED' : 'FAILED', wlList.data?.symbols);

    // 7. Holdings Add & Get & Delete
    const holdAdd = await request('/holdings', {
      method: 'POST',
      headers: authCookies,
      body: {
        type: 'STOCK',
        symbolOrCode: 'INFY',
        name: 'Infosys Limited',
        quantity: 25,
        buyPrice: 1820,
        categoryOrSector: 'IT Services',
      },
    });
    console.log('[Test 7a] Holding Add:', holdAdd.status === 201 && holdAdd.data?.holdings?.length > 0 ? 'PASSED' : 'FAILED', holdAdd.data?.holdings?.[0]?.name);

    const holdingId = holdAdd.data?.holdings?.[0]?.id;
    const holdDelete = await request(`/holdings/${holdingId}`, {
      method: 'DELETE',
      headers: authCookies,
    });
    console.log('[Test 7b] Holding Delete:', holdDelete.status === 200 ? 'PASSED' : 'FAILED', holdDelete.data?.holdings);

    // 8. Saved Calculation
    const calcSave = await request('/calculations', {
      method: 'POST',
      headers: authCookies,
      body: {
        type: 'sip',
        inputs: { sipMonthly: 15000, sipRate: 12, sipYears: 10 },
        result: { totalValue: 3485000, investedAmount: 1800000, estimatedReturns: 1685000 },
      },
    });
    console.log('[Test 8] Calculation Save:', calcSave.status === 201 ? 'PASSED' : 'FAILED', calcSave.data?.calculation?.type);

    // 9. Logout
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: authCookies,
    });
    console.log('[Test 9] Logout:', logoutRes.status === 200 ? 'PASSED' : 'FAILED', logoutRes.data);

    console.log('--- ALL INTEGRATION TESTS FINISHED ---');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
  }
}

runTests();
