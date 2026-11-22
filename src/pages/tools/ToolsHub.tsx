import React from 'react';
import { Calculators } from './Calculators';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const ToolsHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sub-header banner with transparency link */}
      <div className="bg-white border-b border-slate-200/90 py-2.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-emerald-700 font-semibold uppercase tracking-wider text-[11px]">
            Financial Compounding Engine
          </span>
          <Link
            to="/model-transparency"
            className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Model Governance & Transparency</span>
            <span className="sm:hidden">Model Audit</span>
          </Link>
        </div>
      </div>

      <Calculators />
    </div>
  );
};

export default ToolsHub;
