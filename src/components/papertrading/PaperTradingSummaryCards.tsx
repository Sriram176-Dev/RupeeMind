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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200/60">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Virtual Trading Portfolio
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                ₹10L Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time simulated NSE execution with authentic regulatory charges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenResetModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
            title="Reset sandbox back to ₹10,00,000"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset ₹10L</span>
          </button>

          <button
            onClick={onOpenOrderModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Portfolio Value */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1 font-mono uppercase tracking-wider text-[10px]">
            <span>Total Net Worth</span>
            <PieChart className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
            {formatINR(performance.totalPortfolioValue)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
                isOverallProfitable
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
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
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1 font-mono uppercase tracking-wider text-[10px]">
            <span>Available Cash</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
            {formatINR(wallet.cashBalance)}
          </div>
          <p className="mt-2 text-xs text-slate-500 font-mono">
            Invested:{' '}
            <span className="font-semibold text-slate-900">
              {formatINR(performance.totalInvestedValue)}
            </span>
          </p>
        </div>

        {/* Unrealized P&L & Today's Gain */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1 font-mono uppercase tracking-wider text-[10px]">
            <span>Unrealized P&L</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${
              performance.totalUnrealizedPnL >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {performance.totalUnrealizedPnL >= 0 ? '+' : ''}
            {formatINR(performance.totalUnrealizedPnL)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500 font-mono">
            <span>Today's Gain:</span>
            <span
              className={`font-semibold ${
                isTodayProfitable
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {isTodayProfitable ? '+' : ''}
              {formatINR(performance.todayUnrealizedPnL)}
            </span>
          </div>
        </div>

        {/* Realized P&L & Win Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1 font-mono uppercase tracking-wider text-[10px]">
            <span>Realized Booked P&L</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${
              wallet.realizedPnL >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {wallet.realizedPnL >= 0 ? '+' : ''}
            {formatINR(wallet.realizedPnL)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500 font-mono">
            <span>Win Rate:</span>
            <span className="font-semibold text-slate-900">
              {performance.winRatePercent}% ({wallet.winningTrades}W / {wallet.losingTrades}L)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
