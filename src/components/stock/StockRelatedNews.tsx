import React from 'react';
import type { NewsItem } from '../../types';

interface StockRelatedNewsProps {
  relatedNews: NewsItem[];
  companyName: string;
}

export const StockRelatedNews: React.FC<StockRelatedNewsProps> = ({ relatedNews, companyName }) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
      <h3 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
        Latest Corporate & Market News for {companyName}
      </h3>
      {relatedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relatedNews.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
              <p className="text-[10px] uppercase font-bold text-[#0F766E] dark:text-emerald-400">
                {item.timeAgo} • {item.source}
              </p>
              <h4 className="font-serif text-xs font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1 line-clamp-2">
                {item.headline}
              </h4>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
          No recent news articles specifically mentioning {companyName}.
        </div>
      )}
    </div>
  );
};
