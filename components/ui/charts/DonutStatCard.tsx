// components/ui/charts/DonutStatCard.tsx

'use client';

import { Card } from '@/components/ui/Card';

export interface DonutStatCardProps {
  label: string;
  value: number;
  sub?: string;
  /** Sem moldura (borda/fundo do Card): só título e rosca. */
  bare?: boolean;
  /** Cor única do progresso (omisso: azul-escuro até 50%, azul-claro depois). */
  color?: string;
}

// Rosca de progresso em Card próprio (fora do estilo NavyStatCard): azul escuro
// até 50%, azul claro de 50% até ao valor, cinza no restante, separadores
// brancos entre fatias. Valores acima de 100% enchem o anel.
export function DonutStatCard({
  label,
  value,
  sub,
  color,
  bare = false,
}: DonutStatCardProps) {
  const pct = Math.min(100, Math.max(0, value));
  const parts = (
    color
      ? [
          { v: pct, color },
          { v: 100 - pct, color: 'var(--color-donut-track, #CBD2DC)' },
        ]
      : [
          { v: Math.min(pct, 50), color: '#152F59' },
          { v: Math.max(0, pct - 50), color: '#6FA8DC' },
          { v: 100 - pct, color: 'var(--color-donut-track, #CBD2DC)' },
        ]
  ).filter((p) => p.v > 0);
  const scale = bare ? 1.1 : 1;
  const size = 120 * scale;
  const stroke = 16 * scale;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gap = parts.length > 1 ? 1.5 : 0;
  let offset = 0;
  const Wrapper = bare ? 'div' : Card;
  return (
    <Wrapper
      className={
        bare
          ? 'flex min-h-[155px] flex-col items-center justify-center gap-2 p-4 transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100'
          : 'flex min-h-[155px] flex-col items-center justify-center gap-2 p-4 transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100'
      }
    >
      <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </h3>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label}: ${Math.round(value)}%`}
          className="-rotate-90"
        >
          {parts.map((p, i) => {
            const len = (p.v / 100) * circ;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(0, len - gap)} ${circ}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-ink">
          {Math.round(value)}%
        </span>
      </div>
      {sub && (
        <p className="text-center font-body text-xs text-ink-faint">{sub}</p>
      )}
    </Wrapper>
  );
}
