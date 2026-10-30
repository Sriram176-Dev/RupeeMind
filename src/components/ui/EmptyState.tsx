import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 text-center rounded-2xl bg-white border border-[#E7E5DF] flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h2 className="font-serif text-xl font-bold text-[#0B1220] mb-2">
        {title}
      </h2>

      <p className="text-xs sm:text-sm text-[#5B6572] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all shadow-xs min-h-[44px] flex items-center justify-center"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
