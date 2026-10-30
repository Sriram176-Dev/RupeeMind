import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNews } from '../../services/api';
import type { NewsItem } from '../../types';
import { NewsCard } from '../../components/news/NewsCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CardGridSkeleton } from '../../components/ui/SkeletonLoader';
import { Search, RefreshCw, AlertCircle, Zap, ExternalLink, Radio } from 'lucide-react';

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(7);
  const [tickerIndex, setTickerIndex] = useState(0);

  const categories = ['All', 'Markets', 'Economy', 'Mutual Funds', 'Companies', 'Personal Finance'];

  const load = useCallback(async (isBackground = false, forceFresh = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const data = await getNews(category, undefined, forceFresh);
      if (!data || data.length === 0) {
        if (!isBackground) setError('No financial news articles available at the moment.');
      } else {
        setNews(data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      console.error('Failed to load news', err);
      if (!isBackground) {
        setError(err?.response?.data?.error || err.message || 'Financial news feeds are temporarily unavailable.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  // Initial load & category change
  useEffect(() => {
    load(false);
  }, [load]);

  // Live auto-refresh polling every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      load(true, false);
    }, 60000);

    return () => clearInterval(interval);
  }, [load]);

  // Breaking ticker auto-rotation every 6 seconds
  useEffect(() => {
    if (news.length === 0) return;
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % Math.min(news.length, 5));
    }, 6000);
    return () => clearInterval(tickerTimer);
  }, [news.length]);

  const filteredNews = news.filter(
    (n) =>
      n.headline.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.source.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filteredNews.length > 0 ? filteredNews[0] : null;
  const regularList = filteredNews.slice(1, visibleCount);
  const tickerItem = news[tickerIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          eyebrow="MARKET INTELLIGENCE & MACRO SIGNALS"
          title="Financial & Economic News"
          subtitle="Curated coverage on RBI rate decisions, corporate earnings, regulatory policies, and retail investing trends in India."
        />

        {/* Live Wire Feed Badge & Manual Refresh */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E7E5DF] shadow-xs text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider font-mono">
                Live Feed Active
              </span>
              <span className="text-[9px] text-[#5B6572] font-mono tabular-nums">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          <button
            onClick={() => load(true, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAF7] hover:bg-[#E6F4F1] border border-[#E7E5DF] hover:border-emerald-300 text-xs font-semibold text-[#0B1220] hover:text-[#0F766E] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Force refresh live news wire from NSE/BSE & financial RSS feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0F766E]' : 'text-[#5B6572]'}`} />
            <span className="hidden md:inline">{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Breaking News Live Ribbon */}
      {tickerItem && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0F766E] text-white text-[10px] font-bold tracking-wider uppercase shrink-0">
              <Zap className="w-3 h-3 fill-current" />
              <span>Live Wire</span>
            </div>
            <span className="text-xs font-bold text-[#0B1220] truncate">
              <span className="text-[#0F766E] mr-1.5 font-medium">[{tickerItem.source}]</span>
              {tickerItem.headline}
            </span>
          </div>

          <a
            href={tickerItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
          >
            <span>Read</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Toolbar: Category Chips & Search */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-[#FAFAF7] text-[#5B6572] hover:bg-black/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-[#5B6572] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news by topic or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            />
          </div>

        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : error && news.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E7E5DF] space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#0B1220]">
            Unable to Load Financial News
          </h3>
          <p className="text-xs text-[#5B6572] max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={() => load(false, true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Feeds
          </button>
        </div>
      ) : (
        <>
          {/* Featured Big Article Card */}
          {featured && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Featured Story
              </span>
              <NewsCard item={featured} featured={true} />
            </div>
          )}

          {/* Grid of Regular Article Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularList.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < filteredNews.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-[#0B1220] bg-white border border-[#E7E5DF] hover:bg-black/5 min-h-[44px] cursor-pointer"
              >
                Load More Stories ({filteredNews.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};
