import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStockQuote, getStockHistory, getSignal, getNews, toggleWatchlist } from '../../services/api';
import type { StockQuote, SignalData, TimeRange, PricePoint, NewsItem } from '../../types';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  StockQuoteHeader,
  StockPriceChart,
  StockSignalPanel,
  StockFundamentalsGrid,
  StockRelatedNews,
} from '../../components/stock';

export const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [range, setRange] = useState<TimeRange>('1M');
  const [chartType, setChartType] = useState<'candles' | 'area' | 'line'>('candles');
  const [loading, setLoading] = useState(true);
  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!symbol) return;
      try {
        setLoading(true);
        const [q, hist] = await Promise.all([
          getStockQuote(symbol),
          getStockHistory(symbol, range),
        ]);

        setQuote(q);
        setHistory(hist);
      } catch (err) {
        console.error('Failed to load stock detail', err);
      } finally {
        setLoading(false);
      }

      // Load signal and news asynchronously without blocking chart render
      getSignal(symbol)
        .then((sig) => setSignal(sig))
        .catch(() => setSignal(null));

      getNews()
        .then((news) => {
          const cleanSym = symbol.toUpperCase().replace(/\.NS$/, '');
          const matchingNews = news.filter((n) => {
            const text = `${n.headline} ${n.summary}`.toLowerCase();
            const symMatch = text.includes(cleanSym.toLowerCase());
            return symMatch;
          });
          setRelatedNews(matchingNews.slice(0, 3));
        })
        .catch(() => {});
    }
    loadData();
  }, [symbol, range]);

  const handleToggleWatchlist = async () => {
    if (!symbol) return;
    try {
      const res = await toggleWatchlist(symbol);
      setIsWatchlist(res.inWatchlist);
      toast.success(res.inWatchlist ? `Added ${symbol} to watchlist` : `Removed ${symbol} from watchlist`);
    } catch {
      toast.error('Please sign in to update your watchlist');
    }
  };

  if (loading && !quote) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#5B6572]">Loading algorithmic telemetry for {symbol}...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Stock Not Found</h1>
        <p className="text-xs text-[#5B6572]">The symbol {symbol} could not be resolved.</p>
        <Link to="/market" className="inline-block px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold">
          Back to Live Market
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Back link & breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/market')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6572] hover:text-[#0B1220]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Market List</span>
        </button>

        <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
          NSE Stock Intelligence
        </span>
      </div>

      {/* Stock Header Strip */}
      <StockQuoteHeader
        quote={quote}
        isWatchlist={isWatchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Main Grid: Left Chart (7 cols) + Right Signal Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Chart Area */}
        <div className="lg:col-span-7 space-y-6">
          <StockPriceChart
            history={history}
            quote={quote}
            range={range}
            setRange={setRange}
            chartType={chartType}
            setChartType={setChartType}
          />
        </div>

        {/* Right Column: Signal Card & Backtest & Fundamentals */}
        <div className="lg:col-span-5 space-y-6">
          {signal && <StockSignalPanel signal={signal} />}
          <StockFundamentalsGrid quote={quote} />
        </div>
      </div>

      {/* Related News & Disclaimer Banner */}
      <div className="space-y-6">
        <StockRelatedNews relatedNews={relatedNews} companyName={quote.companyName} />

        <DisclaimerBanner
          type="warning"
          customText="The Buy, Sell, and Hold algorithmic indicators shown above are computed from mathematical technical oscillators and moving averages for educational purposes. Always perform your own research or consult a registered investment advisor."
        />
      </div>
    </div>
  );
};

export default StockDetail;
