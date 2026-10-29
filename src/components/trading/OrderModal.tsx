import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { PlaceOrderPayload, BrokerageCharges } from '../../types';
import { estimateChargesApi } from '../../services/api';
import { searchSymbols } from '../../services/marketService';
import type { SearchResultItem } from '../../types';
import { formatINR } from '../../lib/utils';
import { toast } from 'sonner';

// Popular stocks shown as quick-pick chips when search is empty
const QUICK_PICK_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'TCS' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'SBIN', name: 'SBI' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'ETERNAL', name: 'Eternal (Zomato)' },
  { symbol: 'PAYTM', name: 'Paytm' },
  { symbol: 'HAL', name: 'HAL' },
];

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
  initialSymbol?: string;
  initialAction?: 'BUY' | 'SELL';
  maxSellQty?: number;
  onSubmitOrder: (payload: PlaceOrderPayload) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  availableCash,
  initialSymbol = 'RELIANCE',
  initialAction = 'BUY',
  maxSellQty,
  onSubmitOrder,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>(initialAction);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [productType, setProductType] = useState<'DELIVERY' | 'INTRADAY'>('DELIVERY');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<string>('');

  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [charges, setCharges] = useState<BrokerageCharges | null>(null);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showChargesDetails, setShowChargesDetails] = useState<boolean>(false);

  // Sync initial props
  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
    if (initialAction) setTransactionType(initialAction);
    if (initialAction === 'SELL' && maxSellQty) setQuantity(maxSellQty);
  }, [initialSymbol, initialAction, maxSellQty]);

  // Fetch estimated price & statutory charges whenever symbol, type or qty changes
  useEffect(() => {
    if (!isOpen || !symbol) return;

    let isCurrent = true;
    const fetchEstimate = async () => {
      try {
        setLoadingPrice(true);
        const data = await estimateChargesApi({
          symbol,
          transactionType,
          productType,
          quantity: quantity > 0 ? quantity : 1,
          price: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
        });

        if (isCurrent && data) {
          setCurrentPrice(data.price || 0);
          setCharges(data.charges);
          if (orderType === 'LIMIT' && !limitPrice && data.price) {
            setLimitPrice(data.price.toString());
          }
        }
      } catch {
        // Fallback or ignore
      } finally {
        if (isCurrent) setLoadingPrice(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 250);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isOpen, symbol, transactionType, productType, quantity, orderType, limitPrice]);

  const effectivePrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const orderTurnover = effectivePrice * (quantity || 0);
  const totalChargesAmount = charges?.totalCharges || 0;
  const totalRequiredCash = transactionType === 'BUY' ? orderTurnover + totalChargesAmount : 0;
  const netEstimatedProceeds = transactionType === 'SELL' ? Math.max(0, orderTurnover - totalChargesAmount) : 0;

  const hasInsufficientCash = transactionType === 'BUY' && totalRequiredCash > availableCash;
  const hasExceededSellQty = transactionType === 'SELL' && maxSellQty !== undefined && quantity > maxSellQty;

  // Live NSE/BSE-wide search
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search query → call backend
  useEffect(() => {
    if (!isSearchOpen) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSymbols(searchQuery.trim());
        setSearchResults(res.slice(0, 10));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery, isSearchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || quantity <= 0) {
      toast.error('Please enter a valid stock symbol and quantity');
      return;
    }

    if (hasInsufficientCash) {
      toast.error('Insufficient virtual cash balance for this order');
      return;
    }

    if (hasExceededSellQty) {
      toast.error(`You cannot sell more than your holding (${maxSellQty} shares)`);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitOrder({
        symbol,
        transactionType,
        orderType,
        productType,
        quantity,
        limitPrice: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#11161D] border border-[#E7E5DF] dark:border-[#1F2933] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E7E5DF] dark:border-[#1F2933]">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                transactionType === 'BUY'
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {transactionType}
            </span>
            <div>
              <h3 className="text-base font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                Execute Virtual Trade
              </h3>
              <p className="text-xs text-[#5E687A] dark:text-[#8B98A5]">
                NSE Live Sandbox • Simulated Slippage & Statutory Charges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5E687A] hover:text-[#0B1220] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Action Tabs: BUY vs SELL */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F0EFEA] dark:bg-[#1A222D]">
            <button
              type="button"
              onClick={() => setTransactionType('BUY')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                transactionType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#5E687A] dark:text-[#8B98A5] hover:text-[#0B1220] dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>BUY (Long)</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('SELL')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                transactionType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#5E687A] dark:text-[#8B98A5] hover:text-[#0B1220] dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>SELL (Exit)</span>
            </button>
          </div>

          {/* Stock Selector Search — full NSE/BSE universe */}
          <div className="space-y-1.5 relative" ref={searchDropdownRef}>
            <label className="text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5]">
              Select Stock Symbol
            </label>
            <div className="relative">
              <input
                type="text"
                value={isSearchOpen ? searchQuery : symbol}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search any NSE/BSE stock (e.g. PAYTM, ETERNAL, HAL)"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold uppercase bg-[#FAFAF7] dark:bg-[#171D25] border border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {searchLoading ? (
                <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-[#0F766E] animate-spin" />
              ) : (
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-[#8B98A5]" />
              )}
            </div>

            {/* Dropdown — live results OR quick-pick chips */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-[#1A222D] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xl z-20">
                {searchQuery.trim() ? (
                  // Live API results
                  searchLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#5E687A]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching full NSE / BSE market...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[#5E687A]">
                      No results for &ldquo;{searchQuery}&rdquo; — try the exact NSE ticker (e.g. ETERNAL for Zomato).
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => {
                          setSymbol(item.symbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-[#F0EFEA] dark:hover:bg-[#25303D] flex items-center justify-between text-xs transition border-b border-[#F0EDE8] dark:border-[#1A2333] last:border-0"
                      >
                        <div>
                          <span className="font-bold text-[#0B1220] dark:text-[#E8EDF2]">{item.symbol}</span>
                          <span className="ml-2 text-[#5E687A] dark:text-[#8B98A5] text-[11px]">{item.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#5E687A] dark:text-[#8B98A5]">
                          {item.exchange || 'NSE'}
                        </span>
                      </button>
                    ))
                  )
                ) : (
                  // Quick-pick chips when query is empty
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-[#8B98A5] mb-2 uppercase tracking-wide">Quick Pick</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PICK_STOCKS.map((s) => (
                        <button
                          key={s.symbol}
                          type="button"
                          onClick={() => {
                            setSymbol(s.symbol);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F0EFEA] dark:bg-[#25303D] text-[#0B1220] dark:text-[#E8EDF2] hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                        >
                          {s.symbol}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#8B98A5] mt-2">Or type to search any NSE / BSE stock...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Price Chip */}
          <div className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#171D25] border border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between">
            <span className="text-xs text-[#5E687A] dark:text-[#8B98A5]">
              Current NSE Market Price:
            </span>
            <div className="flex items-center gap-2">
              {loadingPrice ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              ) : (
                <span className="text-base font-black text-[#0B1220] dark:text-[#E8EDF2]">
                  {formatINR(currentPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Product Type (Delivery CNC vs Intraday MIS) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5]">
              Product Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProductType('DELIVERY')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  productType === 'DELIVERY'
                    ? 'border-[#0F766E] bg-emerald-500/10 dark:bg-emerald-500/15'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#171D25]'
                }`}
              >
                <div className="text-xs font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                  Delivery (CNC)
                </div>
                <div className="text-[10px] text-[#5E687A] dark:text-[#8B98A5]">
                  Long-term holding • Zero brokerage
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProductType('INTRADAY')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  productType === 'INTRADAY'
                    ? 'border-[#0F766E] bg-emerald-500/10 dark:bg-emerald-500/15'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#171D25]'
                }`}
              >
                <div className="text-xs font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                  Intraday (MIS)
                </div>
                <div className="text-[10px] text-[#5E687A] dark:text-[#8B98A5]">
                  Same-day square off • Max ₹20/order
                </div>
              </button>
            </div>
          </div>

          {/* Order Type & Price Input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5]">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#FAFAF7] dark:bg-[#171D25] border border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
              >
                <option value="MARKET">Market (Instant Fill)</option>
                <option value="LIMIT">Limit (Set Target Price)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5]">
                {orderType === 'LIMIT' ? 'Limit Price (₹)' : 'Price'}
              </label>
              <input
                type="number"
                disabled={orderType === 'MARKET'}
                value={orderType === 'LIMIT' ? limitPrice : currentPrice || ''}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="₹"
                step="0.05"
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border border-[#E7E5DF] dark:border-[#1F2933] focus:outline-none ${
                  orderType === 'MARKET'
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-[#8B98A5] cursor-not-allowed'
                    : 'bg-[#FAFAF7] dark:bg-[#171D25] text-[#0B1220] dark:text-[#E8EDF2]'
                }`}
              />
            </div>
          </div>

          {/* Quantity Selector with Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5]">
                Number of Shares
              </label>
              {transactionType === 'SELL' && maxSellQty !== undefined && (
                <span className="text-[11px] text-[#0F766E] dark:text-emerald-400 font-medium">
                  Holding: {maxSellQty} shares
                </span>
              )}
            </div>

            <input
              type="number"
              min="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-[#FAFAF7] dark:bg-[#171D25] border border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
            />

            {/* Quick Increment Chips */}
            <div className="flex items-center gap-1.5">
              {[10, 25, 50, 100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setQuantity(inc)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F0EFEA] dark:bg-[#1A222D] text-[#5E687A] dark:text-[#8B98A5] hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  +{inc}
                </button>
              ))}
              {transactionType === 'SELL' && maxSellQty ? (
                <button
                  type="button"
                  onClick={() => setQuantity(maxSellQty)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                >
                  Max All ({maxSellQty})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (currentPrice > 0) {
                      const maxPossible = Math.floor(availableCash / currentPrice);
                      if (maxPossible > 0) setQuantity(maxPossible);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-[#0F766E] dark:text-emerald-400 border border-emerald-500/20"
                >
                  Max Cash
                </button>
              )}
            </div>
          </div>

          {/* Interactive Indian Statutory Charges Breakdown */}
          <div className="rounded-2xl bg-[#FAFAF7] dark:bg-[#171D25] border border-[#E7E5DF] dark:border-[#1F2933] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowChargesDetails(!showChargesDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#5E687A] dark:text-[#8B98A5] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] transition"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0F766E] dark:text-emerald-400" />
                <span>Estimated Taxes & Charges (Zerodha Style)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                  {formatINR(totalChargesAmount)}
                </span>
                {showChargesDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showChargesDetails && charges && (
              <div className="px-4 pb-3 space-y-1.5 text-[11px] border-t border-[#E7E5DF] dark:border-[#1F2933] pt-2 text-[#5E687A] dark:text-[#8B98A5]">
                <div className="flex justify-between">
                  <span>Brokerage:</span>
                  <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {charges.brokerage === 0 ? 'FREE (₹0.00)' : formatINR(charges.brokerage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>STT (Securities Transaction Tax):</span>
                  <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {formatINR(charges.stt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Turnover Charge:</span>
                  <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {formatINR(charges.exchangeTurnover)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% on Brokerage + Turnover):</span>
                  <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {formatINR(charges.gst)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stamp Duty (0.015% on Buy):</span>
                  <span className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {formatINR(charges.stampDuty)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Total Cost & Validation Warnings */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A222D] border border-[#E7E5DF] dark:border-[#1F2933] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5E687A] dark:text-[#8B98A5]">
                {transactionType === 'BUY' ? 'Total Required Margin:' : 'Estimated Net Proceeds:'}
              </span>
              <span className="text-base font-black text-[#0B1220] dark:text-[#E8EDF2]">
                {formatINR(transactionType === 'BUY' ? totalRequiredCash : netEstimatedProceeds)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5E687A] dark:text-[#8B98A5]">
              <span>Available Virtual Cash:</span>
              <span className="font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                {formatINR(availableCash)}
              </span>
            </div>

            {hasInsufficientCash && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Insufficient virtual cash. Needed: {formatINR(totalRequiredCash)}</span>
              </div>
            )}

            {hasExceededSellQty && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You cannot sell more shares than you hold ({maxSellQty})</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting || hasInsufficientCash || hasExceededSellQty || quantity <= 0}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              transactionType === 'BUY'
                ? 'bg-gradient-to-r from-[#0F766E] to-emerald-600 hover:from-[#115E59] hover:to-emerald-700 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/20'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Virtual Order...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>
                  {transactionType === 'BUY' ? 'Execute BUY Order' : 'Execute SELL Order'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
