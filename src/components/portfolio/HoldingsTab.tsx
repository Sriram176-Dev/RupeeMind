import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { Holding } from '../../types';
import { formatINR, formatPercent } from '../../lib/utils';

interface HoldingsTabProps {
  holdings: Holding[];
  assetPieData: { name: string; value: number; color: string }[];
  onDeleteHolding: (id: string) => void;
}

export const HoldingsTab: React.FC<HoldingsTabProps> = ({
  holdings,
  assetPieData,
  onDeleteHolding,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 rounded-3xl bg-white border border-[#E7E5DF] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E7E5DF] flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold text-[#0B1220]">
            Active Position Details
          </h3>
          <span className="text-xs text-[#5B6572]">{holdings.length} Assets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF7] text-[#5B6572]">
              <tr>
                <th className="py-3 px-4 font-semibold">Instrument</th>
                <th className="py-3 px-4 font-semibold text-right">Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Buy</th>
                <th className="py-3 px-4 font-semibold text-right">Current Value</th>
                <th className="py-3 px-4 font-semibold text-right">Unrealized P&L</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5DF]">
              {holdings.map((h) => {
                const invested = h.quantity * h.buyPrice;
                const current = h.quantity * h.currentPrice;
                const pnl = current - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

                return (
                  <tr key={h.id} className="hover:bg-[#FAFAF7]">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#0B1220]">{h.name}</p>
                      <p className="text-[11px] text-[#5B6572]">
                        {h.type} • {h.categoryOrSector}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-mono">{h.quantity}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums">{formatINR(h.buyPrice)}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#0B1220]">
                      {formatINR(current)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <p className={`font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                      </p>
                      <p className={`text-[10px] ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ({formatPercent(pnlPct)})
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteHolding(h.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right 4 Cols: Asset Split Donut */}
      <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0B1220]">
          Holding Allocation
        </h3>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie data={assetPieData} dataKey="value" innerRadius={45} outerRadius={68} paddingAngle={4}>
                {assetPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [formatINR(Number(val || 0), false), 'Value']} />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#E7E5DF] text-xs">
          {assetPieData.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </span>
              <span className="font-bold text-[#0B1220]">{formatINR(item.value, false)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
