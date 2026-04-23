import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'green' | 'red' | 'orange' | 'blue' | 'none';
}

export default function GlassCard({ children, className = '', hover = false, glow = 'none' }: GlassCardProps) {
  const glowClass = glow === 'green' ? 'shadow-[0_0_20px_rgba(34,197,94,0.12)]'
    : glow === 'red' ? 'shadow-[0_0_20px_rgba(239,68,68,0.12)]'
    : glow === 'orange' ? 'shadow-[0_0_20px_rgba(249,115,22,0.12)]'
    : glow === 'blue' ? 'shadow-[0_0_20px_rgba(99,102,241,0.12)]'
    : '';

  return (
    <div className={`glass rounded-2xl ${hover ? 'transition-all duration-200 hover:-translate-y-0.5' : ''} ${glowClass} ${className}`}>
      {children}
    </div>
  );
}
