// components/roi-impact/BenchmarkRoiCard.tsx
// Card "ROI médio da Academia INNOVA" (aba Indicadores de referência).
// Mesma linguagem do RoiTotalCard: painel azul-marinho em gradiente, ícone,
// anel de progresso e bloco de leitura.

'use client';

import { BarChart3, Info } from 'lucide-react';
import { useId } from 'react';

interface BenchmarkRoiCardProps {
  avgRoi: number | null;
  sampleSize: number;
}

export function BenchmarkRoiCard({
  avgRoi,
  sampleSize,
}: BenchmarkRoiCardProps) {
  const gid = useId();
  const hasValue = avgRoi != null;

  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = !hasValue ? 0 : avgRoi < 0 ? 100 : Math.min(100, avgRoi);

  return (
    <div className="transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100 overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <BarChart3 className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h3 className="font-display text-base font-bold">
          ROI médio da Academia INNOVA
        </h3>
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
            aria-label={
              hasValue ? `ROI médio: ${avgRoi}%` : 'ROI médio sem dados'
            }
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
            {pct > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={`url(#${gid})`}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                opacity={hasValue && avgRoi < 0 ? 0.55 : 1}
              />
            )}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
            {hasValue ? `${avgRoi}%` : '—'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-sm text-white/70">Amostra</p>
          <p className="font-display text-2xl font-bold">
            {sampleSize} análise(s)
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
        <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
        <span>
          Média das análises de ROI calculadas na Academia, usada como ponto de
          comparação com os benchmarks externos.
        </span>
      </div>
    </div>
  );
}
