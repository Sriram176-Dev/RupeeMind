import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800/80',
        className
      )}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] rounded-xl flex items-center justify-between px-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-36 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-24 h-6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] space-y-4 animate-pulse"
        >
          <div className="flex justify-between">
            <Skeleton className="w-20 h-5 rounded-full" />
            <Skeleton className="w-12 h-5 rounded-full" />
          </div>
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <div className="flex justify-between pt-2 border-t border-[#E7E5DF] dark:border-[#1F2933]">
            <Skeleton className="w-16 h-6" />
            <Skeleton className="w-24 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
