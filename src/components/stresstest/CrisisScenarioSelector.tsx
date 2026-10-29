import React, { useState } from 'react';
import type { StressScenario } from '../../types';
import { Flame, AlertOctagon, TrendingDown, Sliders, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  scenarios: StressScenario[];
  selectedScenarioId: string;
  customShock: number;
  onSelectScenario: (id: string) => void;
  onChangeCustomShock: (val: number) => void;
  onRunTest: () => void;
  loading: boolean;
}

export const CrisisScenarioSelector: React.FC<Props> = ({
  scenarios,
  selectedScenarioId,
  customShock,
  onSelectScenario,
  onChangeCustomShock,
  onRunTest,
  loading,
}) => {
  const [showCustomSlider, setShowCustomSlider] = useState(selectedScenarioId === 'CUSTOM');

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'COVID_2020':
        return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      case 'GFC_2008':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'RUSSIA_UKRAINE_2022':
        return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default:
        return <TrendingDown className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-100">Historical & Custom Stress Scenarios</h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate how your current portfolio assets hold up under severe macro shocks and liquidity freezes.
          </p>
        </div>

        <button
          onClick={onRunTest}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Simulating Shock...</span>
            </>
          ) : (
            <>
              <span>Execute Stress Test</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Preset Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {scenarios.map((sc) => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setShowCustomSlider(false);
                onSelectScenario(sc.id);
              }}
              className={`cursor-pointer rounded-xl p-4 border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getScenarioIcon(sc.id)}
                    <span className="text-xs font-mono font-medium text-slate-400">{sc.period}</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {sc.marketDropPercent}%
                  </span>
                </div>

                <h4 className="font-semibold text-slate-100 text-sm mb-1 line-clamp-1">{sc.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{sc.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Recovery: ~{sc.recoveryMonths} mos</span>
                <span className={`font-semibold ${isSelected ? 'text-rose-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Active Scenario' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Slider Trigger */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const next = !showCustomSlider;
              setShowCustomSlider(next);
              if (next) onSelectScenario('CUSTOM');
            }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              selectedScenarioId === 'CUSTOM' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{showCustomSlider ? 'Custom Shock Enabled' : 'Or simulate custom hypothetical shock (-50% to +50%)'}</span>
          </button>

          {selectedScenarioId === 'CUSTOM' && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Shock: {customShock > 0 ? `+${customShock}` : customShock}%
            </span>
          )}
        </div>

        {showCustomSlider && (
          <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span className="text-rose-400 font-bold">-50% (Extreme Crash)</span>
              <span className="text-slate-300 font-bold">
                Applied Market Shock: <span className={customShock < 0 ? 'text-rose-400' : 'text-emerald-400'}>{customShock}%</span>
              </span>
              <span className="text-emerald-400 font-bold">+50% (Parabolic Bull)</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={customShock}
              onChange={(e) => {
                onSelectScenario('CUSTOM');
                onChangeCustomShock(Number(e.target.value));
              }}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-2">
              Applies individual Beta-weighted sensitivities to each asset in your portfolio. A stock with β=1.4 moves 1.4x the market shock.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
