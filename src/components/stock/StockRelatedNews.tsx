import React from 'react';
import type { NewsItem } from '../../types';

interface StockRelatedNewsProps {
  relatedNews: NewsItem[];
  companyName: string;
}

export const StockRelatedNews: React.FC<StockRelatedNewsProps> = ({ relatedNews, companyName }) => {
  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Corporate & Market News for {companyName}
      </h3>
      {relatedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {relatedNews.map((item) => (
            <div key={item.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex gap-3 items-start hover:bg-white hover:border-slate-300 transition-colors">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.headline}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-md object-cover shrink-0 bg-slate-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-mono font-medium text-emerald-700">
                  {item.timeAgo} • {item.source}
                </p>
                <h4 className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2 leading-snug">
                  {item.headline}
                </h4>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-500 font-mono">
          No recent news articles specifically mentioning {companyName}.
        </div>
      )}
    </div>
  );
};
