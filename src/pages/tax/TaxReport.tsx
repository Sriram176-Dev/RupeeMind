import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { getCapitalGainsReportApi, downloadCapitalGainsCsv } from '../../services/taxService';
import type { TaxReportResponse } from '../../types';

export const TaxReport: React.FC = () => {
  const [data, setData] = useState<TaxReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'harvesting' | 'realized' | 'unrealized'>('harvesting');

  const loadReport = async (fy?: string) => {
    try {
      setLoading(true);
      const res = await getCapitalGainsReportApi(fy);
      setData(res);
      if (!selectedFY) {
        setSelectedFY(res.selectedFinancialYear);
      }
    } catch (err) {
      console.error('Failed to load tax report:', err);
      toast.error('Unable to compute capital gains tax report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleFyChange = (fy: string) => {
    setSelectedFY(fy);
    loadReport(fy);
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloading(true);
      await downloadCapitalGainsCsv(selectedFY);
      toast.success('Capital gains CSV downloaded successfully');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  const formatInr = (val: number) => {
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonLoader variant="rect" height={100} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonLoader variant="rect" height={120} />
          <SkeletonLoader variant="rect" height={120} />
          <SkeletonLoader variant="rect" height={120} />
          <SkeletonLoader variant="rect" height={120} />
        </div>
        <SkeletonLoader variant="rect" height={350} />
      </div>
    );
  }

  const fySummary = data?.selectedFySummary;
  const harvesting = data?.harvestingSuggestions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <SectionHeader
          title="Capital Gains & Tax Harvesting"
          subtitle="FIFO tax lot matching, STCG/LTCG breakdown, and Section 112A exemption harvesting."
        />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 shadow-xs">
            <Calendar className="w-4 h-4 text-stone-500" />
            <select
              value={selectedFY}
              onChange={(e) => handleFyChange(e.target.value)}
              className="text-sm font-medium text-stone-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {data?.availableFinancialYears.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Educational Disclaimer Banner */}
      <DisclaimerBanner
        type="warning"
        customText="Educational use only. Not SEBI-registered investment advice or certified tax filing advice. Calculations follow the Finance (No. 2) Act 2024 provisions."
      />

      {/* Statutory Regulatory Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Income Tax Act Notice (Finance Act 2024 Regime):</span> Equity STCG is computed at 20% (Sec 111A) and LTCG at 12.5% (Sec 112A) above the ₹1.25 Lakh annual threshold. Specified debt mutual funds are taxed at slab rates. This report is for educational estimation; verify with a qualified Chartered Accountant before filing your ITR.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Equity STCG (Realized)</div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
            {formatInr(fySummary?.equityStcg || 0)}
          </div>
          <div className="mt-1 text-xs text-stone-500 flex items-center justify-between">
            <span>Tax Rate: 20%</span>
            <span>Est: {formatInr((fySummary?.equityStcg || 0) * 0.204)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Equity LTCG (Realized)</div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
            {formatInr(fySummary?.equityLtcg || 0)}
          </div>
          <div className="mt-1 text-xs text-stone-500 flex items-center justify-between">
            <span>Taxable: {formatInr(fySummary?.equityLtcgTaxable || 0)}</span>
            <span>Exempt: {formatInr(fySummary?.equityLtcgExemptionUsed || 0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">₹1.25L LTCG Exemption</div>
          <div className="mt-2 text-2xl font-serif font-bold text-teal-700">
            {formatInr(harvesting?.remainingExemption || 0)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Remaining unutilized limit for {selectedFY}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Est. Tax Liability</div>
          <div className="mt-2 text-2xl font-serif font-bold text-amber-700">
            {formatInr(fySummary?.totalEstimatedTax || 0)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Includes 4% Health & Education Cess
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('harvesting')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'harvesting'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            LTCG Tax Harvesting ({harvesting?.opportunities.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('realized')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'realized'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Realized Tax Lots ({data?.realizedLots.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('unrealized')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'unrealized'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Unrealized Portfolio Gains ({data?.unrealizedLots.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab 1: Tax Harvesting */}
      {activeTab === 'harvesting' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-base">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                Harvest Up to {formatInr(harvesting?.remainingExemption || 0)} Tax-Free
              </div>
              <p className="text-sm text-emerald-800 mt-1 max-w-2xl">
                Under Section 112A, long-term capital gains on equity up to ₹1.25 Lakh per financial year are completely tax-exempt. Selling and immediately repurchasing these eligible holdings will reset your acquisition cost higher without paying tax.
              </p>
            </div>
            <div className="text-right shrink-0 bg-white border border-emerald-300 rounded-lg p-4 shadow-2xs">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Potential Tax Saved</div>
              <div className="text-2xl font-serif font-bold text-emerald-700">
                {formatInr(harvesting?.totalTaxSavable || 0)}
              </div>
            </div>
          </div>

          {harvesting?.opportunities && harvesting.opportunities.length > 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600">
                Recommended Units to Sell Before March 31
              </div>
              <div className="divide-y divide-stone-200">
                {harvesting.opportunities.map((opp, idx) => (
                  <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/60 transition">
                    <div className="space-y-1">
                      <div className="font-medium text-stone-900 text-sm flex items-center gap-2">
                        {opp.name}
                        {opp.symbolOrCode && (
                          <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            {opp.symbolOrCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600">{opp.rationale}</p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 text-right">
                      <div>
                        <div className="text-xs text-stone-500">Units to Sell</div>
                        <div className="font-mono text-sm font-semibold text-stone-800">
                          {opp.unitsToSell.toFixed(3)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-stone-500">Sale Value</div>
                        <div className="text-sm font-semibold text-stone-900">
                          {formatInr(opp.saleValue)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-stone-500">Tax Saved</div>
                        <div className="text-sm font-bold text-emerald-700">
                          {formatInr(opp.estimatedTaxSaved)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
              <HelpCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No Tax Harvesting Opportunities Available</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
                Either you have already consumed your full ₹1.25L LTCG exemption for {selectedFY}, or you do not currently hold any unrealized equity positions older than 12 months with capital gains.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Realized Lots */}
      {activeTab === 'realized' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          {data?.realizedLots && data.realizedLots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Security</th>
                    <th className="py-3 px-4">Asset Class</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Buy Date</th>
                    <th className="py-3 px-4">Sell Date</th>
                    <th className="py-3 px-4 text-right">Units</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Proceeds</th>
                    <th className="py-3 px-4 text-right">Gain / Loss</th>
                    <th className="py-3 px-4 text-right">Est. Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800 font-normal">
                  {data.realizedLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4 font-medium text-stone-900">{lot.name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-stone-600">{lot.assetClass}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            lot.gainType === 'LTCG'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {lot.gainType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600">
                        {new Date(lot.buyDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600">
                        {new Date(lot.sellDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">{lot.units.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{formatInr(lot.buyCost)}</td>
                      <td className="py-3 px-4 text-right">{formatInr(lot.sellProceeds)}</td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          lot.gain >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatInr(lot.gain)}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-900 font-mono text-xs">
                        {formatInr(lot.estimatedTax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No Realized Trades in {selectedFY}</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                You did not record any redemption or sale transactions during this financial year.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Unrealized Lots */}
      {activeTab === 'unrealized' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          {data?.unrealizedLots && data.unrealizedLots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Security</th>
                    <th className="py-3 px-4">Asset Class</th>
                    <th className="py-3 px-4">Holding Status</th>
                    <th className="py-3 px-4">Acquired</th>
                    <th className="py-3 px-4 text-right">Units</th>
                    <th className="py-3 px-4 text-right">Invested</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Unrealized Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800 font-normal">
                  {data.unrealizedLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4 font-medium text-stone-900">{lot.name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-stone-600">{lot.assetClass}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            lot.gainType === 'LTCG'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {lot.gainType} ({Math.round(lot.holdingDays)}d)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600">
                        {new Date(lot.buyDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">{lot.units.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{formatInr(lot.buyCost)}</td>
                      <td className="py-3 px-4 text-right">{formatInr(lot.currentValue)}</td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          lot.gain >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatInr(lot.gain)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <TrendingUp className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No Active Unrealized Holdings</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                Add holdings or import statements to evaluate unrealized gains.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxReport;
