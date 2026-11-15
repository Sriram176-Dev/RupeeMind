import React from 'react';
import type { SignalData } from '../../types';
import { SignalBadge } from '../ui/SignalBadge';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  BarChart3,
  Activity,
} from 'lucide-react';

interface StockSignalPanelProps {
  signal: SignalData;
}

export const StockSignalPanel: React.FC<StockSignalPanelProps> = ({ signal }) => {
  return (
    <div className="space-y-6">
      {/* Algorithmic Signal Card */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono">
              Quantitative Signal
            </span>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Computed at {signal.generatedAt}</p>
          </div>
          <SignalBadge signal={signal.signal} signalStrength={signal.signalStrength} size="lg" />
        </div>

        {/* Score Bar (-8 to +8) */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-900">Consensus Strength Score</span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              {signal.score > 0 ? `+${signal.score}` : signal.score} / ±8
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {/* -8 to +8 normalized to 0-100% */}
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                signal.score > 0 ? 'bg-emerald-600' : signal.score < 0 ? 'bg-rose-600' : 'bg-amber-500'
              }`}
              style={{ width: `${((signal.score + 8) / 16) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>-8 Strong Sell</span>
            <span>0 Neutral</span>
            <span>+8 Strong Buy</span>
          </div>
        </div>

        {/* Reasons List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
            Rule-Based Factors ({signal.reasons.length})
          </p>
          <div className="space-y-1.5">
            {signal.reasons.map((r, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2 text-xs leading-relaxed text-slate-800"
              >
                {r.type === 'positive' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {r.type === 'negative' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                {r.type === 'neutral' && <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backtest Mini Card */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 font-mono">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Historical Strategy Backtest</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-emerald-200/80 font-mono text-emerald-700">
              N={signal.backtest.sampleSize} Trades
            </span>
          </div>

          {signal.backtest.status === 'insufficient_data' ? (
            <div className="space-y-3">
              <div className="py-2.5 px-3 rounded-lg bg-amber-50 border border-amber-200 text-center text-xs text-amber-800">
                <div className="flex items-center justify-center gap-1.5 font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Per-Stock Sample: Insufficient Data</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {signal.backtest.message || 'Insufficient trade samples (< 10 signals) to establish single-stock statistical significance.'}
                </p>
              </div>

              {signal.backtest.pooledNifty50 && (
                <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 font-mono">
                    <span>Rule performance across Nifty 50</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-emerald-200 font-mono text-emerald-700">
                      N={signal.backtest.pooledNifty50.sampleSize} trades
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                      <p className="text-[10px] text-slate-500 font-mono">Win Rate</p>
                      <p className="font-mono font-bold text-sm text-emerald-700">
                        {signal.backtest.pooledNifty50.winRate}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                      <p className="text-[10px] text-slate-500 font-mono">Avg Return</p>
                      <p className="font-mono font-bold text-sm text-emerald-700">
                        {signal.backtest.pooledNifty50.avgReturn != null && signal.backtest.pooledNifty50.avgReturn > 0 ? '+' : ''}{signal.backtest.pooledNifty50.avgReturn}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                      <p className="text-[10px] text-slate-500 font-mono">Buy & Hold Avg</p>
                      <p className="font-mono font-bold text-sm text-slate-600">
                        {signal.backtest.pooledNifty50.baselineAvgReturn != null && signal.backtest.pooledNifty50.baselineAvgReturn > 0 ? '+' : ''}{signal.backtest.pooledNifty50.baselineAvgReturn}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <p className="text-[10px] text-slate-500 font-mono">Win Rate</p>
                <p className="font-mono font-bold text-sm text-emerald-700">
                  {signal.backtest.winRate}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <p className="text-[10px] text-slate-500 font-mono">Avg Return</p>
                <p className="font-mono font-bold text-sm text-emerald-700">
                  {signal.backtest.avgReturn != null && signal.backtest.avgReturn > 0 ? '+' : ''}{signal.backtest.avgReturn}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <p className="text-[10px] text-slate-500 font-mono">Buy & Hold Avg</p>
                <p className="font-mono font-bold text-sm text-slate-600">
                  {signal.backtest.baselineAvgReturn != null && signal.backtest.baselineAvgReturn > 0 ? '+' : ''}{signal.backtest.baselineAvgReturn}%
                </p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Past performance does not predict future results. Educational simulation based on mathematical technical rules.
          </p>
        </div>
      </div>

      {/* Technical Indicator Deep-Dive Panel */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Technical Indicator Matrix
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Daily Resolution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* RSI Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900">Relative Strength (RSI 14)</span>
              <span className="font-mono font-bold text-emerald-700">{signal.indicators.rsi}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${signal.indicators.rsi > 70 ? 'bg-rose-500' : signal.indicators.rsi < 35 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${signal.indicators.rsi}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{signal.indicators.rsiSignal}</p>
          </div>

          {/* MACD Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900">MACD (12, 26, 9)</span>
              <span className="font-mono font-bold text-emerald-600">{signal.indicators.macd > 0 ? `+${signal.indicators.macd}` : signal.indicators.macd}</span>
            </div>
            <p className="text-[11px] text-slate-500">{signal.indicators.macdSignal}</p>
          </div>

          {/* Moving Averages Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900">Moving Averages (50 / 200 DMA)</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between font-mono">
              <span>50-DMA: ₹{signal.indicators.sma50}</span>
              <span>200-DMA: ₹{signal.indicators.sma200}</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-700">{signal.indicators.smaSignal}</p>
          </div>

          {/* Bollinger Bands Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900">Bollinger Bands (20, 2)</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Upper: ₹{signal.indicators.bollingerUpper}</span>
              <span>Lower: ₹{signal.indicators.bollingerLower}</span>
            </div>
            <p className="text-[11px] text-slate-500">{signal.indicators.bollingerPosition}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
