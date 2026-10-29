import React from 'react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

interface AssetAllocationChartProps {
  equity: number;
  debt: number;
  gold: number;
  marketContextNote?: string;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  equity,
  debt,
  gold,
  marketContextNote,
}) => {
  const assetPieData = [
    { name: 'Equity Funds', value: equity, color: '#0F766E' },
    { name: 'Debt Funds', value: debt, color: '#4F46E5' },
    { name: 'Gold / Commodities', value: gold, color: '#D97706' },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-4 flex justify-center">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={assetPieData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {assetPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Allocation']} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-8 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400">
              RECOMMENDED MACRO SPLIT
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">
              Target Portfolio Asset Allocation
            </h3>
            {marketContextNote && (
              <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] mt-1">
                {marketContextNote}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#E6F4F1] dark:bg-emerald-950/40 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-[#0F766E] dark:text-emerald-300">Equity Assets</span>
              <p className="font-serif text-2xl font-bold text-[#0F766E] dark:text-emerald-300 mt-0.5">
                {equity}%
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Debt / Stability</span>
              <p className="font-serif text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                {debt}%
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Gold / Hedging</span>
              <p className="font-serif text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                {gold}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
