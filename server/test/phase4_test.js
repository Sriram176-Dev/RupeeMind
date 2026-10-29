process.env.NODE_ENV = 'test';
import { getNews } from '../src/services/newsService.js';
import { app } from '../src/server.js';
import http from 'http';

async function runPhase4Tests() {
  console.log('--- Phase 4 Integration Tests ---');
  let failures = 0;

  // 1. Direct News RSS Service Test
  try {
    console.log('1. Testing newsService.getNews()...');
    const news = await getNews('All');
    if (Array.isArray(news) && news.length > 0) {
      console.log(`✅ Received ${news.length} live RSS news items.`);
      console.log(`   Sample: "${news[0].headline}" [${news[0].source} - ${news[0].category}]`);
    } else {
      console.error('❌ Expected news items array with length > 0');
      failures++;
    }

    const marketNews = await getNews('Markets');
    console.log(`✅ Category filter "Markets": ${marketNews.length} items`);
  } catch (err) {
    console.error('❌ News service test error:', err.message);
    failures++;
  }

  // 2. Start standalone HTTP server and test REST endpoints
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;

    try {
      // Test GET /api/news
      console.log('2. Testing GET /api/news...');
      const resNews = await fetch(`${baseUrl}/news`);
      const jsonNews = await resNews.json();
      if (resNews.status === 200 && jsonNews.data?.length > 0) {
        console.log(`✅ GET /api/news returned HTTP 200 with ${jsonNews.data.length} articles`);
      } else {
        console.error('❌ GET /api/news failed:', resNews.status, jsonNews);
        failures++;
      }

      // Test GET /api/market/search?q=TATA
      console.log('3. Testing GET /api/market/search?q=TATA...');
      const resSearch = await fetch(`${baseUrl}/market/search?q=TATA`);
      const jsonSearch = await resSearch.json();
      if (resSearch.status === 200 && Array.isArray(jsonSearch.data)) {
        console.log(`✅ GET /api/market/search returned HTTP 200 with ${jsonSearch.data.length} results`);
      } else {
        console.error('❌ Search test failed:', resSearch.status, jsonSearch);
        failures++;
      }

      // Test GET /api/notifications (Unauthenticated -> should be 401)
      console.log('4. Testing GET /api/notifications without auth (expect 401)...');
      const resNotif = await fetch(`${baseUrl}/notifications`);
      if (resNotif.status === 401) {
        console.log('✅ Auth protection on /api/notifications verified');
      } else {
        console.error('❌ Expected 401 Unauthorized, got:', resNotif.status);
        failures++;
      }
    } catch (err) {
      console.error('❌ HTTP endpoint test error:', err);
      failures++;
    } finally {
      server.close();
      console.log(`\nPhase 4 Test Finished: ${failures === 0 ? 'ALL TESTS PASSED ✅' : `${failures} FAILURES ❌`}`);
      process.exit(failures === 0 ? 0 : 1);
    }
  });
}

runPhase4Tests();
