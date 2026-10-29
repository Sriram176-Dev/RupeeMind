import React, { useState, useEffect, useCallback } from 'react';
import { getNews } from '../../services/api';
import type { NewsItem } from '../../types';
import { NewsCard } from '../../components/news/NewsCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CardGridSkeleton } from '../../components/ui/SkeletonLoader';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(7);

  const categories = ['All', 'Markets', 'Economy', 'Mutual Funds', 'Companies', 'Personal Finance'];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNews(category);
      if (!data || data.length === 0) {
        setError('No financial news articles available at the moment.');
      } else {
        setNews(data);
      }
    } catch (err: any) {
      console.error('Failed to load news', err);
      setError(err?.response?.data?.error || err.message || 'Financial news feeds are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredNews = news.filter(
    (n) =>
      n.headline.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.source.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filteredNews.length > 0 ? filteredNews[0] : null;
  const regularList = filteredNews.slice(1, visibleCount);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <SectionHeader
        eyebrow="MARKET INTELLIGENCE & MACRO SIGNALS"
        title="Financial & Economic News"
        subtitle="Curated coverage on RBI rate decisions, corporate earnings, regulatory policies, and retail investing trends in India."
      />

      {/* Toolbar: Category Chips & Search */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-[#0F766E] text-white dark:bg-emerald-600 shadow-xs'
                    : 'bg-[#FAFAF7] dark:bg-[#0B0F14] text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5'
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
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-xs text-[#0B1220] dark:text-[#E8EDF2] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            />
          </div>

        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : error && news.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Unable to Load Financial News
          </h3>
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold transition-all shadow-sm"
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400">
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
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] hover:bg-black/5 min-h-[44px]"
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
