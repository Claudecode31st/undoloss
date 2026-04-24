'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight, Undo2, TrendingUp, Shield, Target, BarChart3, Brain, Zap,
  CheckCircle, ChevronDown, ArrowUpRight, RotateCcw, DollarSign,
  AlertTriangle, TrendingDown, Minus, Lock, RefreshCw, Cpu,
  ArrowDownRight, ShieldOff, ArrowLeftRight, Activity
} from 'lucide-react';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60 text-xs font-medium text-zinc-400 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      {children}
    </div>
  );
}

function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

/* ── data ─────────────────────────────────────────────────── */
const features = [
  { icon: DollarSign, title: 'Live PnL Tracking', desc: 'Real-time unrealized P/L, exact breakeven levels, and weighted average entry per position.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: TrendingUp, title: 'DCA Recovery Engine', desc: 'Stage-by-stage averaging at −10/20/30% from current — triggered only when risk is acceptable.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Shield, title: 'Delta-Neutral Hedging', desc: 'Simulate 25%, 50%, or 100% hedge ratios to reduce directional exposure and protect capital.', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { icon: BarChart3, title: 'Risk Score 0–100', desc: 'Portfolio-wide score combining drawdown depth, asset concentration, and position count.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { icon: Zap, title: 'Scenario Simulator', desc: 'Model bull, sideways, and bear outcomes. See recovery timeline and required move per scenario.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: Brain, title: 'Behavioural Guard', desc: 'Detects panic selling, overtrading, and aggressive averaging tendencies — warns before you act.', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
];

const strategies = [
  {
    icon: TrendingUp,
    name: 'DCA Recovery',
    tag: 'For long-term holders',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    when: 'Portfolio down 15–40%. You believe in the asset long-term.',
    how: 'The system calculates 3 staged buy zones at –10%, –20%, –30% (or wider in aggressive mode). You only add if risk score allows.',
    steps: [
      'Stage 1 triggers at −10–20% from current price',
      'Stage 2 only fires if Stage 1 was already executed',
      'Pauses automatically if risk score exceeds 65/100',
    ],
    riskLevel: 'Conservative – Balanced',
    riskColor: 'text-emerald-400',
  },
  {
    icon: Target,
    name: 'Break-even Planning',
    tag: 'For patient holders',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    when: 'Portfolio slightly underwater. Goal is to exit at cost basis, not profit.',
    how: 'Calculates the exact % gain needed to recover. Adds a 25% hedge to limit further losses while waiting.',
    steps: [
      'Shows exact price target to break even on full portfolio',
      'Applies 25% hedge to reduce downside exposure',
      'Sets a mid-point price alert at 50% of required move',
    ],
    riskLevel: 'Low Risk',
    riskColor: 'text-blue-400',
  },
  {
    icon: ShieldOff,
    name: 'Risk Reduction',
    tag: 'For overexposed holders',
    tagColor: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
    when: 'Concentration risk is High. Top 2 assets exceed 80% of portfolio.',
    how: 'Identifies your largest position and recommends trimming 20% to reduce concentration without full exit.',
    steps: [
      'Trims the top position by 20% to free capital',
      'Keeps the remaining 80% for recovery upside',
      'Flags if concentration stays above 60% after trim',
    ],
    riskLevel: 'Defensive',
    riskColor: 'text-orange-400',
  },
  {
    icon: ArrowLeftRight,
    name: 'Swing Re-entry',
    tag: 'For active traders',
    tagColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    when: 'Market is range-bound. Asset bounces between clear support and resistance.',
    how: 'Sell 15% near resistance (+10%), rebuy at support (−15% from sell), improving your average entry over time.',
    steps: [
      'Hold until price reaches +10% swing high target',
      'Scale out 15% at resistance to lock in partial recovery',
      'Re-enter at −15% from sell price to improve average',
    ],
    riskLevel: 'Moderate',
    riskColor: 'text-purple-400',
  },
  {
    icon: Shield,
    name: 'Delta-Neutral Hedging',
    tag: 'For advanced holders',
    tagColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    color: 'text-indigo-400',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/5',
    when: 'High volatility or uncertain direction. You want to preserve capital value regardless of price.',
    how: 'Set a hedge ratio (25–100%) to neutralise directional exposure. The slider adjusts how much of your portfolio is protected.',
    steps: [
      'Set hedge ratio — 50% is commonly balanced',
      'Activates Portfolio Freeze Zone to pause new buys',
      'Rebalance every 7 days as portfolio value shifts',
    ],
    riskLevel: 'Low – Moderate',
    riskColor: 'text-indigo-400',
  },
];

const steps = [
  { n: '01', title: 'Add your positions', desc: 'Enter your crypto holdings, entry prices, and amounts. Live prices auto-fetch from CoinGecko in real time.' },
  { n: '02', title: 'Check your risk score', desc: 'The system scores your portfolio 0–100 based on drawdown, concentration, and diversification. Understand your exposure before acting.' },
  { n: '03', title: 'Pick a strategy', desc: 'Choose DCA, Break-even, Risk Reduction, Swing, or Delta-Neutral. The system generates your next 3 concrete actions with real price targets.' },
];

const trustItems = [
  { icon: Lock, label: '100% Private', sub: 'Data never leaves your browser' },
  { icon: RefreshCw, label: 'Real-time Prices', sub: 'Auto-fetched from CoinGecko' },
  { icon: Cpu, label: 'No Backend', sub: 'Pure client-side calculations' },
  { icon: CheckCircle, label: 'Free Forever', sub: 'No account, no subscription' },
];

const quotes = [
  { text: '"The most important thing is to control the downside. The upside takes care of itself."', author: 'Risk Management Principle' },
  { text: '"Do not focus on making money; focus on protecting what you have."', author: 'Paul Tudor Jones' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-zinc-800/60' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <Undo2 size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-base">Undo Loss</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#strategies" className="hover:text-white transition-colors">Strategies</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-all duration-200">
            Launch App <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-zinc-800/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <Badge><RotateCcw size={11} className="text-orange-400" /> Crypto Recovery System</Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Stop Losing.</span><br />
            <span style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 50%, #52525b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Start Recovering.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A structured, discipline-first recovery tool for crypto portfolios.
            Track PnL, plan DCA, hedge risk, simulate scenarios — all in your browser.
            <span className="text-zinc-500"> No sign-up. No data sent anywhere.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
              Launch App Free <ArrowRight size={15} />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-700/60 text-zinc-300 font-medium text-sm hover:border-zinc-500 hover:text-white transition-all duration-200">
              See How It Works <ChevronDown size={15} />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { val: 5, suffix: '', label: 'Recovery Strategies' },
              { val: 100, suffix: '%', label: 'Client-side' },
              { val: 0, suffix: '', label: 'Account Required' },
              { val: 12, suffix: '+', label: 'Coins Supported' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
                <span className="text-2xl font-black text-white"><Counter to={s.val} suffix={s.suffix} /></span>
                <span className="text-[11px] text-zinc-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-zinc-800/50 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-zinc-300" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-[11px] text-zinc-500">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Everything you need to<br />
              <span className="text-zinc-500">recover with discipline.</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm">Built on pure math, not emotions. Every feature is designed to help you make structured decisions, not impulsive ones.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Guide — detailed section */}
      <section id="strategies" className="py-24 px-6 bg-zinc-950/40 border-y border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Strategy Guide</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              5 strategies. One for<br />
              <span className="text-zinc-500">every situation.</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm">
              Each strategy is designed for a specific market condition and risk profile. Choose the one that matches your situation — the app generates your exact action plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {strategies.map(({ icon: Icon, name, tag, tagColor, color, border, bg, when, how, steps: stps, riskLevel, riskColor }) => (
              <div key={name} className={`flex flex-col p-6 rounded-2xl border ${border} ${bg} hover:brightness-110 transition-all duration-200`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className={color} />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">{name}</h3>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${tagColor}`}>{tag}</span>
                </div>

                {/* When to use */}
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">When to use</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{when}</p>
                </div>

                {/* How it works */}
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">How it works</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{how}</p>
                </div>

                {/* Steps */}
                <div className="flex-1 mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">Key actions</div>
                  <ul className="space-y-1.5">
                    {stps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                        <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${bg} border ${border} ${color}`}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk level */}
                <div className="pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">Risk level</span>
                  <span className={`text-[11px] font-semibold ${riskColor}`}>{riskLevel}</span>
                </div>
              </div>
            ))}

            {/* CTA card */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 shadow-lg">
                <Undo2 size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Not sure which to pick?</h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">Open the app, add your positions, and check your risk score first. The score tells you which strategy fits your situation.</p>
              <Link href="/dashboard" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-colors">
                Start Here <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Three steps to a<br />
              <span className="text-zinc-500">structured recovery plan.</span>
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-[39px] top-12 bottom-12 w-px bg-gradient-to-b from-zinc-700 via-zinc-700/50 to-transparent hidden md:block" />
            <div className="space-y-6">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-20 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border border-zinc-700/60 bg-zinc-900 flex items-center justify-center text-sm font-black text-zinc-400 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-all duration-200 relative z-10">
                      {n}
                    </div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 group-hover:border-zinc-700/60 group-hover:bg-zinc-900/50 transition-all duration-200">
                      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="py-20 px-6 border-y border-zinc-800/40 bg-zinc-950/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {quotes.map((q) => (
            <div key={q.author} className="p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
              <p className="text-base text-zinc-300 leading-relaxed italic mb-4">{q.text}</p>
              <p className="text-xs text-zinc-600 font-medium">{q.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk score preview */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <SectionLabel>Risk Intelligence</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Know exactly how<br />
              <span className="text-zinc-500">much risk you&#39;re carrying.</span>
            </h2>
            <p className="text-zinc-500 mb-6 leading-relaxed text-sm">
              The portfolio risk score (0–100) combines three factors: drawdown severity, asset concentration, and diversification. When your score is high, the system warns you before you add more risk.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Drawdown Score', pct: 78, color: '#ef4444' },
                { label: 'Concentration Score', pct: 65, color: '#f97316' },
                { label: 'Diversification Score', pct: 40, color: '#6366f1' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="text-zinc-500">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border border-zinc-800/60 bg-zinc-900/40" />
              <div className="absolute inset-4 rounded-full border border-zinc-800/40 bg-zinc-950/60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg viewBox="0 0 120 70" className="w-44 h-28">
                  <path d="M10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeDasharray="110 157" />
                  <text x="60" y="58" textAnchor="middle" fill="white" fontSize="20" fontWeight="900">67</text>
                  <text x="60" y="66" textAnchor="middle" fill="#52525b" fontSize="6">/100</text>
                </svg>
                <div className="text-xs font-semibold text-orange-400 -mt-2">Moderate - High Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60 text-xs font-medium text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Free, forever
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Your recovery plan<br />
            <span style={{ background: 'linear-gradient(135deg, #ffffff 0%, #71717a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>starts right now.</span>
          </h2>
          <p className="text-zinc-500 mb-8 text-lg">
            No sign-up. No credit card. No data sent anywhere.<br />
            Open the app and start building your structured plan.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-base hover:bg-zinc-100 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            Launch Undo Loss <ArrowUpRight size={18} />
          </Link>
          <p className="text-xs text-zinc-700 mt-4">Educational tool only. Not financial advice.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-950/60">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Undo2 size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">Undo Loss</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                A structured, discipline-first recovery system for crypto portfolios. Built for holders who want math, not emotion.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Navigation</div>
              <ul className="space-y-2.5">
                {[
                  { label: 'Launch App', href: '/dashboard' },
                  { label: 'Features', href: '#features' },
                  { label: 'Strategy Guide', href: '#strategies' },
                  { label: 'How It Works', href: '#how-it-works' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategies quick links */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Strategies</div>
              <ul className="space-y-2.5">
                {['DCA Recovery', 'Break-even Planning', 'Risk Reduction', 'Swing Re-entry', 'Delta-Neutral Hedging'].map((s) => (
                  <li key={s}>
                    <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">{s}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">© 2025 Undo Loss. All rights reserved.</p>
            <p className="text-xs text-zinc-700 text-center">For educational purposes only. Not financial advice. Always do your own research.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
