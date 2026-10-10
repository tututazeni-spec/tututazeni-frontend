// components/ui/NavyHeroCard.tsx
// Card de destaque em azul-marinho com desenhos decorativos (círculos, curvas,
// barras) nas laterais — desenho do card do participante em
// evaluation360/OverviewTab, partilhado para não duplicar o SVG.
// O conteúdo (children) fica por cima dos desenhos.

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function NavyHeroCard({
  children,
  className,
  surfaceClassName,
}: {
  children: ReactNode;
  /** Classes do contentor interno (layout do conteúdo). */
  className?: string;
  /** Substitui a cor de fundo/borda do cartão (por omissão #0A2342/80). */
  surfaceClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-7',
        surfaceClassName ?? 'border-[#0A2342]/80 bg-[#0A2342]/80',
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 320 160"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute right-0 top-0 h-full w-auto max-w-[55%]"
        fill="none"
      >
        <circle cx="270" cy="30" r="90" fill="#12356B" fillOpacity="0.55" />
        <circle cx="300" cy="140" r="70" fill="#1B4A8C" fillOpacity="0.4" />
        <rect
          x="150"
          y="70"
          width="60"
          height="60"
          rx="8"
          transform="rotate(20 180 100)"
          stroke="#2F6AB8"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <path
          d="M120 150 L180 90 L220 120 L290 50"
          stroke="#3B7DD0"
          strokeOpacity="0.6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="180" cy="90" r="4" fill="#3B7DD0" fillOpacity="0.8" />
        <circle cx="220" cy="120" r="4" fill="#3B7DD0" fillOpacity="0.8" />
        <circle cx="290" cy="50" r="4" fill="#3B7DD0" fillOpacity="0.8" />
        <g fill="#2F6AB8" fillOpacity="0.45">
          <rect x="236" y="104" width="10" height="36" rx="2" />
          <rect x="252" y="88" width="10" height="52" rx="2" />
          <rect x="268" y="72" width="10" height="68" rx="2" />
        </g>
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 240 160"
        preserveAspectRatio="xMinYMid slice"
        className="pointer-events-none absolute left-0 top-0 h-full w-auto max-w-[40%]"
        fill="none"
      >
        <circle cx="-10" cy="40" r="80" fill="#12356B" fillOpacity="0.5" />
        <circle cx="30" cy="150" r="60" fill="#1B4A8C" fillOpacity="0.35" />
        <path
          d="M0 110 Q60 70 120 100 T240 60"
          stroke="#3B7DD0"
          strokeOpacity="0.5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 130 Q60 90 120 120 T240 80"
          stroke="#2F6AB8"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="120"
          y="14"
          width="44"
          height="44"
          rx="8"
          transform="rotate(-18 142 36)"
          stroke="#2F6AB8"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <g fill="#3B7DD0" fillOpacity="0.4">
          <circle cx="150" cy="120" r="3" />
          <circle cx="166" cy="120" r="3" />
          <circle cx="182" cy="120" r="3" />
          <circle cx="150" cy="136" r="3" />
          <circle cx="166" cy="136" r="3" />
          <circle cx="182" cy="136" r="3" />
        </g>
      </svg>
      <div className={cn('relative flex w-full items-center gap-4', className)}>
        {children}
      </div>
    </div>
  );
}
