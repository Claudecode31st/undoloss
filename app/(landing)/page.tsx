import Link from 'next/link';
import {
  ArrowRight, Undo2, TrendingUp, Shield, Target, BarChart3, Brain, Zap,
  CheckCircle, ArrowUpRight, RotateCcw, DollarSign,
  Lock, RefreshCw, Cpu, ShieldOff, ArrowLeftRight,
} from 'lucide-react';

/* ── tiny helpers ───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60 text-xs font-medium text-zinc-400 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      {children}
    </div>
  );
}

/* ── data ───────────────────────────────────────────────────── */
const features = [
  { icon: DollarSign,   title: 'Live PnL Tracking',      desc: 'Real-time unrealized P/L, exact breakeven levels, and weighted average entry per position.',       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: TrendingUp,   title: 'DCA Recovery Engine',    desc: 'Stage-by-stage averaging at −10/20/30% from current — triggered only when risk score allows.',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Shield,       title: 'Delta-Neutral Hedging',  desc: 'Simulate 25–100% hedge ratios to reduce directional exposure and create a portfolio freeze zone.',   color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { icon: BarChart3,    title: 'Risk Score 0–100',        desc: 'Portfolio-wide score combining drawdown depth, asset concentration, and position count.',            color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  { icon: Zap,          title: 'Scenario Simulator',     desc: 'Model bull, sideways, and bear outcomes. See your estimated value and recovery time per scenario.',   color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: Brain,        title: 'Behavioural Guard',      desc: 'Detects panic selling, overtrading, and over-averaging tendencies — warns before you act on fear.',  color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
];

const strategies = [
  {
    icon: TrendingUp, name: 'DCA Recovery', tag: 'Long-term holders',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5',
    when: 'Portfolio down 15–40%. You believe in the asset long-term.',
    how: '3 staged buy zones at −10%, −20%, −30% from current. Only triggers when risk score allows.',
    steps: ['Stage 1 at −10–20% from current price', 'Stage 2 only if Stage 1 executed', 'Auto-pauses if risk score exceeds 65'],
    riskLevel: 'Conservative – Balanced', riskColor: 'text-emerald-400',
  },
  {
    icon: Target, name: 'Break-even Planning', tag: 'Patient holders',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5',
    when: 'Portfolio slightly underwater. Goal is to exit at cost basis, not profit.',
    how: 'Calculates exact % gain needed. Applies 25% hedge to limit further losses while waiting.',
    steps: ['Exact price target to break even shown', 'Applies 25% hedge to reduce downside', 'Mid-point alert at 50% of required move'],
    riskLevel: 'Low Risk', riskColor: 'text-blue-400',
  },
  {
    icon: ShieldOff, name: 'Risk Reduction', tag: 'Overexposed holders',
    tagColor: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5',
    when: 'Concentration risk is High. Top 2 assets exceed 80% of portfolio.',
    how: 'Trims your largest position by 20% to reduce concentration without a full exit.',
    steps: ['Trim top position 20% to free capital', 'Keeps 80% remaining for recovery upside', 'Flags if concentration stays above 60% post-trim'],
    riskLevel: 'Defensive', riskColor: 'text-orange-400',
  },
  {
    icon: ArrowLeftRight, name: 'Swing Re-entry', tag: 'Active traders',
    tagColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5',
    when: 'Market is range-bound. Asset bounces between clear support and resistance.',
    how: 'Sell 15% near resistance (+10%), rebuy at support (−15% from sell).',
    steps: ['Hold to +10% swing high target', 'Scale out 15% at resistance', 'Re-enter at −15% from sell price'],
    riskLevel: 'Moderate', riskColor: 'text-purple-400',
  },
  {
    icon: Shield, name: 'Delta-Neutral Hedging', tag: 'Advanced holders',
    tagColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5',
    when: 'High volatility or uncertain direction. Capital preservation is the priority.',
    how: 'Set a hedge ratio (25–100%) to neutralise directional exposure via the slider.',
    steps: ['Set hedge ratio — 50% is balanced', 'Activates Portfolio Freeze Zone', 'Rebalance every 7 days'],
    riskLevel: 'Low – Moderate', riskColor: 'text-indigo-400',
  },
];

const steps = [
  { n: '01', title: 'Add your positions', desc: 'Enter your crypto holdings, entry prices, and amounts. Live prices auto-fetch from CoinGecko in real time.' },
  { n: '02', title: 'Check your risk score', desc: 'Score 0–100 based on drawdown, concentration, and diversification. Know your actual exposure before acting.' },
  { n: '03', title: 'Pick a strategy', desc: 'Choose from 5 structured strategies. Get your next 3 concrete actions with real price targets — no guessing.' },
];

const trustItems = [
  { icon: Lock,        label: '100% Private',     sub: 'Data never leaves your browser' },
  { icon: RefreshCw,   label: 'Real-time Prices', sub: 'Auto-fetched from CoinGecko' },
  { icon: Cpu,         label: 'No Backend',       sub: 'Pure client-side calculations' },
  { icon: CheckCircle, label: 'Free Forever',     sub: 'No account, no subscription' },
];

/* ── Dashboard mockup component ─────────────────────────────── */
function DashboardMockup() {
  const assets = [
    { sym: 'BT', color: '#f7931a', name: 'BTC', pnl: '+172.9%', pos: true },
    { sym: 'ET', color: '#627eea', name: 'ETH', pnl: '+15.4%',  pos: true },
    { sym: 'SO', color: '#9945ff', name: 'SOL', pnl: '-55.5%',  pos: false },
    { sym: 'LI', color: '#2a5ada', name: 'LINK', pnl: '-61.3%', pos: false },
  ];
  const statCards = [
    { label: 'Total Value',    val: '$46,396',  sub: '+6.2% today',    color: 'text-emerald-400' },
    { label: 'Unrealized P/L', val: '+$21,420', sub: '+85.8%',         color: 'text-emerald-400' },
    { label: 'Total Invested', val: '$24,976',  sub: '4 positions',    color: 'text-zinc-300' },
    { label: 'Risk Score',     val: '42',       sub: 'Moderate',       color: 'text-yellow-400' },
  ];
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* glow */}
      <div className="absolute -inset-4 bg-orange-500/5 rounded-3xl blur-2xl pointer-events-none" />
      <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-900/80 overflow-hidden shadow-2xl" style={{ backdropFilter: 'blur(20px)' }}>
        {/* mock top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Undo2 size={11} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s infinite' }} />
            <span className="text-[10px] text-zinc-400">Market Open</span>
          </div>
        </div>
        {/* stat cards */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl p-2.5 border border-zinc-800/50 bg-zinc-800/30">
              <div className="text-[9px] text-zinc-500 mb-0.5">{s.label}</div>
              <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
        {/* asset rows */}
        <div className="px-3 pb-3 space-y-1">
          <div className="text-[9px] text-zinc-500 uppercase tracking-widest px-1 mb-1.5">Portfolio</div>
          {assets.map((a) => (
            <div key={a.sym} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-800/20 border border-zinc-800/40">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor: a.color + '33', border: `1px solid ${a.color}55`, color: a.color }}>
                {a.sym}
              </div>
              <span className="text-xs font-semibold text-white flex-1">{a.name}</span>
              <span className={`text-xs font-bold ${a.pos ? 'text-emerald-400' : 'text-red-400'}`}>{a.pnl}</span>
            </div>
          ))}
        </div>
        {/* bottom nav mock */}
        <div className="flex border-t border-zinc-800/60 bg-zinc-950/60">
          {['Home','Portfolio','Strategies','Risk'].map((tab, i) => (
            <div key={tab} className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 ${i === 0 ? 'text-orange-400' : 'text-zinc-600'}`}>
              <div className={`w-3.5 h-3.5 rounded ${i === 0 ? 'bg-orange-400/30' : 'bg-zinc-700/30'}`} />
              <span className="text-[8px] font-medium">{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Navbar — static, not sticky */}
      <nav className="w-full border-b border-zinc-800/40 bg-black/60" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <Undo2 size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-sm">Undo Loss</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features"    className="hover:text-white transition-colors">Features</a>
            <a href="#strategies"  className="hover:text-white transition-colors">Strategies</a>
            <a href="#how-it-works"className="hover:text-white transition-colors">How it works</a>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-all">
            Launch App <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-5 pt-16 pb-20 overflow-hidden">
        {/* subtle grid bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60 text-xs font-medium text-zinc-400 mb-6">
                <RotateCcw size={11} className="text-orange-400" />
                Crypto Recovery System
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-5">
                <span className="text-white">Stop guessing.</span><br />
                <span className="text-white">Start recovering</span><br />
                <span style={{ background: 'linear-gradient(135deg,#f97316 0%,#ef4444 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  with a plan.
                </span>
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-md">
                A structured, discipline-first tool for managing underwater crypto positions.
                Track PnL, plan DCA stages, hedge risk, and simulate scenarios — all locally in your browser.
                <span className="text-zinc-600"> No sign-up. No data sent anywhere.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  Launch App Free <ArrowRight size={14} />
                </Link>
                <a href="#how-it-works" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-700/60 text-zinc-300 font-medium text-sm hover:border-zinc-500 hover:text-white transition-all">
                  See How It Works
                </a>
              </div>
              {/* stat pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { val: '5', label: 'Recovery Strategies' },
                  { val: '100%', label: 'Browser-local' },
                  { val: '12+', label: 'Coins Supported' },
                  { val: '$0', label: 'Cost Forever' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800/60 bg-zinc-900/40">
                    <span className="text-sm font-black text-white">{s.val}</span>
                    <span className="text-[11px] text-zinc-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: dashboard mockup */}
            <div className="lg:pl-6">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-zinc-800/50 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto px-5 py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
          {trustItems.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-zinc-300" />
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
      <section id="features" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Everything you need to<br />
              <span className="text-zinc-500">recover with discipline.</span>
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm">Built on pure math, not emotions. Every feature helps you make structured decisions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                  <Icon size={17} className={color} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-5 border-y border-zinc-800/40 bg-zinc-950/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Three steps to a<br />
              <span className="text-zinc-500">structured recovery plan.</span>
            </h2>
          </div>
          <div className="space-y-4">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="flex gap-5 group">
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                  <div className="w-9 h-9 rounded-full border border-zinc-700/60 bg-zinc-900 flex items-center justify-center text-xs font-black text-zinc-400 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-all duration-200">
                    {n}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-zinc-800/60 min-h-[24px]" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 group-hover:border-zinc-700/60 transition-all duration-200">
                    <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Guide */}
      <section id="strategies" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Strategy Guide</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              5 strategies. One for<br />
              <span className="text-zinc-500">every situation.</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm">
              Each strategy is designed for a specific market condition. Choose the one that fits — the app generates your exact action plan with real price targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {strategies.map(({ icon: Icon, name, tag, tagColor, color, border, bg, when, how, steps: stps, riskLevel, riskColor }) => (
              <div key={name} className={`flex flex-col p-5 rounded-2xl border ${border} ${bg} hover:brightness-110 transition-all duration-200`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className={color} />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">{name}</h3>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${tagColor}`}>{tag}</span>
                </div>
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">When to use</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{when}</p>
                </div>
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">How it works</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{how}</p>
                </div>
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
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">Check your risk score first — it tells you exactly which strategy fits your current exposure.</p>
              <Link href="/dashboard" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-colors">
                Start Here <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="py-16 px-5 border-y border-zinc-800/40 bg-zinc-950/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {[
            { text: '"The most important thing is to control the downside. The upside takes care of itself."', author: 'Risk Management Principle' },
            { text: '"Do not focus on making money; focus on protecting what you have."', author: 'Paul Tudor Jones' },
          ].map((q) => (
            <div key={q.author} className="p-7 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
              <p className="text-sm text-zinc-300 leading-relaxed italic mb-4">{q.text}</p>
              <p className="text-xs text-zinc-600 font-medium">{q.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 border-t border-zinc-800/40">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60 text-xs font-medium text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s infinite' }} />
            Free, forever
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Your recovery plan<br />
            <span style={{ background: 'linear-gradient(135deg,#ffffff 0%,#71717a 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>starts right now.</span>
          </h2>
          <p className="text-zinc-500 mb-8 text-base leading-relaxed">
            No sign-up. No credit card. No data sent anywhere.<br />
            Open the app and build your structured recovery plan today.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            Launch Undo Loss <ArrowUpRight size={16} />
          </Link>
          <p className="text-xs text-zinc-700 mt-4">Educational tool only. Not financial advice.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-950/60">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Navigation</div>
              <ul className="space-y-2">
                {[
                  { label: 'Launch App',     href: '/dashboard' },
                  { label: 'Features',       href: '#features' },
                  { label: 'Strategy Guide', href: '#strategies' },
                  { label: 'How It Works',   href: '#how-it-works' },
                ].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Strategies</div>
              <ul className="space-y-2">
                {['DCA Recovery','Break-even Planning','Risk Reduction','Swing Re-entry','Delta-Neutral Hedging'].map((s) => (
                  <li key={s}><Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">{s}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-5 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-zinc-600">© 2026 Undo Loss. All rights reserved.</p>
            <p className="text-xs text-zinc-700 text-center sm:text-right">For educational purposes only. Not financial advice. Always do your own research.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
