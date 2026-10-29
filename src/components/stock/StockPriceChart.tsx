import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { TimeRange, PricePoint, StockQuote } from '../../types';
import { formatINR, formatNumber } from '../../lib/utils';

interface StockPriceChartProps {
  history: PricePoint[];
  quote: StockQuote;
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  chartType: 'area' | 'line';
  setChartType: (type: 'area' | 'line') => void;
}

export const StockPriceChart: React.FC<StockPriceChartProps> = ({
  history,
  quote,
  range,
  setRange,
  chartType,
  setChartType,
}) => {
  const isPositive = quote.change >= 0;
  const strokeColor = isPositive ? '#16A34A' : '#DC2626';
  const fillColor = isPositive ? '#22C55E' : '#EF4444';

  const periodHigh = history.length > 0 ? Math.max(...history.map((h) => h.price), quote.price) : quote.price;
  const periodLow = history.length > 0 ? Math.min(...history.map((h) => h.price), quote.price) : quote.price;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E5DF] dark:border-[#1F2933] pb-3">
        <div className="flex items-center gap-1">
          {(['1D', '1W', '1M', '1Y', '5Y'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? 'bg-[#0F766E] text-white dark:bg-emerald-600'
                  : 'text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-md ${chartType === 'area' ? 'bg-[#E6F4F1] dark:bg-emerald-950 text-[#0F766E] font-semibold' : 'text-[#5B6572]'}`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-2.5 py-1 rounded-md ${chartType === 'line' ? 'bg-[#E6F4F1] dark:bg-emerald-950 text-[#0F766E] font-semibold' : 'text-[#5B6572]'}`}
          >
            Line
          </button>
        </div>
      </div>

      {/* Recharts Component */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                stroke="#8A97A6"
                fontSize={10}
                tickMargin={8}
              />
              <YAxis
                domain={['dataMin - 10', 'dataMax + 10']}
                orientation="right"
                stroke="#8A97A6"
                fontSize={10}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: '#121821',
                  borderColor: '#1F2933',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          ) : (
            <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#8A97A6" fontSize={10} />
              <YAxis domain={['auto', 'auto']} orientation="right" stroke="#8A97A6" fontSize={10} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'Price']}
                contentStyle={{ backgroundColor: '#121821', borderColor: '#1F2933', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Range high/low summary */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E7E5DF] dark:border-[#1F2933] text-center text-xs">
        <div>
          <p className="text-[10px] uppercase text-[#5B6572] dark:text-[#8A97A6]">Period High</p>
          <p className="font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
            {formatINR(periodHigh)}
          </p>
        </div>
        <div className="border-x border-[#E7E5DF] dark:border-[#1F2933]">
          <p className="text-[10px] uppercase text-[#5B6572] dark:text-[#8A97A6]">Period Low</p>
          <p className="font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
            {formatINR(periodLow)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#5B6572] dark:text-[#8A97A6]">Avg Daily Volume</p>
          <p className="font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
            {formatNumber(quote.volume)}
          </p>
        </div>
      </div>
    </div>
  );
};
