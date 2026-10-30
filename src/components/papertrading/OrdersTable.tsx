import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { PaperOrder } from '../../types';
import { formatINR } from '../../lib/utils';

interface OrdersTableProps {
  orders: PaperOrder[];
  onCancelOrder: (orderId: string) => Promise<void>;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onCancelOrder }) => {
  const [filter, setFilter] = useState<'ALL' | 'EXECUTED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  const handleCancel = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      await onCancelOrder(orderId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-[#E7E5DF] shadow-sm overflow-hidden">
      {/* Header and Filter Pills */}
      <div className="p-5 border-b border-[#E7E5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0B1220]">
            Simulated Order Book ({filteredOrders.length})
          </h3>
          <p className="text-xs text-[#5E687A]">
            Execution history, fill prices, and statutory fees
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] self-start sm:self-auto">
          {(['ALL', 'EXECUTED', 'PENDING', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                filter === status
                  ? 'bg-white text-[#0B1220] shadow-sm'
                  : 'text-[#5E687A] hover:text-[#0B1220]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#5E687A]">
          No {filter.toLowerCase()} orders found in this session.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAFAF7] text-[#5E687A] font-semibold border-b border-[#E7E5DF]">
                <th className="py-3 px-4">Order ID / Time</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Type / Product</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Total Charges</th>
                <th className="py-3 px-4 text-right">Realized P&L</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5DF]">
              {filteredOrders.map((order) => {
                const isBuy = order.transactionType === 'BUY';
                const formattedDate = new Date(order.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  day: '2-digit',
                  month: 'short',
                });

                return (
                  <tr
                    key={order.orderId}
                    className="hover:bg-slate-50/60 transition"
                  >
                    {/* Order ID & Time */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#0B1220] text-[11px]">
                        {order.orderId}
                      </div>
                      <div className="text-[10px] text-[#5E687A]">
                        {formattedDate}
                      </div>
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4 font-bold text-[#0B1220]">
                      {order.symbol}
                      <span className="block font-normal text-[10px] text-[#5E687A] truncate max-w-[120px]">
                        {order.companyName}
                      </span>
                    </td>

                    {/* Action: BUY / SELL */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {order.transactionType}
                      </span>
                    </td>

                    {/* Type & Product */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#0B1220]">
                        {order.orderType}
                      </span>
                      <span className="text-[#5E687A] text-[10px] block">
                        {order.productType}
                      </span>
                    </td>

                    {/* Qty */}
                    <td className="py-3 px-4 text-right font-bold text-[#0B1220]">
                      {order.quantity}
                    </td>

                    {/* Executed / Requested Price */}
                    <td className="py-3 px-4 text-right font-bold text-[#0B1220]">
                      {formatINR(order.executedPrice || order.requestedPrice || 0)}
                    </td>

                    {/* Charges */}
                    <td className="py-3 px-4 text-right text-[#5E687A]">
                      {formatINR(order.charges?.totalCharges || 0)}
                    </td>

                    {/* Realized P&L */}
                    <td className="py-3 px-4 text-right">
                      {order.realizedPnL !== null && order.realizedPnL !== undefined ? (
                        <span
                          className={`font-bold ${
                            order.realizedPnL >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {order.realizedPnL >= 0 ? '+' : ''}
                          {formatINR(order.realizedPnL)}
                        </span>
                      ) : (
                        <span className="text-[#8B98A5]">—</span>
                      )}
                    </td>

                    {/* Status Pill & Action */}
                    <td className="py-3 px-4 text-center">
                      {order.status === 'EXECUTED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-500/10">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FILLED</span>
                        </span>
                      )}

                      {order.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 px-2 py-0.5 rounded-full bg-amber-500/10">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>PENDING</span>
                          </span>
                          <button
                            onClick={() => handleCancel(order.orderId)}
                            disabled={cancellingId === order.orderId}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                            title="Cancel limit order"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {order.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B98A5] px-2 py-0.5 rounded-full bg-slate-100">
                          <XCircle className="w-3 h-3" />
                          <span>CANCELLED</span>
                        </span>
                      )}

                      {order.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-500/10">
                          <AlertTriangle className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
