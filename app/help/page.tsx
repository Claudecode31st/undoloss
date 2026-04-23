import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';

const faqs = [
  { q: 'How are PnL calculations done?', a: 'Unrealized P/L = (Current Price - Entry Price) × Amount. All calculations happen locally in your browser using pure TypeScript functions.' },
  { q: 'What is Delta-Neutral Hedging?', a: 'Delta-neutral hedging simulates holding a short position (e.g., via futures or options) equal to a percentage of your long exposure. It reduces directional risk and creates a "freeze zone" where your portfolio value is less affected by price moves.' },
  { q: 'What is the Portfolio Freeze Zone?', a: 'When your hedge ratio is ≥50%, the system considers your portfolio in a "freeze zone" — volatility impact is reduced because your long and short exposures partially offset each other.' },
  { q: 'How does DCA Recovery work?', a: 'DCA (Dollar Cost Averaging) Recovery suggests staged buy-in levels below current price to lower your average entry price. The stages are calculated based on your risk tolerance (conservative/balanced/aggressive).' },
  { q: 'Is my data private?', a: 'Yes. All data is stored locally in your browser\'s localStorage. Nothing is sent to any server except for CoinGecko price fetches.' },
  { q: 'How do I import/export my portfolio?', a: 'Go to Portfolio or Settings page. Use Export JSON to save your data, and Import JSON to restore it.' },
  { q: 'What is the Risk Score?', a: 'The risk score (0-100) is calculated from three factors: drawdown severity (0-40 pts), concentration risk (0-35 pts), and diversification (0-25 pts). Higher = more risk.' },
  { q: 'Is this financial advice?', a: 'No. This is an educational tool for structured decision support. Always consult a qualified financial advisor before making investment decisions.' },
];

export default function HelpPage() {
  return (
    <>
      <Header title="Help" subtitle="Frequently asked questions and guidance" />
      <div className="grid grid-cols-2 gap-4">
        {faqs.map((item, i) => (
          <GlassCard key={i} className="p-4">
            <h3 className="text-sm font-semibold t-1 mb-2">{item.q}</h3>
            <p className="text-xs t-2 leading-relaxed">{item.a}</p>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
