'use client';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio, savePortfolio, exportPortfolio, importPortfolio } from '@/lib/storage';
import { Portfolio, RiskMode } from '@/lib/types';

export default function SettingsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);

  const handleSave = () => {
    if (portfolio) {
      savePortfolio(portfolio);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleReset = () => {
    if (confirm('Reset portfolio to default data? This cannot be undone.')) {
      localStorage.removeItem('ccrs_portfolio');
      setPortfolio(loadPortfolio());
    }
  };

  if (!portfolio) return <div className="text-zinc-500 p-8">Loading...</div>;

  const riskModes: { mode: RiskMode; label: string; desc: string }[] = [
    { mode: 'conservative', label: 'Conservative', desc: 'Smaller DCA stages, more hedging, less risk' },
    { mode: 'balanced', label: 'Balanced', desc: 'Moderate exposure, standard recovery approach' },
    { mode: 'aggressive', label: 'Aggressive', desc: 'Larger positions, less hedging, higher risk/reward' },
  ];

  return (
    <>
      <Header title="Settings" subtitle="Configure your portfolio preferences" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Risk Tolerance</h2>
            <div className="space-y-2">
              {riskModes.map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => setPortfolio((p) => p ? { ...p, riskMode: mode } : p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    portfolio.riskMode === mode
                      ? 'bg-orange-500/15 border-orange-500/30'
                      : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    portfolio.riskMode === mode ? 'border-orange-400 bg-orange-400' : 'border-zinc-600'
                  }`}>
                    {portfolio.riskMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${portfolio.riskMode === mode ? 'text-orange-300' : 'text-zinc-300'}`}>{label}</div>
                    <div className="text-xs text-zinc-500">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Data Management</h2>
            <div className="space-y-2">
              <button onClick={() => exportPortfolio(portfolio)} className="w-full py-2.5 glass-dark rounded-xl text-sm text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors">
                Export Portfolio JSON
              </button>
              <label className="w-full py-2.5 glass-dark rounded-xl text-sm text-zinc-300 hover:text-white border border-zinc-700/50 cursor-pointer block text-center transition-colors">
                Import Portfolio JSON
                <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try { setPortfolio(await importPortfolio(file)); }
                  catch { alert('Invalid file'); }
                }} />
              </label>
              <button onClick={handleReset} className="w-full py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/5 transition-colors">
                Reset to Default Data
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-4">About</h2>
            <div className="space-y-3 text-xs text-zinc-400">
              <p><span className="text-white font-medium">Crypto Capital Recovery System</span> — A structured, rule-based tool for managing crypto positions and planning recovery strategies.</p>
              <p>All calculations run locally in your browser. No data is sent to any server. Prices are fetched from CoinGecko&apos;s public API.</p>
              <p className="text-zinc-600">⚠️ This is an educational tool only. Not financial advice. Always do your own research before making investment decisions.</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Support the Project</h2>
            <p className="text-xs text-zinc-400 mb-4">If this tool helped you manage your crypto journey, consider supporting its development.</p>
            <div className="p-4 glass-dark rounded-xl text-center">
              <p className="text-xs text-zinc-500 mb-2">If this tool helped you, feel free to support ❤️</p>
              <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 to-rose-600/30 border border-pink-500/30 text-pink-300 text-sm font-medium hover:from-pink-600/40 hover:to-rose-600/40 transition-all">
                ❤️ Donate
              </button>
            </div>
          </GlassCard>

          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500'
            }`}
          >
            {saved ? <><Check size={14} /> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  );
}
