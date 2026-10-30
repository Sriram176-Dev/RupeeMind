import React from 'react';
import type { NewsItem } from '../../types';

interface StockRelatedNewsProps {
  relatedNews: NewsItem[];
  companyName: string;
}

export const StockRelatedNews: React.FC<StockRelatedNewsProps> = ({ relatedNews, companyName }) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
      <h3 className="font-serif text-lg font-bold text-[#0B1220]">
        Latest Corporate & Market News for {companyName}
      </h3>
      {relatedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relatedNews.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex gap-3 items-start hover:border-[#0F766E]/40 transition-colors">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.headline}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-[#0F766E]">
                  {item.timeAgo} • {item.source}
                </p>
                <h4 className="font-serif text-xs font-bold text-[#0B1220] mt-1 line-clamp-2">
                  {item.headline}
                </h4>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#5B6572]">
          No recent news articles specifically mentioning {companyName}.
        </div>
      )}
    </div>
  );
};
