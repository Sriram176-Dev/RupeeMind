import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  PieChart,
} from 'lucide-react';
import type { PaperTradingSummary } from '../../types';
import { formatINR } from '../../lib/utils';

interface PaperTradingSummaryCardsProps {
  summary: PaperTradingSummary;
  onOpenOrderModal: () => void;
  onOpenResetModal: () => void;
}

export const PaperTradingSummaryCards: React.FC<PaperTradingSummaryCardsProps> = ({
  summary,
  onOpenOrderModal,
  onOpenResetModal,
}) => {
  const { wallet, performance } = summary;
  const isOverallProfitable = performance.overallPnL >= 0;
  const isTodayProfitable = performance.todayUnrealizedPnL >= 0;

  return (
    <div className="space-y-4">
      {/* Action Bar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#0F766E] flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0B1220]">
                Virtual Paper Portfolio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#E6F4F1] text-[#0F766E] border border-emerald-500/20">
                ₹10L Sandbox
              </span>
            </div>
            <p className="text-xs text-[#5E687A]">
              Real-time simulated NSE execution with authentic regulatory charges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenResetModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E687A] hover:text-[#0B1220] bg-[#FAFAF7] border border-[#E7E5DF] hover:border-slate-400 transition"
            title="Reset sandbox back to ₹10,00,000"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset ₹10L</span>
          </button>

          <button
            onClick={onOpenOrderModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F766E] to-emerald-600 hover:from-[#115E59] hover:to-emerald-700 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Portfolio Value */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5E687A] mb-1.5">
            <span>Total Net Worth</span>
            <PieChart className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1220] tracking-tight">
            {formatINR(performance.totalPortfolioValue)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                isOverallProfitable
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/20'
                  : 'bg-rose-50 text-rose-700 border border-rose-500/20'
              }`}
            >
              {isOverallProfitable ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isOverallProfitable ? '+' : ''}
              {formatINR(performance.overallPnL)} ({isOverallProfitable ? '+' : ''}
              {performance.overallPnLPercent}%)
            </span>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5E687A] mb-1.5">
            <span>Available Cash</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1220] tracking-tight">
            {formatINR(wallet.cashBalance)}
          </div>
          <p className="mt-2 text-xs text-[#5E687A]">
            Invested:{' '}
            <span className="font-semibold text-[#0B1220]">
              {formatINR(performance.totalInvestedValue)}
            </span>
          </p>
        </div>

        {/* Unrealized P&L & Today's Gain */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5E687A] mb-1.5">
            <span>Unrealized P&L</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              performance.totalUnrealizedPnL >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {performance.totalUnrealizedPnL >= 0 ? '+' : ''}
            {formatINR(performance.totalUnrealizedPnL)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-[#5E687A]">
            <span>Today's Gain:</span>
            <span
              className={`font-bold ${
                isTodayProfitable
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {isTodayProfitable ? '+' : ''}
              {formatINR(performance.todayUnrealizedPnL)}
            </span>
          </div>
        </div>

        {/* Realized P&L & Win Rate */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5E687A] mb-1.5">
            <span>Realized Booked P&L</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              wallet.realizedPnL >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {wallet.realizedPnL >= 0 ? '+' : ''}
            {formatINR(wallet.realizedPnL)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-[#5E687A]">
            <span>Win Rate:</span>
            <span className="font-bold text-[#0B1220]">
              {performance.winRatePercent}% ({wallet.winningTrades}W / {wallet.losingTrades}L)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
