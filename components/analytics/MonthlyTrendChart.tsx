// components/analytics/MonthlyTrendChart.tsx
// Mini gráfico de barras para uma série temporal mensal única (ex.:
// matrículas/mês). Série única → sem legenda (o título do card já a nomeia),
// uma só cor (bg-accent, mesma usada em components/ui/ProgressBar), barras
// finas com topo arredondado ancoradas à base, gap de 2px entre barras,
// tooltip por barra ao passar o rato. Ver skill dataviz.

'use client';

import { useState } from 'react';
import type { MonthlyCount } from './types';

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const idx = Number(m) - 1;
  const label = MONTHS_PT[idx] ?? month;
  return `${label}/${year.slice(2)}`;
}

export function MonthlyTrendChart({ data }: { data: MonthlyCount[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-ink-faint">
        Sem dados no período
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-2 h-5 text-xs font-data font-bold text-ink">
        {hovered ? `${formatMonth(hovered.month)} · ${hovered.count}` : ' '}
      </div>
      <div className="flex h-28 items-end gap-1">
        {data.map((d, i) => {
          const heightPct = Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0);
          return (
            <div
              key={d.month}
              className="group flex flex-1 flex-col items-center justify-end gap-1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                role="img"
                aria-label={`${formatMonth(d.month)}: ${d.count}`}
                title={`${formatMonth(d.month)}: ${d.count}`}
                className="w-full rounded-t-[4px] bg-accent transition-[opacity] duration-150 group-hover:opacity-80"
                style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? 2 : 0 }}
              />
              <div className="font-body text-[10px] text-ink-faint">
                {formatMonth(d.month)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
