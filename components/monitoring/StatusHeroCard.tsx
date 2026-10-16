// components/monitoring/StatusHeroCard.tsx
// Card hero no desenho do "ROI Total" do roi-impact (public/images/roi total.jpeg):
// título com ícone, anel de progresso, estatísticas separadas por divisores e
// faixa de informação. Partilhado pelas abas Visão Geral e Integrações.

'use client';

import { Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import type { MonitoringStatus } from './platformTypes';

const STATUS_VIEW: Record<MonitoringStatus, { label: string; color: string }> =
  {
    NORMAL: { label: 'Normal', color: '#34D399' },
    ATENCAO: { label: 'Atenção', color: '#FBBF24' },
    DEGRADADO: { label: 'Degradado', color: '#FBBF24' },
    CRITICO: { label: 'Crítico', color: '#F87171' },
    INDISPONIVEL: { label: 'Indisponível', color: '#F87171' },
  };

export interface HeroStat {
  label: string;
  value: string;
}

export function StatusHeroCard({
  icon: Icon,
  title,
  headline,
  status,
  percent,
  ringLabel,
  stats,
  info,
}: {
  icon: LucideIcon;
  title: string;
  headline: string;
  status: MonitoringStatus;
  /** Preenchimento do anel (0–100). */
  percent: number;
  ringLabel: string;
  stats: HeroStat[];
  info: ReactNode;
}) {
  const gid = useId();
  const view = STATUS_VIEW[status];
  const pct = Math.min(100, Math.max(0, Math.round(percent)));

  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h2 className="font-display text-base font-bold uppercase tracking-wide">
          {title}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={ringLabel}
            className="-rotate-90"
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7CC4FF" />
                <stop offset="100%" stopColor="#2F80ED" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-2 font-display text-xl font-bold leading-snug">
            {headline}
          </p>
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
            <div>
              <p className="font-body text-sm text-white/70">Status</p>
              <p
                className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                style={{ color: view.color }}
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: view.color }}
                />
                {view.label}
              </p>
            </div>
            {stats.map((st) => (
              <div key={st.label} className="flex gap-x-8">
                <div className="hidden w-px bg-white/20 sm:block" />
                <div>
                  <p className="font-body text-sm text-white/70">{st.label}</p>
                  <p className="font-display text-xl font-bold">{st.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
        <div className="min-w-0 break-words">{info}</div>
      </div>
    </div>
  );
}
