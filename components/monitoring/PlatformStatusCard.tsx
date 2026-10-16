// components/monitoring/PlatformStatusCard.tsx
// Card hero "Estado geral da plataforma", no desenho do card "ROI Total" do
// roi-impact (public/images/roi total.jpeg): anel de progresso, estado e faixa
// de informação. O anel mostra a percentagem de módulos em estado Normal.

'use client';

import { Activity, Info } from 'lucide-react';
import { useId } from 'react';
import type { OverviewData, MonitoringStatus } from './platformTypes';

const STATUS_VIEW: Record<MonitoringStatus, { label: string; color: string }> =
  {
    NORMAL: { label: 'Normal', color: '#34D399' },
    ATENCAO: { label: 'Atenção', color: '#FBBF24' },
    DEGRADADO: { label: 'Degradado', color: '#FBBF24' },
    CRITICO: { label: 'Crítico', color: '#F87171' },
    INDISPONIVEL: { label: 'Indisponível', color: '#F87171' },
  };

export function PlatformStatusCard({
  platform,
}: {
  platform: OverviewData['platform'];
}) {
  const gid = useId();
  const status = STATUS_VIEW[platform.status];
  const total = platform.modules.total;
  const normal = platform.modules.counts.NORMAL ?? 0;
  const pct = total > 0 ? Math.round((normal / total) * 100) : 0;

  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const db = platform.database.available
    ? `${platform.database.latencyMs} ms`
    : 'sem resposta';

  return (
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <Activity className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h2 className="font-display text-base font-bold uppercase tracking-wide">
          Estado geral da plataforma
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
            aria-label={`${normal} de ${total} módulos em estado normal`}
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
            Saúde da plataforma
          </p>
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
            <div>
              <p className="font-body text-sm text-white/70">Status</p>
              <p
                className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                style={{ color: status.color }}
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.label}
              </p>
            </div>
            <div className="hidden w-px bg-white/20 sm:block" />
            <div>
              <p className="font-body text-sm text-white/70">
                Módulos em estado normal
              </p>
              <p className="font-display text-2xl font-bold">
                {normal} / {total}
              </p>
            </div>
            <div className="hidden w-px bg-white/20 sm:block" />
            <div>
              <p className="font-body text-sm text-white/70">Base de dados</p>
              <p className="font-display text-xl font-bold">{db}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
        {platform.reasons.length > 0 ? (
          <ul className="min-w-0 space-y-1 break-words">
            {platform.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <span>Sem alertas: todos os componentes estão a funcionar.</span>
        )}
      </div>
    </div>
  );
}
