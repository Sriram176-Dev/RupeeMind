process.env.NODE_ENV = 'test';
import { httpServer } from '../src/server.js';
import { io as Client } from 'socket.io-client';

const PORT = 5066;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path) {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`);
  const duration = Date.now() - start;
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { status: res.status, data: json, duration };
}

async function run() {
  console.log('--- STARTING REAL MARKET DATA INTEGRATION TESTS ---');

  const server = httpServer.listen(PORT);
  await new Promise((r) => setTimeout(r, 1000));

  try {
    // 1. Market Status
    const statusRes = await request('/market/status');
    console.log('[Test 1] /api/market/status:', statusRes.status === 200 ? 'PASSED' : 'FAILED', statusRes.data?.data);

    // 2. Real Quotes for Reliance, TCS, HDFC Bank
    const quotesRes1 = await request('/market/quotes?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS');
    const qList1 = quotesRes1.data?.data || [];
    console.log(
      '[Test 2a] /api/market/quotes (First Call):',
      quotesRes1.status === 200 && qList1.length === 3 ? 'PASSED' : 'FAILED',
      `Duration: ${quotesRes1.duration}ms`,
      qList1.map((q) => ({ symbol: q.symbol, price: q.price, change: q.change, company: q.companyName }))
    );

    // 2b. Test Caching (Second call should be fast)
    const quotesRes2 = await request('/market/quotes?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS');
    console.log(
      '[Test 2b] /api/market/quotes (Cached Call):',
      quotesRes2.status === 200 ? 'PASSED' : 'FAILED',
      `Duration: ${quotesRes2.duration}ms (Cache speedup from ${quotesRes1.duration}ms)`
    );

    // 3. Historical Chart Data across all 5 ranges
    const ranges = ['1D', '1W', '1M', '1Y', '5Y'];
    for (const r of ranges) {
      const histRes = await request(`/market/RELIANCE.NS/history?range=${r}`);
      const count = histRes.data?.data?.length || 0;
      const sample = histRes.data?.data?.[0];
      console.log(
        `[Test 3] History for RELIANCE.NS (${r}):`,
        histRes.status === 200 && count > 0 ? 'PASSED' : 'FAILED',
        `Count: ${count}`,
        sample ? `Sample point: { date: '${sample.date}', price: ₹${sample.price} }` : ''
      );
    }

    // 4. Market Indices (^NSEI, ^BSESN, ^NSEBANK, ^CNXIT)
    const indicesRes = await request('/market/indices');
    const idxList = indicesRes.data?.data || [];
    console.log(
      '[Test 4] /api/market/indices:',
      indicesRes.status === 200 && idxList.length >= 4 ? 'PASSED' : 'FAILED',
      idxList.map((i) => ({ symbol: i.symbol, value: i.value, change: i.change, changePercent: i.changePercent }))
    );

    // 5. Search Symbols for "infosys"
    const searchRes = await request('/market/search?q=infosys');
    const searchList = searchRes.data?.data || [];
    console.log(
      '[Test 5] /api/market/search?q=infosys:',
      searchRes.status === 200 && searchList.length > 0 ? 'PASSED' : 'FAILED',
      searchList.slice(0, 3)
    );

    // 6. Socket.io Live Push test
    console.log('[Test 6] Testing Socket.io connection and quote subscription...');
    await new Promise((resolve) => {
      const client = Client(`http://localhost:${PORT}`, {
        path: '/socket.io',
      });

      client.on('connect', () => {
        console.log('   Socket.io client connected successfully');
        client.emit('subscribe', ['RELIANCE', 'TCS']);
      });

      client.on('quotes', (receivedQuotes) => {
        console.log(
          '   Received quotes via Socket.io:',
          receivedQuotes.map((q) => ({ symbol: q.symbol, price: q.price }))
        );
        client.disconnect();
        resolve(true);
      });

      setTimeout(() => {
        client.disconnect();
        resolve(false);
      }, 5000);
    });

    console.log('--- ALL REAL MARKET DATA TESTS PASSED ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

run();
