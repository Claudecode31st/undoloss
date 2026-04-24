'use client';
import { useState, useEffect } from 'react';
import { Check, Coffee } from 'lucide-react';
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

  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const riskModes: { mode: RiskMode; label: string; desc: string }[] = [
    { mode: 'conservative', label: 'Conservative', desc: 'Smaller DCA stages, more hedging, less risk' },
    { mode: 'balanced', label: 'Balanced', desc: 'Moderate exposure, standard recovery approach' },
    { mode: 'aggressive', label: 'Aggressive', desc: 'Larger positions, less hedging, higher risk/reward' },
  ];

  return (
    <>
      <Header title="Settings" subtitle="Configure your portfolio preferences" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-3">Risk Tolerance</h2>
            <div className="space-y-2">
              {riskModes.map(({ mode, label, desc }) => {
                const active = portfolio.riskMode === mode;
                return (
                  <button key={mode} onClick={() => setPortfolio((p) => p ? { ...p, riskMode: mode } : p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      active ? 'bg-orange-500/15 border-orange-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    style={!active ? { borderColor: 'var(--border)' } : undefined}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      active ? 'border-orange-400 bg-orange-400' : ''
                    }`} style={!active ? { borderColor: 'var(--border-strong)' } : undefined}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${active ? 'text-orange-500' : 't-1'}`}>{label}</div>
                      <div className="text-xs t-3 mt-0.5">{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-3">Data Management</h2>
            <div className="space-y-2">
              <button onClick={() => exportPortfolio(portfolio)}
                className="w-full py-3 glass-dark rounded-xl text-sm t-2 hover:t-1 transition-colors font-medium"
                style={{ border: '1px solid var(--border)' }}>
                Export Portfolio JSON
              </button>
              <label className="w-full py-3 glass-dark rounded-xl text-sm t-2 hover:t-1 cursor-pointer block text-center transition-colors font-medium"
                style={{ border: '1px solid var(--border)' }}>
                Import Portfolio JSON
                <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try { setPortfolio(await importPortfolio(file)); }
                  catch { alert('Invalid file'); }
                }} />
              </label>
              <button onClick={handleReset}
                className="w-full py-3 rounded-xl text-sm text-red-500 font-medium hover:bg-red-500/5 transition-colors"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                Reset to Default Data
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-3">About</h2>
            <div className="space-y-3">
              <p className="text-sm t-2 leading-relaxed"><span className="t-1 font-semibold">Undo Loss</span> — A structured, rule-based tool for managing crypto positions and planning recovery strategies.</p>
              <p className="text-xs t-3 leading-relaxed">All calculations run locally in your browser. No data is sent to any server. Prices are fetched from CoinGecko&apos;s public API.</p>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">Educational tool only. Not financial advice. Always do your own research before making investment decisions.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-1">Support the Project</h2>
            <p className="text-xs t-3 mb-4 leading-relaxed">If this tool helped you manage your crypto journey, consider supporting its development.</p>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all
              bg-orange-500/10 border-orange-500/25 text-orange-500 hover:bg-orange-500/20">
              <Coffee size={14} />
              Buy Me a Coffee
            </button>
          </GlassCard>

          <button onClick={handleSave}
            className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-600'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500'
            }`}>
            {saved ? <><Check size={14} /> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  );
}
