'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, Coffee } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio, savePortfolio, exportPortfolio, importPortfolio, loadPrefs, savePrefs } from '@/lib/storage';
import { Portfolio, Prefs } from '@/lib/types';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: enabled ? '#f97316' : 'var(--border-strong)' }}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prefs, setPrefs]         = useState<Prefs>({ show24hChange: true, showScenarioOutlook: true, showConcentrationRisk: true });
  const [saved, setSaved]         = useState(false);
  const isFirstRender             = useRef(true);
  const saveTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount
  useEffect(() => {
    setPortfolio(loadPortfolio());
    setPrefs(loadPrefs());
  }, []);

  // Auto-save prefs whenever they change (skip the initial load)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    savePrefs(prefs);
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 1800);
  }, [prefs]);

  // Auto-save portfolio whenever it changes
  useEffect(() => {
    if (portfolio) savePortfolio(portfolio);
  }, [portfolio]);

  const handleReset = () => {
    if (confirm('Reset portfolio to default data? This cannot be undone.')) {
      localStorage.removeItem('ccrs_portfolio');
      setPortfolio(loadPortfolio());
    }
  };

  const updatePref = <K extends keyof Prefs>(key: K, val: Prefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  return (
    <>
      <Header title="Settings" subtitle="Configure your experience" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">

          {/* Display preferences */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold t-1">Display Preferences</h2>
              {/* Auto-save indicator */}
              <span className={`flex items-center gap-1 text-[11px] font-medium text-emerald-500 transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}>
                <Check size={11} /> Saved
              </span>
            </div>
            <p className="text-xs t-3 mb-4">Changes save automatically</p>
            <div className="space-y-1">
              {([
                { key: 'show24hChange', label: '24h Price Change', desc: 'Show 24h % change in stats cards' },
              ] as { key: keyof Prefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-3 py-3 rounded-xl"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm font-medium t-1">{label}</div>
                    <div className="text-xs t-3 mt-0.5">{desc}</div>
                  </div>
                  <Toggle enabled={prefs[key] as boolean} onChange={(v) => updatePref(key, v as Prefs[typeof key])} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Data management */}
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
              <p className="text-sm t-2 leading-relaxed">
                <span className="t-1 font-semibold">Undo Loss</span> — A structured, rule-based tool for managing crypto positions and planning recovery strategies.
              </p>
              <p className="text-xs t-3 leading-relaxed">
                All calculations run locally in your browser. No data is sent to any server. Prices are fetched from CoinGecko&apos;s public API.
              </p>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Educational tool only. Not financial advice. Always do your own research before making investment decisions.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-1">Support the Project</h2>
            <p className="text-xs t-3 mb-4 leading-relaxed">
              If this tool helped you manage your crypto journey, consider supporting its development.
            </p>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all
              bg-orange-500/10 border-orange-500/25 text-orange-500 hover:bg-orange-500/20">
              <Coffee size={14} />
              Buy Me a Coffee
            </button>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
