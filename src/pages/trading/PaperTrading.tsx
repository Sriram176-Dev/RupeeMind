import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Layers,
  ShoppingBag,
  History,
  BarChart3,
  RefreshCw,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  PaperTradingSummaryCards,
  OrderModal,
  PositionsTable,
  OrdersTable,
  ResetWalletModal,
} from '../../components/papertrading';
import {
  getPaperTradingSummaryApi,
  getPaperOrdersApi,
  placePaperOrderApi,
  cancelPaperOrderApi,
  resetPaperWalletApi,
} from '../../services/api';
import type {
  PaperTradingSummary,
  PaperOrder,
  PaperPosition,
  PlaceOrderPayload,
} from '../../types';
import { toast } from 'sonner';
import { formatINR } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const PaperTrading: React.FC = () => {
  const [summary, setSummary] = useState<PaperTradingSummary | null>(null);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ORDERS' | 'ANALYTICS'>('POSITIONS');

  // Modal controls
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [selectedStockForOrder, setSelectedStockForOrder] = useState<string>('');
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');
  const [maxSellQty, setMaxSellQty] = useState<number | undefined>(undefined);

  // Fetch summary and orders
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, ordersData] = await Promise.all([
        getPaperTradingSummaryApi(),
        getPaperOrdersApi({ limit: 50 }),
      ]);
      setSummary(summaryData);
      setOrders(ordersData?.orders || []);
    } catch {
      toast.error('Failed to load paper trading data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open order modal for buying
  const handleOpenBuy = (symbol = 'RELIANCE') => {
    setSelectedStockForOrder(symbol);
    setOrderAction('BUY');
    setMaxSellQty(undefined);
    setIsOrderModalOpen(true);
  };

  // Open order modal for selling a specific position
  const handleSellPosition = (pos: PaperPosition) => {
    setSelectedStockForOrder(pos.symbol);
    setOrderAction('SELL');
    setMaxSellQty(pos.quantity);
    setIsOrderModalOpen(true);
  };

  // Place order handler
  const handlePlaceOrder = async (payload: PlaceOrderPayload) => {
    const res = await placePaperOrderApi(payload);
    if (res?.success) {
      toast.success(res.message || 'Simulated order executed successfully!');
      await loadData();
    } else {
      throw new Error(res?.message || 'Failed to execute simulated order');
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await cancelPaperOrderApi(orderId);
      if (res?.success) {
        toast.success(`Order ${orderId} cancelled`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel order');
    }
  };

  // Reset wallet handler
  const handleResetWallet = async () => {
    try {
      const res = await resetPaperWalletApi();
      if (res?.success) {
        toast.success('Paper trading sandbox reset to ₹10,00,000!');
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset paper trading sandbox');
    }
  };

  // Analytics pie chart data
  const allocationData = summary
    ? [
        {
          name: 'Available Cash',
          value: summary.wallet.cashBalance,
          color: '#0F766E',
        },
        ...summary.positions.map((p, idx) => {
          const colors = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#D97706'];
          return {
            name: p.symbol,
            value: p.currentValue,
            color: colors[idx % colors.length],
          };
        }),
      ]
    : [];

  if (loading && !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#5E687A]">
          Loading virtual paper trading portfolio & live quotes...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Virtual Trading Sandbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1220] tracking-tight">
            Live Paper Trading & Execution
          </h1>
          <p className="text-sm text-[#5E687A] mt-1">
            Test quantitative strategies with ₹10,00,000 in virtual capital, real NSE quotes, and authentic Indian regulatory taxes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E687A] bg-white border border-[#E7E5DF] hover:border-slate-400 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ticks</span>
          </button>

          <button
            onClick={() => handleOpenBuy()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F766E] to-emerald-600 hover:from-[#115E59] hover:to-emerald-700 shadow-md shadow-emerald-500/20 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Trade Stocks</span>
          </button>
        </div>
      </div>

      {/* Primary Dashboard Summary Cards */}
      {summary && (
        <PaperTradingSummaryCards
          summary={summary}
          onOpenOrderModal={() => handleOpenBuy()}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E7E5DF]">
        <button
          onClick={() => setActiveTab('POSITIONS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'POSITIONS'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#5E687A] hover:text-[#0B1220]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Holdings ({summary?.positions.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'ORDERS'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#5E687A] hover:text-[#0B1220]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'ANALYTICS'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#5E687A] hover:text-[#0B1220]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performance & Allocation</span>
        </button>
      </div>

      {/* Tab 1: Positions */}
      {activeTab === 'POSITIONS' && (
        <div className="space-y-6">
          <PositionsTable
            positions={summary?.positions || []}
            onSellPosition={handleSellPosition}
            onOpenOrderModal={() => handleOpenBuy()}
          />
        </div>
      )}

      {/* Tab 2: Orders History */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          <OrdersTable orders={orders} onCancelOrder={handleCancelOrder} />
        </div>
      )}

      {/* Tab 3: Performance & Portfolio Allocation */}
      {activeTab === 'ANALYTICS' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation Donut Chart */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0B1220]">
                  Portfolio Capital Allocation
                </h3>
                <p className="text-xs text-[#5E687A]">
                  Breakdown of virtual cash versus invested equity positions
                </p>
              </div>
              <PieIcon className="w-5 h-5 text-[#0F766E]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatINR(Number(val) || 0)}
                    contentStyle={{
                      backgroundColor: '#11161D',
                      borderColor: '#1F2933',
                      borderRadius: '12px',
                      color: '#E8EDF2',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {allocationData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-[#0B1220] truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#5E687A]">
                      {formatINR(item.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0B1220]">
              Paper Trading Performance
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between">
                <span className="text-xs text-[#5E687A]">
                  Initial Seed Capital:
                </span>
                <span className="text-xs font-bold text-[#0B1220]">
                  ₹10,00,000
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between">
                <span className="text-xs text-[#5E687A]">
                  Completed Trades:
                </span>
                <span className="text-xs font-bold text-[#0B1220]">
                  {summary.wallet.totalTrades}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between">
                <span className="text-xs text-[#5E687A]">
                  Winning Trade Ratio:
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {summary.performance.winRatePercent}%
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between">
                <span className="text-xs text-[#5E687A]">
                  Sandbox Reset Count:
                </span>
                <span className="text-xs font-bold text-[#0B1220]">
                  {summary.wallet.resetCount} times
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 leading-relaxed">
              💡 <strong>Pro Tip:</strong> Use limit orders to capture dips during intraday market volatility. Indian statutory charges (STT, GST) are simulated in real-time.
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {summary && (
        <>
          <OrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            availableCash={summary.wallet.cashBalance}
            initialSymbol={selectedStockForOrder}
            initialAction={orderAction}
            maxSellQty={maxSellQty}
            onSubmitOrder={handlePlaceOrder}
          />

          <ResetWalletModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onConfirmReset={handleResetWallet}
          />
        </>
      )}
    </div>
  );
};

export default PaperTrading;
