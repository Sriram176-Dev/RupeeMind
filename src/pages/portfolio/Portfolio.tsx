import React, { useState, useEffect, useMemo } from 'react';
import { getHoldings, addHolding, deleteHolding, getTrackedSIPs, addTrackedSIP, getWatchlist, toggleWatchlist, getQuotes } from '../../services/api';
import type { Holding, TrackedSIP, StockQuote } from '../../types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  PortfolioSummaryCards,
  HoldingsTab,
  SipsTab,
  WatchlistTab,
  AddHoldingModal,
  AddSipModal,
} from '../../components/portfolio';
import { AuditReportModal } from '../../components/reports';

type PortfolioTab = 'holdings' | 'sips' | 'watchlist';

export const Portfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('holdings');

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [sips, setSips] = useState<TrackedSIP[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Holding Modal State - clean initial inputs
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [newHoldingType, setNewHoldingType] = useState<'STOCK' | 'MUTUAL_FUND'>('STOCK');
  const [newSymbolOrCode, setNewSymbolOrCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newBuyPrice, setNewBuyPrice] = useState<number>(0);

  // Add SIP Modal State - clean initial inputs
  const [isAddSipOpen, setIsAddSipOpen] = useState(false);
  const [newSipFundName, setNewSipFundName] = useState('');
  const [newSipAmount, setNewSipAmount] = useState<number>(0);
  const [newSipDate, setNewSipDate] = useState('');

  // Institutional Audit Report Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [h, s, w, q] = await Promise.all([
        getHoldings(),
        getTrackedSIPs(),
        getWatchlist(),
        getQuotes(),
      ]);
      setHoldings(h);
      setSips(s);
      setWatchlistSymbols(w);
      setQuotes(q);
    } catch (err) {
      console.error('Failed to load portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    holdings.forEach((h) => {
      totalInvested += h.quantity * h.buyPrice;
      totalCurrent += h.quantity * h.currentPrice;
    });

    const totalGain = totalCurrent - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalGain,
      gainPercent,
    };
  }, [holdings]);

  // Asset Allocation for Holdings
  const assetPieData = useMemo(() => {
    let stockVal = 0;
    let mfVal = 0;

    holdings.forEach((h) => {
      const val = h.quantity * h.currentPrice;
      if (h.type === 'STOCK') stockVal += val;
      else mfVal += val;
    });

    return [
      { name: 'Direct Equities', value: Math.round(stockVal), color: '#0F766E' },
      { name: 'Mutual Funds', value: Math.round(mfVal), color: '#4F46E5' },
    ].filter((d) => d.value > 0);
  }, [holdings]);

  const handleDeleteHolding = async (id: string) => {
    try {
      await deleteHolding(id);
      setHoldings((prev) => prev.filter((h) => h.id !== id));
      toast.success('Holding position removed');
    } catch {
      toast.error('Failed to remove holding');
    }
  };

  const handleToggleWatch = async (sym: string) => {
    try {
      await toggleWatchlist(sym);
      setWatchlistSymbols((prev) => prev.filter((s) => s !== sym));
      toast.success(`Removed ${sym} from watchlist`);
    } catch {
      toast.error('Failed to update watchlist');
    }
  };

  const handleAddHoldingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await addHolding({
        type: newHoldingType,
        symbolOrCode: newSymbolOrCode,
        name: newName,
        quantity: newQuantity,
        buyPrice: newBuyPrice,
        currentPrice: newBuyPrice,
        buyDate: '2024-01-15',
        categoryOrSector: 'Equity',
      });
      setHoldings(updated);
      setIsAddHoldingOpen(false);
      toast.success('New holding added to portfolio!');
    } catch {
      toast.error('Could not save holding. Check values.');
    }
  };

  const handleAddSipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = newSipFundName.toLowerCase().replace(/\s+/g, '-');
      const updated = await addTrackedSIP({
        fundCode: code,
        fundName: newSipFundName,
        amount: newSipAmount,
        frequency: 'Monthly',
        startDate: '2023-01-10',
      });
      setSips(updated);
      setIsAddSipOpen(false);
      toast.success('SIP tracker initiated!');
    } catch {
      toast.error('Failed to start tracking SIP.');
    }
  };

  const watchlistQuotes = useMemo(() => {
    return quotes.filter((q) => watchlistSymbols.includes(q.symbol));
  }, [quotes, watchlistSymbols]);

  if (loading && holdings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#5B6572]">Loading your portfolio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E5DF]">
        <SectionHeader
          eyebrow="WEALTH TRACKER"
          title="Portfolio & Active Holdings"
          subtitle="Real-time profit & loss tracking across your stocks, mutual funds, and ongoing SIPs."
        />

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 flex items-center gap-1.5 shadow-md shadow-emerald-900/20 min-h-[44px] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Audit Dossier (PDF)</span>
          </button>

          <button
            onClick={() => setIsAddHoldingOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] flex items-center gap-1.5 shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holding</span>
          </button>

          <button
            onClick={() => setIsAddSipOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#0B1220] bg-white border border-[#E7E5DF] hover:bg-black/5 flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#0F766E]" />
            <span>Track New SIP</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <PortfolioSummaryCards
        totalInvested={summary.totalInvested}
        totalCurrent={summary.totalCurrent}
        totalGain={summary.totalGain}
        gainPercent={summary.gainPercent}
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs max-w-md">
        {[
          { id: 'holdings', label: `Holdings (${holdings.length})` },
          { id: 'sips', label: `Tracked SIPs (${sips.length})` },
          { id: 'watchlist', label: `Watchlist (${watchlistSymbols.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as PortfolioTab)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-[#0F766E] text-white shadow-sm'
                : 'text-[#5B6572] hover:text-[#0B1220]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'holdings' && (
        <HoldingsTab
          holdings={holdings}
          assetPieData={assetPieData}
          onDeleteHolding={handleDeleteHolding}
        />
      )}

      {activeTab === 'sips' && <SipsTab sips={sips} />}

      {activeTab === 'watchlist' && (
        <WatchlistTab
          watchlistQuotes={watchlistQuotes}
          onToggleWatch={handleToggleWatch}
        />
      )}

      {/* Modals */}
      <AddHoldingModal
        isOpen={isAddHoldingOpen}
        onClose={() => setIsAddHoldingOpen(false)}
        newHoldingType={newHoldingType}
        setNewHoldingType={setNewHoldingType}
        newName={newName}
        setNewName={setNewName}
        setNewSymbolOrCode={setNewSymbolOrCode}
        newQuantity={newQuantity}
        setNewQuantity={setNewQuantity}
        newBuyPrice={newBuyPrice}
        setNewBuyPrice={setNewBuyPrice}
        onSubmit={handleAddHoldingSubmit}
      />

      <AddSipModal
        isOpen={isAddSipOpen}
        onClose={() => setIsAddSipOpen(false)}
        newSipFundName={newSipFundName}
        setNewSipFundName={setNewSipFundName}
        newSipAmount={newSipAmount}
        setNewSipAmount={setNewSipAmount}
        newSipDate={newSipDate}
        setNewSipDate={setNewSipDate}
        onSubmit={handleAddSipSubmit}
      />

      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};

export default Portfolio;
