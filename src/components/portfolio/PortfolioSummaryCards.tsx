import React from 'react';
import { Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { formatINR, formatPercent } from '../../lib/utils';

interface PortfolioSummaryCardsProps {
  totalInvested: number;
  totalCurrent: number;
  totalGain: number;
  gainPercent: number;
}

export const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({
  totalInvested,
  totalCurrent,
  totalGain,
  gainPercent,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard
        label="Total Invested Value"
        value={formatINR(totalInvested, false)}
        subtext="Cost basis"
        icon={Briefcase}
      />
      <StatCard
        label="Current Portfolio Value"
        value={formatINR(totalCurrent, false)}
        subtext="Mark-to-Market"
        icon={TrendingUp}
      />
      <StatCard
        label="Total Unrealized P&L"
        value={`${totalGain >= 0 ? '+' : ''}${formatINR(totalGain, false)}`}
        trend={{
          value: formatPercent(gainPercent),
          isPositive: totalGain >= 0,
        }}
        subtext="All-time returns"
        icon={Sparkles}
      />
    </div>
  );
};
