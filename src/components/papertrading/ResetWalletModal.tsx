import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, Loader2 } from 'lucide-react';

interface ResetWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetWalletModal: React.FC<ResetWalletModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [resetting, setResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      setResetting(true);
      await onConfirmReset();
      onClose();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E7E5DF] shadow-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5E687A] hover:text-[#0B1220] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#0B1220]">
            Reset Virtual Paper Portfolio?
          </h3>
          <p className="text-xs text-[#5E687A] leading-relaxed">
            This will reset your available cash back to <strong className="text-[#0B1220]">₹10,00,000</strong> and wipe all active virtual holdings, order history, and accumulated P&L statistics.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#5E687A] hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Reset to ₹10L</span>
          </button>
        </div>
      </div>
    </div>
  );
};
