import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import type { PaperPosition } from '../../types';
import { formatINR } from '../../lib/utils';

interface PositionsTableProps {
  positions: PaperPosition[];
  onSellPosition: (position: PaperPosition) => void;
  onOpenOrderModal: () => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onSellPosition,
  onOpenOrderModal,
}) => {
  if (positions.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-[#E7E5DF] shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#0F766E] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-[#0B1220]">
            No Active Virtual Positions
          </h3>
          <p className="text-xs text-[#5E687A] leading-relaxed">
            You have ₹10,00,000 in virtual trading capital ready to deploy. Execute your first simulated trade on any NSE stock without risking real money.
          </p>
        </div>
        <button
          onClick={onOpenOrderModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F766E] to-emerald-600 hover:from-[#115E59] hover:to-emerald-700 shadow-md shadow-emerald-500/20 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Place First Virtual Trade</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-[#E7E5DF] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#E7E5DF] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#0B1220]">
            Active Virtual Positions ({positions.length})
          </h3>
          <p className="text-xs text-[#5E687A]">
            Live mark-to-market valuations updated from NSE quotes
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#FAFAF7] text-[#5E687A] font-semibold border-b border-[#E7E5DF]">
              <th className="py-3 px-4">Instrument</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Avg Price</th>
              <th className="py-3 px-4 text-right">LTP (Live)</th>
              <th className="py-3 px-4 text-right">Invested</th>
              <th className="py-3 px-4 text-right">Current Value</th>
              <th className="py-3 px-4 text-right">Unrealized P&L</th>
              <th className="py-3 px-4 text-right">Day's Gain</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5DF]">
            {positions.map((pos) => {
              const isProfit = pos.unrealizedPnL >= 0;
              const isDayProfit = pos.dayPnL >= 0;

              return (
                <tr
                  key={`${pos.symbol}-${pos.productType}`}
                  className="hover:bg-slate-50/60 transition"
                >
                  {/* Symbol & Company Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-[#0B1220] flex items-center gap-1.5">
                          <span>{pos.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-[#5E687A]">
                            {pos.productType}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5E687A] truncate max-w-[140px]">
                          {pos.companyName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4 text-right font-bold text-[#0B1220]">
                    {pos.quantity}
                  </td>

                  {/* Avg Price */}
                  <td className="py-3 px-4 text-right text-[#5E687A]">
                    {formatINR(pos.averageBuyPrice)}
                  </td>

                  {/* LTP */}
                  <td className="py-3 px-4 text-right font-bold text-[#0B1220]">
                    {formatINR(pos.currentPrice)}
                  </td>

                  {/* Invested */}
                  <td className="py-3 px-4 text-right text-[#5E687A]">
                    {formatINR(pos.investedValue)}
                  </td>

                  {/* Current Value */}
                  <td className="py-3 px-4 text-right font-bold text-[#0B1220]">
                    {formatINR(pos.currentValue)}
                  </td>

                  {/* Total P&L */}
                  <td className="py-3 px-4 text-right">
                    <div
                      className={`font-black flex items-center justify-end gap-1 ${
                        isProfit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>
                        {isProfit ? '+' : ''}
                        {formatINR(pos.unrealizedPnL)} ({isProfit ? '+' : ''}
                        {pos.unrealizedPnLPercent}%)
                      </span>
                    </div>
                  </td>

                  {/* Day P&L */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        isDayProfit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isDayProfit ? '+' : ''}
                      {formatINR(pos.dayPnL)}
                    </span>
                  </td>

                  {/* Action Button: Square Off */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSellPosition(pos)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center justify-center gap-1 mx-auto"
                    >
                      <span>Sell</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
