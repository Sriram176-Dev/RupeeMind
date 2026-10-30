import React from 'react';
import type { NewsItem } from '../../types';
import { Clock, ExternalLink } from 'lucide-react';

function getRelativeTime(publishedAt?: string, fallbackTimeAgo?: string): { label: string; isHot: boolean; formattedDate: string } {
  if (!publishedAt) {
    return { label: fallbackTimeAgo || 'recently', isHot: false, formattedDate: '' };
  }
  const date = new Date(publishedAt);
  if (isNaN(date.getTime())) {
    return { label: fallbackTimeAgo || 'recently', isHot: false, formattedDate: '' };
  }
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  const formattedDate = date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isHot = mins >= 0 && mins < 25;

  if (mins < 1) return { label: 'Just now', isHot: true, formattedDate };
  if (mins < 60) return { label: `${mins}m ago`, isHot, formattedDate };
  if (hours < 24) return { label: `${hours}h ago`, isHot: false, formattedDate };
  if (days < 7) return { label: `${days}d ago`, isHot: false, formattedDate };
  return { label: fallbackTimeAgo || formattedDate, isHot: false, formattedDate };
}

export const NewsCard: React.FC<{ item: NewsItem; featured?: boolean }> = ({ item, featured = false }) => {
  const { label: timeLabel, isHot, formattedDate } = getRelativeTime(item.publishedAt, item.timeAgo);

  return (
    <article
      className={`rounded-2xl bg-white border border-[#E7E5DF] overflow-hidden shadow-xs hover:border-[#0F766E]/40 transition-all flex flex-col justify-between group ${
        featured ? 'md:col-span-2 md:flex-row md:gap-6' : ''
      }`}
    >
      {/* Visual Header / Real News Image with Gradient Overlay */}
      <div
        className={`relative overflow-hidden bg-slate-100 ${
          featured ? 'md:w-2/5 min-h-[220px] md:h-auto' : 'h-48'
        }`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.headline}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Graceful fallback to category gradient on load error
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('bg-gradient-to-br', ...item.gradient.split(' '));
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${item.gradient}`} />
        )}

        {/* Gradient shadow overlay for readable pill badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 p-4 flex flex-col justify-between text-white pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white border border-white/20">
              {item.category}
            </span>
            <span className="text-[11px] font-medium bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
              {item.readTime}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
              {item.source}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-5 flex-1 flex flex-col justify-between ${featured ? 'md:w-3/5 md:p-6' : ''}`}>
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5B6572] mb-2 flex-wrap">
            <span className="flex items-center gap-1.5" title={formattedDate || undefined}>
              <Clock className="w-3.5 h-3.5 text-[#5B6572]" />
              <span className="font-medium text-[#0B1220]">{timeLabel}</span>
            </span>
            {isHot && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Breaking
              </span>
            )}
          </div>

          <h2
            className={`font-serif font-bold text-[#0B1220] group-hover:text-[#0F766E] transition-colors leading-snug line-clamp-2 ${
              featured ? 'text-xl sm:text-2xl mb-3' : 'text-base mb-2'
            }`}
          >
            {item.headline}
          </h2>

          <p className="text-xs sm:text-sm text-[#5B6572] line-clamp-3 leading-relaxed">
            {item.summary}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E7E5DF] flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#5B6572]">
            By {item.source}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] group-hover:underline"
          >
            <span>Read Story</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
