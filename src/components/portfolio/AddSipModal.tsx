import React from 'react';
import { X } from 'lucide-react';

interface AddSipModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSipFundName: string;
  setNewSipFundName: (name: string) => void;
  newSipAmount: number;
  setNewSipAmount: (amt: number) => void;
  newSipDate: string;
  setNewSipDate: (date: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddSipModal: React.FC<AddSipModalProps> = ({
  isOpen,
  onClose,
  newSipFundName,
  setNewSipFundName,
  newSipAmount,
  setNewSipAmount,
  newSipDate,
  setNewSipDate,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E7E5DF] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-[#0B1220]">Track Active SIP</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0B1220]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">Mutual Fund Scheme</label>
            <input
              type="text"
              value={newSipFundName}
              onChange={(e) => setNewSipFundName(e.target.value)}
              required
              placeholder="e.g. Parag Parikh Flexi Cap Fund"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">Monthly SIP Amount (INR)</label>
            <input
              type="number"
              value={newSipAmount || ''}
              onChange={(e) => setNewSipAmount(Number(e.target.value))}
              required
              min={500}
              step={500}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">Next Debit Date</label>
            <input
              type="text"
              value={newSipDate}
              onChange={(e) => setNewSipDate(e.target.value)}
              required
              placeholder="e.g. 10th of every month"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E7E5DF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white"
            >
              Start Tracking SIP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
