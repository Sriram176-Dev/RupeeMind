import React from 'react';
import { Calendar } from 'lucide-react';
import type { TrackedSIP } from '../../types';
import { formatINR } from '../../lib/utils';

interface SipsTabProps {
  sips: TrackedSIP[];
}

export const SipsTab: React.FC<SipsTabProps> = ({ sips }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sips.map((sip) => {
        const gainPositive = sip.gain >= 0;
        const nextDateStr = sip.nextDate
          ? new Date(sip.nextDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—';

        return (
          <div
            key={sip.id}
            className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#0F766E]">
                  {sip.frequency} SIP
                </span>
                {sip.partialHistory && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700"
                    title="NAV history incomplete — values are estimates"
                  >
                    Estimated
                  </span>
                )}
              </div>
              <span className="text-xs text-[#5B6572] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next: {nextDateStr}</span>
              </span>
            </div>

            <div>
              <h4 className="font-serif text-lg font-bold text-[#0B1220]">
                {sip.fundName}
              </h4>
              <p className="font-serif text-2xl font-bold text-[#0F766E] mt-1">
                {formatINR(sip.amount, false)}{' '}
                <span className="text-xs font-normal text-[#5B6572]">/ installment</span>
              </p>
            </div>

            <div className="text-xs text-[#5B6572]">
              <span>
                {sip.installmentsCompleted} installment{sip.installmentsCompleted !== 1 ? 's' : ''} completed
              </span>
              {sip.totalUnits > 0 && <span className="ml-2">· {sip.totalUnits.toFixed(2)} units</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E7E5DF] text-xs">
              <div>
                <span className="text-[10px] text-[#5B6572]">Invested</span>
                <p className="font-bold text-[#0B1220] mt-0.5">
                  {formatINR(sip.investedValue, false)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6572]">Current Value</span>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {formatINR(sip.currentValue, false)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6572]">Gain</span>
                <p
                  className={`font-bold mt-0.5 ${
                    gainPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {gainPositive ? '+' : ''}
                  {formatINR(sip.gain, false)} ({gainPositive ? '+' : ''}
                  {sip.gainPercent}%)
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6572]">XIRR</span>
                <p
                  className={`font-bold mt-0.5 ${
                    sip.xirr !== null && sip.xirr >= 0
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {sip.xirr !== null ? `${sip.xirr >= 0 ? '+' : ''}${sip.xirr}%` : '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
