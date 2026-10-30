import React, { useState, useMemo, useRef } from 'react';
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
import { BarChart3, TrendingUp, CandlestickChart, Activity } from 'lucide-react';

interface StockPriceChartProps {
  history: PricePoint[];
  quote: StockQuote;
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  chartType: 'candles' | 'area' | 'line';
  setChartType: (type: 'candles' | 'area' | 'line') => void;
}

export const StockPriceChart: React.FC<StockPriceChartProps> = ({
  history,
  quote,
  range,
  setRange,
  chartType,
  setChartType,
}) => {
  const [showSMA, setShowSMA] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Normalize bars with safe OHLC fallbacks
  const bars = useMemo(() => {
    const fallbackPrevClose = quote.previousClose ?? (quote.price - quote.change);

    if (!history || history.length === 0) {
      // Fallback single bar from quote
      return [
        {
          date: 'Live',
          price: quote.price,
          open: fallbackPrevClose || quote.price,
          high: Math.max(quote.price, quote.dayHigh || quote.price),
          low: Math.min(quote.price, quote.dayLow || quote.price),
          close: quote.price,
          volume: quote.volume || 0,
        },
      ];
    }

    return history.map((h, i, arr) => {
      const close = h.close ?? h.price;
      const prevClose = i > 0 ? (arr[i - 1].close ?? arr[i - 1].price) : (fallbackPrevClose || close);
      const open = h.open ?? prevClose;
      const high = h.high ?? Math.max(open, close);
      const low = h.low ?? Math.min(open, close);
      const volume = h.volume ?? 0;

      return {
        ...h,
        close,
        open,
        high,
        low,
        volume,
      };
    });
  }, [history, quote]);

  // Compute 20-period Simple Moving Average (SMA 20)
  const smaValues = useMemo(() => {
    const period = Math.min(20, Math.max(3, Math.floor(bars.length / 3)));
    return bars.map((_, idx, arr) => {
      if (idx < period - 1) return null;
      const slice = arr.slice(idx - period + 1, idx + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      return Number((sum / period).toFixed(2));
    });
  }, [bars]);

  // Active bar for HUD (hovered bar or latest bar)
  const activeBar = hoverIndex !== null && bars[hoverIndex] ? bars[hoverIndex] : bars[bars.length - 1];
  const activeBarChange = activeBar ? activeBar.close - activeBar.open : 0;
  const activeBarChangePercent = activeBar && activeBar.open > 0 ? (activeBarChange / activeBar.open) * 100 : 0;
  const isActivePositive = activeBarChange >= 0;

  // Period High / Low
  const periodHigh = bars.length > 0 ? Math.max(...bars.map((b) => b.high), quote.price) : quote.price;
  const periodLow = bars.length > 0 ? Math.min(...bars.map((b) => b.low), quote.price) : quote.price;

  // Colors
  const isQuotePositive = quote.change >= 0;
  const strokeColor = isQuotePositive ? '#16A34A' : '#DC2626';
  const fillColor = isQuotePositive ? '#22C55E' : '#EF4444';

  // SVG Candlestick layout metrics
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 340;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 30; // space for X axis dates
  const PRICE_AREA_HEIGHT = 230; // price chart height
  const VOL_AREA_HEIGHT = 50; // volume sub-chart height
  const RIGHT_AXIS_WIDTH = 75; // price labels margin on right
  const PLOT_WIDTH = SVG_WIDTH - RIGHT_AXIS_WIDTH;

  const minPrice = Math.min(...bars.map((b) => b.low)) * 0.998;
  const maxPrice = Math.max(...bars.map((b) => b.high)) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...bars.map((b) => b.volume), 1);

  const getPriceY = (price: number) => {
    return PADDING_TOP + ((maxPrice - price) / priceRange) * PRICE_AREA_HEIGHT;
  };

  const getVolY = (vol: number) => {
    const barHeight = (vol / maxVolume) * VOL_AREA_HEIGHT;
    return PADDING_TOP + PRICE_AREA_HEIGHT + (VOL_AREA_HEIGHT - barHeight) + 10;
  };

  const getVolHeight = (vol: number) => {
    return Math.max(2, (vol / maxVolume) * VOL_AREA_HEIGHT);
  };

  // Generate 5 horizontal price grid steps
  const priceGridLevels = useMemo(() => {
    const count = 5;
    const step = priceRange / (count - 1);
    return Array.from({ length: count }, (_, i) => {
      const price = maxPrice - i * step;
      const y = getPriceY(price);
      return { price, y };
    });
  }, [minPrice, maxPrice, priceRange]);

  // Candlestick bar slot metrics
  const barCount = bars.length;
  const slotWidth = PLOT_WIDTH / Math.max(barCount, 1);
  const candleBodyWidth = Math.max(3, Math.min(slotWidth * 0.7, 18));

  // Build SVG path for SMA 20 line
  const smaPath = useMemo(() => {
    let d = '';
    bars.forEach((_, idx) => {
      const sma = smaValues[idx];
      if (sma === null) return;
      const x = idx * slotWidth + slotWidth / 2;
      const y = getPriceY(sma);
      if (!d) {
        d = `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    });
    return d;
  }, [bars, smaValues, slotWidth, maxPrice, priceRange]);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * SVG_WIDTH;

    if (relativeX < 0 || relativeX > PLOT_WIDTH) {
      setHoverIndex(null);
      return;
    }

    const index = Math.floor(relativeX / slotWidth);
    if (index >= 0 && index < barCount) {
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
      
      {/* Top Header: Real-Time OHLC HUD Display & Controls */}
      <div className="space-y-3 border-b border-[#E7E5DF] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Time Range Selector */}
          <div className="inline-flex items-center gap-1 bg-[#FAFAF7] p-1 rounded-xl border border-[#E7E5DF]">
            {(['1D', '1W', '1M', '1Y', '5Y'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#5B6572] hover:text-[#0B1220] hover:bg-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart Type & Indicator Controls */}
          <div className="flex items-center gap-2">
            
            {/* SMA Indicator Toggle */}
            {chartType === 'candles' && (
              <button
                onClick={() => setShowSMA(!showSMA)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showSMA
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-[#FAFAF7] border-[#E7E5DF] text-[#5B6572] hover:text-[#0B1220]'
                }`}
                title="Toggle 20-period Simple Moving Average (SMA)"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>SMA (20)</span>
              </button>
            )}

            {/* Chart Type Selector */}
            <div className="inline-flex items-center gap-1 bg-[#FAFAF7] p-1 rounded-xl border border-[#E7E5DF]">
              <button
                onClick={() => setChartType('candles')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartType === 'candles'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#5B6572] hover:text-[#0B1220] hover:bg-white'
                }`}
                title="Japanese Candlestick Chart"
              >
                <CandlestickChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Candles</span>
              </button>

              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartType === 'area'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#5B6572] hover:text-[#0B1220] hover:bg-white'
                }`}
                title="Gradient Area Chart"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Area</span>
              </button>

              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartType === 'line'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#5B6572] hover:text-[#0B1220] hover:bg-white'
                }`}
                title="Closing Price Line Chart"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Line</span>
              </button>
            </div>

          </div>
        </div>

        {/* Real-Time Institutional OHLC HUD Bar */}
        {activeBar && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono pt-1 text-[#5B6572]">
            <span className="font-bold text-[#0B1220]">{activeBar.date}</span>
            <div className="flex items-center gap-3">
              <span>
                O: <span className="text-[#0B1220] font-semibold">₹{activeBar.open.toFixed(2)}</span>
              </span>
              <span>
                H: <span className="text-emerald-700 font-semibold">₹{activeBar.high.toFixed(2)}</span>
              </span>
              <span>
                L: <span className="text-rose-700 font-semibold">₹{activeBar.low.toFixed(2)}</span>
              </span>
              <span>
                C:{' '}
                <span className={`font-bold ${isActivePositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{activeBar.close.toFixed(2)}
                </span>
              </span>
              <span className={`font-semibold ${isActivePositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isActivePositive ? '+' : ''}
                {activeBarChangePercent.toFixed(2)}%
              </span>
              {activeBar.volume > 0 && (
                <span className="hidden md:inline text-[11px] text-[#5B6572]">
                  Vol: <span className="text-[#0B1220] font-medium">{formatNumber(activeBar.volume)}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Canvas Container */}
      <div className="w-full relative select-none" ref={svgContainerRef}>
        
        {chartType === 'candles' ? (
          /* Realistic Candlestick Vector Engine */
          <div className="w-full h-80 relative">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair overflow-visible"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="volGradBull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="volGradBear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Background Price Grid Lines & Labels */}
              {priceGridLevels.map((lvl, i) => (
                <g key={i}>
                  <line
                    x1="0"
                    y1={lvl.y}
                    x2={PLOT_WIDTH}
                    y2={lvl.y}
                    stroke="#E7E5DF"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PLOT_WIDTH + 8}
                    y={lvl.y + 3.5}
                    fill="#8A97A6"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ₹{lvl.price.toFixed(lvl.price > 1000 ? 0 : 2)}
                  </text>
                </g>
              ))}

              {/* Volume sub-chart baseline */}
              <line
                x1="0"
                y1={PADDING_TOP + PRICE_AREA_HEIGHT + 10}
                x2={PLOT_WIDTH}
                y2={PADDING_TOP + PRICE_AREA_HEIGHT + 10}
                stroke="#E7E5DF"
                strokeWidth="1"
              />
              <text
                x="6"
                y={PADDING_TOP + PRICE_AREA_HEIGHT + 22}
                fill="#8A97A6"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                VOLUME
              </text>

              {/* Candlesticks & Volume Bars */}
              {bars.map((b, idx) => {
                const isBullish = b.close >= b.open;
                const candleColor = isBullish ? '#16A34A' : '#DC2626';
                const bodyFill = isBullish ? '#22C55E' : '#EF4444';
                const volFill = isBullish ? 'url(#volGradBull)' : 'url(#volGradBear)';

                const centerX = idx * slotWidth + slotWidth / 2;
                const yHigh = getPriceY(b.high);
                const yLow = getPriceY(b.low);
                const yOpen = getPriceY(b.open);
                const yClose = getPriceY(b.close);

                const bodyY = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);

                const volY = getVolY(b.volume);
                const volHeight = getVolHeight(b.volume);

                const isHovered = hoverIndex === idx;

                return (
                  <g key={idx} className="transition-opacity">
                    {/* Volume Bar */}
                    <rect
                      x={centerX - candleBodyWidth / 2}
                      y={volY}
                      width={candleBodyWidth}
                      height={volHeight}
                      fill={volFill}
                      stroke={candleColor}
                      strokeWidth="0.5"
                      opacity={hoverIndex === null || isHovered ? 0.9 : 0.4}
                      rx="1"
                    />

                    {/* Wick: High to Low Line */}
                    <line
                      x1={centerX}
                      y1={yHigh}
                      x2={centerX}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={candleBodyWidth > 8 ? '1.5' : '1'}
                      opacity={hoverIndex === null || isHovered ? 1 : 0.5}
                    />

                    {/* Candle Body */}
                    <rect
                      x={centerX - candleBodyWidth / 2}
                      y={bodyY}
                      width={candleBodyWidth}
                      height={bodyHeight}
                      fill={bodyFill}
                      stroke={candleColor}
                      strokeWidth="1"
                      opacity={hoverIndex === null || isHovered ? 1 : 0.5}
                      rx="1"
                    />

                    {/* X-Axis Date Ticks (spaced evenly) */}
                    {idx % Math.ceil(barCount / 6) === 0 && (
                      <text
                        x={centerX}
                        y={SVG_HEIGHT - 6}
                        fill="#8A97A6"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {b.date}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 20-period Moving Average Path */}
              {showSMA && smaPath && (
                <path
                  d={smaPath}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              )}

              {/* Interactive Crosshair Tracking */}
              {hoverIndex !== null && bars[hoverIndex] && (
                <g pointerEvents="none">
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={hoverIndex * slotWidth + slotWidth / 2}
                    y1={PADDING_TOP}
                    x2={hoverIndex * slotWidth + slotWidth / 2}
                    y2={SVG_HEIGHT - PADDING_BOTTOM}
                    stroke="#0F766E"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Horizontal Crosshair Line at Close Price */}
                  <line
                    x1="0"
                    y1={getPriceY(bars[hoverIndex].close)}
                    x2={PLOT_WIDTH}
                    y2={getPriceY(bars[hoverIndex].close)}
                    stroke="#0F766E"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Right Price Pill on Y Axis */}
                  <g transform={`translate(${PLOT_WIDTH}, ${getPriceY(bars[hoverIndex].close) - 9})`}>
                    <rect
                      x="2"
                      y="0"
                      width={RIGHT_AXIS_WIDTH - 6}
                      height="18"
                      rx="4"
                      fill="#0F766E"
                    />
                    <text
                      x="6"
                      y="13"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ₹{bars[hoverIndex].close.toFixed(2)}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        ) : (
          /* Recharts Area / Line Fallback */
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={bars} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={fillColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    stroke="#8A97A6"
                    fontSize={10}
                    tickMargin={8}
                    fontFamily="monospace"
                  />
                  <YAxis
                    domain={['dataMin - 5', 'dataMax + 5']}
                    orientation="right"
                    stroke="#8A97A6"
                    fontSize={10}
                    fontFamily="monospace"
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'Close Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5DF',
                      color: '#0B1220',
                      borderRadius: '16px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#priceGrad)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={bars} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="#8A97A6"
                    fontSize={10}
                    fontFamily="monospace"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    orientation="right"
                    stroke="#8A97A6"
                    fontSize={10}
                    fontFamily="monospace"
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'Close Price']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5DF',
                      color: '#0B1220',
                      borderRadius: '16px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Range High/Low & Volume Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E7E5DF] text-center text-xs">
        <div>
          <p className="text-[10px] uppercase font-bold text-[#5B6572] font-mono">Period High</p>
          <p className="font-serif font-bold text-emerald-700 text-sm tabular-nums mt-0.5">
            {formatINR(periodHigh)}
          </p>
        </div>
        <div className="border-l sm:border-x border-[#E7E5DF]">
          <p className="text-[10px] uppercase font-bold text-[#5B6572] font-mono">Period Low</p>
          <p className="font-serif font-bold text-rose-700 text-sm tabular-nums mt-0.5">
            {formatINR(periodLow)}
          </p>
        </div>
        <div className="border-t sm:border-t-0 pt-2 sm:pt-0">
          <p className="text-[10px] uppercase font-bold text-[#5B6572] font-mono">Avg Daily Vol</p>
          <p className="font-serif font-bold text-[#0B1220] text-sm tabular-nums mt-0.5">
            {formatNumber(quote.volume)}
          </p>
        </div>
        <div className="border-t sm:border-t-0 border-l border-[#E7E5DF] pt-2 sm:pt-0">
          <p className="text-[10px] uppercase font-bold text-[#5B6572] font-mono">52W Range</p>
          <p className="font-serif font-bold text-[#0B1220] text-sm tabular-nums mt-0.5">
            {quote.fiftyTwoWeekLow ? `₹${quote.fiftyTwoWeekLow.toFixed(0)} - ₹${quote.fiftyTwoWeekHigh?.toFixed(0)}` : '—'}
          </p>
        </div>
      </div>

    </div>
  );
};
