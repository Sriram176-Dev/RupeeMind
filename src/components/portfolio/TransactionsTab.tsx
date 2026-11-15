import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTransactionsApi, deleteTransactionApi } from "../../services/api";
import type { Transaction, TransactionType } from "../../types";
import { formatINR, formatNumber } from "../../lib/utils";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

export const TransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactionsApi();
      setTransactions(res);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete transaction for ${name}? Linked holding will be recomputed.`)) {
      return;
    }
    try {
      await deleteTransactionApi(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted successfully");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== "ALL" && t.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.schemeName.toLowerCase().includes(q) ||
        (t.folio && t.folio.toLowerCase().includes(q)) ||
        (t.schemeCode && t.schemeCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalInvested = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalRedeemed = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            No Historical Transactions Recorded
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Import your CAS PDF or broker CSV statement to unlock transaction-level cost basis, FIFO tax lots, and precise XIRR.
          </p>
        </div>
        <Link
          to="/portfolio/import"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <UploadCloud className="w-4 h-4" />
          Import Statement Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Ledger Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Trade Entries
          </p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {transactions.length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Total Purchases / SIPs
          </p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatINR(totalInvested)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Total Redemptions / Exits
          </p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatINR(totalRedeemed)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by scheme or folio…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Type:
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SIP">SIP</option>
            <option value="REDEMPTION">Redemption</option>
            <option value="SWITCH_IN">Switch In</option>
            <option value="SWITCH_OUT">Switch Out</option>
            <option value="DIVIDEND_REINVESTMENT">Dividend Reinvest</option>
          </select>

          <Link
            to="/portfolio/import"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            Import More
          </Link>
        </div>
      </div>

      {/* Transactions Table */}
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
                <th className="py-3 px-4 text-center">Source</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isRedemption = item.type === "REDEMPTION" || item.type === "SWITCH_OUT";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(item.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRedemption
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : item.type === "SIP"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {item.folio || "—"}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={item.schemeName}>
                        {item.schemeName}
                      </div>
                      {item.schemeCode && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.schemeCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {formatNumber(Math.abs(item.units))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold ${
                        isRedemption ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {isRedemption ? "+" : "-"}
                      {formatINR(Math.abs(item.amount))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.source.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.schemeName)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
