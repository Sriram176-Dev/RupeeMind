import React from 'react';
import { X } from 'lucide-react';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHoldingType: 'STOCK' | 'MUTUAL_FUND';
  setNewHoldingType: (type: 'STOCK' | 'MUTUAL_FUND') => void;
  newName: string;
  setNewName: (name: string) => void;
  setNewSymbolOrCode: (code: string) => void;
  newQuantity: number;
  setNewQuantity: (qty: number) => void;
  newBuyPrice: number;
  setNewBuyPrice: (price: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({
  isOpen,
  onClose,
  newHoldingType,
  setNewHoldingType,
  newName,
  setNewName,
  setNewSymbolOrCode,
  newQuantity,
  setNewQuantity,
  newBuyPrice,
  setNewBuyPrice,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">Add Portfolio Holding</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0B1220]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">Asset Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewHoldingType('STOCK')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  newHoldingType === 'STOCK' ? 'bg-[#0F766E] text-white border-transparent' : 'border-[#E7E5DF] dark:border-[#1F2933]'
                }`}
              >
                Direct Stock
              </button>
              <button
                type="button"
                onClick={() => setNewHoldingType('MUTUAL_FUND')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  newHoldingType === 'MUTUAL_FUND' ? 'bg-[#0F766E] text-white border-transparent' : 'border-[#E7E5DF] dark:border-[#1F2933]'
                }`}
              >
                Mutual Fund
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">Symbol / Scheme Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSymbolOrCode(e.target.value.toUpperCase());
              }}
              required
              placeholder="e.g. Tata Motors Ltd."
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-transparent text-xs text-[#0B1220] dark:text-[#E8EDF2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">Quantity / Units</label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                required
                min={0.1}
                step={0.1}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-transparent text-xs text-[#0B1220] dark:text-[#E8EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">Buy Price (INR)</label>
              <input
                type="number"
                value={newBuyPrice}
                onChange={(e) => setNewBuyPrice(Number(e.target.value))}
                required
                min={1}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-transparent text-xs text-[#0B1220] dark:text-[#E8EDF2]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E7E5DF] dark:border-[#1F2933]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white"
            >
              Save Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
