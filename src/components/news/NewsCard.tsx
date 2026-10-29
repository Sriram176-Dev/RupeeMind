import React from 'react';
import type { NewsItem } from '../../types';
import { Clock, ExternalLink, ArrowRight } from 'lucide-react';

export const NewsCard: React.FC<{ item: NewsItem; featured?: boolean }> = ({ item, featured = false }) => {
  return (
    <article
      className={`rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] overflow-hidden shadow-xs hover:border-[#0F766E]/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between group ${
        featured ? 'md:col-span-2 md:flex-row md:gap-6' : ''
      }`}
    >
      {/* Visual Header / Gradient Accent */}
      <div
        className={`h-32 bg-gradient-to-br ${item.gradient} p-4 flex flex-col justify-between text-white relative overflow-hidden ${
          featured ? 'md:w-2/5 md:h-auto' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-md text-white border border-white/20">
            {item.category}
          </span>
          <span className="text-[11px] opacity-90">{item.readTime}</span>
        </div>

        <div>
          <span className="text-[11px] font-medium tracking-wide uppercase opacity-80">
            {item.source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-5 flex-1 flex flex-col justify-between ${featured ? 'md:w-3/5 md:p-6' : ''}`}>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#5B6572] dark:text-[#8A97A6] mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.timeAgo}</span>
          </div>

          <h2
            className={`font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] group-hover:text-[#0F766E] dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 ${
              featured ? 'text-xl sm:text-2xl mb-3' : 'text-base mb-2'
            }`}
          >
            {item.headline}
          </h2>

          <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] line-clamp-3 leading-relaxed">
            {item.summary}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#5B6572] dark:text-[#8A97A6]">
            By {item.source}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] dark:text-emerald-400 group-hover:underline"
          >
            <span>Read Story</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
