import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

async function run() {
  console.log('Fetching quotes...');
  const quotes = await yf.quote(['RELIANCE.NS', 'TCS.NS', '^NSEI']);
  console.log('Quotes received:', quotes.map(q => ({ symbol: q.symbol, price: q.regularMarketPrice, name: q.shortName })));

  console.log('Fetching chart for RELIANCE.NS...');
  const chart = await yf.chart('RELIANCE.NS', { period1: '2026-03-01', interval: '1d' });
  console.log('Chart meta:', chart.meta?.symbol, 'Quotes count:', chart.quotes?.length);

  console.log('Search info...');
  const search = await yf.search('INFOSYS');
  console.log('Search count:', search.quotes?.length, 'Sample:', search.quotes?.[0]);
}

run().catch(console.error);
