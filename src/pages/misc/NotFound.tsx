import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-6 text-center">
      <div className="max-w-md p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xl space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
            ERROR 404 • ROUTE UNRESOLVED
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] leading-relaxed">
            The page you are looking for does not exist or has been shifted to a different financial quadrant.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            to="/market"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] border border-[#E7E5DF] dark:border-[#1F2933] hover:bg-black/5 min-h-[44px] flex items-center justify-center"
          >
            <span>Live Market</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
