// components/roi-impact/RoiTotalCard.tsx
// Card hero "ROI Total": anel de progresso, rácio benefício-custo, estado e
// narrativa. Desenho baseado em public/images/roi total.jpeg.

'use client';

import { BarChart3, Info } from 'lucide-react';
import { useId } from 'react';
import { fmt$, ptInsight } from './utils';

interface RoiTotalCardProps {
  roi: number;
  totalBenefit: number;
  totalCost: number;
  narrative?: string;
}

function roiStatus(roi: number) {
  if (roi >= 100) return { label: 'Excelente', color: '#34D399' };
  if (roi >= 0) return { label: 'Atenção', color: '#FBBF24' };
  return { label: 'Crítico', color: '#F87171' };
}

export function RoiTotalCard({
  roi,
  totalBenefit,
  totalCost,
  narrative,
}: RoiTotalCardProps) {
  const gid = useId();
  const status = roiStatus(roi);
  const ratio = totalCost > 0 ? (totalBenefit / totalCost).toFixed(2) : '–';

  const size = 170;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // ROI negativo mantém o anel completo mas esmaecido; positivo enche até 100%.
  const pct = roi < 0 ? 100 : Math.min(100, roi);
  const dim = roi < 0;

  return (
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-6 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-3 flex items-center gap-3">
        <BarChart3 className="h-7 w-7" strokeWidth={1.8} aria-hidden />
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">
          ROI Total
        </h3>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`ROI total: ${Math.round(roi)}%`}
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
              opacity={dim ? 0.55 : 1}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold">
            {Math.round(roi)}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-4 font-display text-2xl font-bold leading-snug">
            ROI Total do Investimento em Pessoas
          </p>
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-4">
            <div>
              <p className="font-body text-sm text-white/70">
                Rácio Benefício-Custo
              </p>
              <p className="font-display text-3xl font-bold">{ratio}</p>
            </div>
            <div className="hidden w-px bg-white/20 sm:block" />
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
                Benefício / Custo
              </p>
              <p className="font-display text-xl font-bold">
                {fmt$(totalBenefit)}
              </p>
              <p className="font-body text-xs text-white/70">
                Custo: {fmt$(totalCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-card bg-white/10 px-4 py-3 font-body text-sm">
        <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
        <span>
          {narrative
            ? ptInsight(narrative)
            : 'Dados insuficientes para gerar narrativa de impacto.'}
        </span>
      </div>
    </div>
  );
}
