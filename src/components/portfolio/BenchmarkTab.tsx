import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { getBenchmarkComparisonApi } from "../../services/api";
import type { BenchmarkComparisonResponse } from "../../types";
import { formatINR, formatPercent } from "../../lib/utils";
import {
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  RefreshCw,
  UploadCloud,
  Info,
} from "lucide-react";

export const BenchmarkTab: React.FC = () => {
  const [data, setData] = useState<BenchmarkComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBenchmark = async () => {
    try {
      setLoading(true);
      const res = await getBenchmarkComparisonApi();
      setData(res);
    } catch (err) {
      console.error("Failed to load benchmark comparison", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmark();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[350px] flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">
          Simulating NIFTY 50 cash-flow benchmark comparison…
        </p>
      </div>
    );
  }

  if (!data || !data.hasData || data.growthCurve.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
          <Scale className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            No Portfolio Cash Flows Found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Import your CAS statement or add holdings to compare your historical annualized XIRR and growth trajectory directly against NIFTY 50.
          </p>
        </div>
        <Link
          to="/portfolio/import"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <UploadCloud className="w-4 h-4" />
          Import Portfolio Statement
        </Link>
      </div>
    );
  }

  const isAlphaPositive = (data.alpha ?? 0) >= 0;
  const portfolioGain = data.totalGain;
  const niftyGain = data.niftyGain;

  return (
    <div className="space-y-6">
      
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Portfolio XIRR */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Portfolio XIRR</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">
            {data.portfolioXirr !== null ? formatPercent(data.portfolioXirr) : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Gain: <span className="font-semibold text-slate-900">{formatINR(portfolioGain)}</span>
          </p>
        </div>

        {/* NIFTY 50 Benchmark XIRR */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>NIFTY 50 Simulated XIRR</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono tracking-tight">
            {data.niftyXirr !== null ? formatPercent(data.niftyXirr) : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Gain: <span className="font-semibold text-slate-900">{formatINR(niftyGain)}</span>
          </p>
        </div>

        {/* Alpha (Outperformance) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Generated Alpha</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono tracking-tight flex items-center gap-1 ${
              isAlphaPositive ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {isAlphaPositive ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            )}
            {data.alpha !== null ? `${data.alpha > 0 ? "+" : ""}${data.alpha.toFixed(2)}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isAlphaPositive
              ? "Outperforming NIFTY 50 benchmark"
              : "Lagging NIFTY 50 benchmark"}
          </p>
        </div>

        {/* Total Capital Deployed */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Invested Capital</span>
            <span className="text-[10px] font-mono text-slate-400">Cash Basis</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatINR(data.totalInvested)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Current: <span className="font-semibold text-slate-900">{formatINR(data.portfolioCurrentValue)}</span>
          </p>
        </div>
      </div>

      {/* Recharts Growth Trajectory Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Portfolio vs NIFTY 50 Growth Curve
            </h3>
            <p className="text-xs text-slate-500">
              Simulates investing identical rupee cash flows into NIFTY 50 on the exact dates money was deployed.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Your Portfolio
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              NIFTY 50
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-300" />
              Invested Capital
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.growthCurve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => formatINR(Number(val) || 0)}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                fill="none"
                name="Invested Principal"
              />
              <Area
                type="monotone"
                dataKey="niftyValue"
                stroke="#4F46E5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#niftyGrad)"
                name="NIFTY 50 Equivalent"
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#portfolioGrad)"
                name="Portfolio Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fiduciary Explanatory Footer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-800">Fiduciary Cash-Flow Benchmark Methodology: </span>
            Unlike static index returns, this analysis models your real historical cash flows. When you deployed money into your portfolio, the simulation purchased an identical rupee amount of NIFTY 50 units at that day's closing NAV, accurately computing real-world alpha.
          </p>
        </div>
      </div>
    </div>
  );
};
