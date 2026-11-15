import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  parseImportFileApi,
  confirmImportApi,
  getFunds,
} from "../../services/api";
import type { ImportPreviewItem, MutualFund, TransactionType } from "../../types";
import { formatINR, formatNumber } from "../../lib/utils";
import { SectionHeader } from "../../components/ui/SectionHeader";
import {
  UploadCloud,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const PortfolioImport: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Preview state after parsing
  const [detectedType, setDetectedType] = useState<string>("");
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [allFunds, setAllFunds] = useState<MutualFund[]>([]);

  // Search filter inside preview
  const [previewFilter, setPreviewFilter] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [fundSearchQuery, setFundSearchQuery] = useState("");

  useEffect(() => {
    // Pre-fetch funds for quick inline fuzzy selection
    getFunds({ limit: 100 })
      .then((f) => setAllFunds(f))
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      // Auto-detect if PDF might be CAS
      if (selected.name.toLowerCase().endsWith(".pdf")) {
        setIsPasswordRequired(true);
      } else {
        setIsPasswordRequired(false);
      }
    }
  };

  const handleParse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) {
      toast.error("Please select a CAS PDF or Broker CSV file");
      return;
    }

    try {
      setParsing(true);
      const preview = await parseImportFileApi(file, password);
      setDetectedType(preview.detectedType);
      setPreviewItems(preview.transactions);
      toast.success(
        `Parsed ${preview.totalTransactions} transactions from ${preview.totalFolios} folios!`
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
      const code = errorObj?.response?.data?.code;
      const msg = errorObj?.response?.data?.message || errorObj?.message || "Failed to parse statement.";

      if (code === "PASSWORD_REQUIRED" || msg.includes("PASSWORD_REQUIRED")) {
        setIsPasswordRequired(true);
        toast.error("This CAS PDF is password-protected. Please enter the password below.");
      } else if (code === "INVALID_PASSWORD" || msg.includes("INVALID_PASSWORD")) {
        toast.error("Incorrect password. CAMS/KFintech passwords are typically your PAN in UPPERCASE or DOB.");
      } else {
        toast.error(msg);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setPreviewItems((prev) => prev.filter((_, idx) => idx !== index));
    toast.info("Transaction removed from preview");
  };

  const handleMapFund = (index: number, fund: MutualFund) => {
    setPreviewItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        schemeName: fund.name,
        schemeCode: fund.code || fund.schemeCode,
        unmatched: false,
      };
      return updated;
    });
    setEditingItemIndex(null);
    setFundSearchQuery("");
    toast.success(`Mapped to ${fund.name}`);
  };

  const handleTypeChange = (index: number, newType: TransactionType) => {
    setPreviewItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const isRedemption = newType === "REDEMPTION" || newType === "SWITCH_OUT";
      updated[index] = {
        ...item,
        type: newType,
        units: isRedemption ? -Math.abs(item.units) : Math.abs(item.units),
        amount: isRedemption ? Math.abs(item.amount) : -Math.abs(item.amount),
      };
      return updated;
    });
  };

  const handleConfirmImport = async () => {
    if (previewItems.length === 0) {
      toast.error("No transactions to import");
      return;
    }

    try {
      setConfirming(true);
      const res = await confirmImportApi(previewItems);
      toast.success(res.message || "Portfolio imported successfully!");
      navigate("/portfolio");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errorObj?.response?.data?.message || "Failed to commit transactions");
    } finally {
      setConfirming(false);
    }
  };

  const matchedCount = previewItems.filter((i) => !i.unmatched).length;
  const unmatchedCount = previewItems.filter((i) => i.unmatched).length;

  const filteredPreview = previewItems.filter((item) => {
    if (!previewFilter) return true;
    const q = previewFilter.toLowerCase();
    return (
      item.schemeName.toLowerCase().includes(q) ||
      (item.folio && item.folio.toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const searchedFunds = allFunds
    .filter((f) => {
      if (!fundSearchQuery) return true;
      const q = fundSearchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.fundHouse.toLowerCase().includes(q);
    })
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Back and Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portfolio
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Import Portfolio & Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload your CAMS or KFintech CAS PDF statement, or broker CSV tradebook to auto-track historical XIRR, CAGR, and holdings.
          </p>
        </div>

        {previewItems.length > 0 && (
          <button
            onClick={() => {
              setPreviewItems([]);
              setFile(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Upload Another File
          </button>
        )}
      </div>

      {/* Security Privacy Callout */}
      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold text-emerald-900">Zero Storage Security Guarantee: </span>
          Your PDF statements and passwords are processed strictly in-memory and deleted immediately after parsing. We never store passwords, unencrypted documents, or investor personal identifiers.
        </div>
      </div>

      {/* STEP 1: Upload Box (If no preview items loaded yet) */}
      {previewItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-emerald-700" />
                CAMS / KFintech CAS PDF
              </span>
              <p className="text-slate-500 leading-relaxed">
                Download a Consolidated Account Statement from CAMS or KFintech website. If password-protected, provide your PAN/DOB password.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-indigo-600" />
                Broker CSV Tradebook
              </span>
              <p className="text-slate-500 leading-relaxed">
                Export trades from Zerodha (Coin/Kite), Groww, Upstox, or Kuvera in CSV format with Date, Scheme/Symbol, Units, Price, and Amount.
              </p>
            </div>
          </div>

          <form onSubmit={handleParse} className="space-y-6">
            {/* File Dropzone */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-600/60 rounded-xl p-8 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {file ? file.name : "Click to select or drag & drop your statement"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports CAS PDF (CAMS/KFintech) & Broker CSV (Max 15MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Password Field (Shown for PDFs or when required) */}
            {isPasswordRequired && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  PDF Statement Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your PAN (e.g. ABCDE1234F) or DOB as specified by AMC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Password is used strictly in-memory to decrypt text items and is never saved.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                to="/portfolio"
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!file || parsing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Parsing Statement In-Memory…
                  </>
                ) : (
                  <>
                    Parse & Review Transactions
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Interactive Preview & Review Table */}
      {previewItems.length > 0 && (
        <div className="space-y-6">
          
          {/* Summary Metric Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Format</p>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">
                {detectedType.replace('_', ' ')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Trades</p>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">
                {previewItems.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Auto-Matched
              </p>
              <p className="text-base font-bold text-emerald-700 mt-1 font-mono">
                {matchedCount}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Unmatched
              </p>
              <p className="text-base font-bold text-amber-700 mt-1 font-mono">
                {unmatchedCount}
              </p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={previewFilter}
                onChange={(e) => setPreviewFilter(e.target.value)}
                placeholder="Filter by scheme name or folio…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {unmatchedCount > 0 ? (
                  <span className="text-amber-700 font-semibold">
                    Review and map {unmatchedCount} unmatched schemes before confirmation
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    All schemes matched to RupeeMind fund catalog
                  </span>
                )}
              </span>

              <button
                onClick={handleConfirmImport}
                disabled={confirming}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs shrink-0"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating Portfolio…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Commit Portfolio ({previewItems.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Scheme / Stock</th>
                    <th className="py-3 px-4 text-right">Units</th>
                    <th className="py-3 px-4 text-right">Price (NAV)</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.type}
                          onChange={(e) => handleTypeChange(idx, e.target.value as TransactionType)}
                          className="px-2 py-1 rounded border border-slate-200 bg-white font-semibold text-[11px] text-slate-700 focus:outline-none"
                        >
                          <option value="PURCHASE">PURCHASE</option>
                          <option value="SIP">SIP</option>
                          <option value="REDEMPTION">REDEMPTION</option>
                          <option value="SWITCH_IN">SWITCH IN</option>
                          <option value="SWITCH_OUT">SWITCH OUT</option>
                          <option value="DIVIDEND_REINVESTMENT">DIVIDEND</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {item.folio || "—"}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={item.schemeName}>
                          {item.schemeName}
                        </div>
                        {item.schemeCode && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {item.schemeCode}
                          </span>
                        )}
                        
                        {/* Inline Resolver if unmatched or user clicked Edit */}
                        {editingItemIndex === idx && (
                          <div className="mt-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200 space-y-2">
                            <p className="text-[11px] font-semibold text-amber-900">
                              Map to catalog fund:
                            </p>
                            <input
                              type="text"
                              value={fundSearchQuery}
                              onChange={(e) => setFundSearchQuery(e.target.value)}
                              placeholder="Search mutual fund name…"
                              className="w-full px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white"
                            />
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                              {searchedFunds.map((fund) => (
                                <button
                                  key={fund.code || fund.schemeCode}
                                  type="button"
                                  onClick={() => handleMapFund(idx, fund)}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-white text-[11px] text-slate-800 truncate"
                                >
                                  {fund.name}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingItemIndex(null)}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 underline"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                        {formatNumber(Math.abs(item.units))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatINR(Math.abs(item.amount))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.unmatched ? (
                          <button
                            type="button"
                            onClick={() => setEditingItemIndex(idx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Unmatched (Fix)
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Matched
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
