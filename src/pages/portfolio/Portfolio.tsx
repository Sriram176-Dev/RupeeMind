import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getHoldings,
  addHolding,
  deleteHolding,
  getTrackedSIPs,
  addTrackedSIP,
  getWatchlist,
  toggleWatchlist,
  getQuotes,
  getPerformanceWithXirrApi,
} from '../../services/api';
import type { Holding, TrackedSIP, StockQuote, PerformanceSummary } from '../../types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Plus, FileText, UploadCloud, Scale, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  PortfolioSummaryCards,
  HoldingsTab,
  SipsTab,
  WatchlistTab,
  AddHoldingModal,
  AddSipModal,
  BenchmarkTab,
  TransactionsTab,
} from '../../components/portfolio';
import { AuditReportModal } from '../../components/reports';

type PortfolioTab = 'holdings' | 'benchmark' | 'transactions' | 'sips' | 'watchlist';

export const Portfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('holdings');

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
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
      const [perf, s, w, q] = await Promise.all([
        getPerformanceWithXirrApi().catch(() => null),
        getTrackedSIPs(),
        getWatchlist(),
        getQuotes(),
      ]);

      if (perf && perf.holdings && perf.holdings.length > 0) {
        setHoldings(perf.holdings);
        setPerformanceSummary(perf.summary);
      } else {
        const rawHoldings = await getHoldings();
        setHoldings(rawHoldings);
      }

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
    if (performanceSummary && performanceSummary.totalInvested > 0) {
      return {
        totalInvested: performanceSummary.totalInvested,
        totalCurrent: performanceSummary.totalCurrentValue,
        totalGain: performanceSummary.totalGain,
        gainPercent: performanceSummary.absoluteReturn,
        xirr: performanceSummary.xirr,
        cagr: performanceSummary.cagr,
      };
    }

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
      xirr: null,
      cagr: null,
    };
  }, [holdings, performanceSummary]);

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
      // Reload enriched performance
      loadData();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <SectionHeader
          eyebrow="WEALTH TRACKER"
          title="Portfolio & Active Holdings"
          subtitle="Real-time profit & loss, cash-flow weighted XIRR, and NIFTY 50 benchmark tracking."
        />

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link
            to="/portfolio/import"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-emerald-200" />
            <span>Import Statement (CAS / CSV)</span>
          </Link>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Audit Dossier</span>
          </button>

          <button
            onClick={() => setIsAddHoldingOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Holding</span>
          </button>

          <button
            onClick={() => setIsAddSipOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
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
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
        {[
          { id: 'holdings', label: `Holdings (${holdings.length})` },
          { id: 'benchmark', label: 'Benchmark vs NIFTY 50' },
          { id: 'transactions', label: 'Transactions Ledger' },
          { id: 'sips', label: `Tracked SIPs (${sips.length})` },
          { id: 'watchlist', label: `Watchlist (${watchlistSymbols.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as PortfolioTab)}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-white text-emerald-800 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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

      {activeTab === 'benchmark' && <BenchmarkTab />}

      {activeTab === 'transactions' && <TransactionsTab />}

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




