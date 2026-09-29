// components/ui/charts/GanttChart.tsx
// Cronograma horizontal de etapas — uma linha por etapa/acção, barra a
// abranger [start, end] num eixo partilhado (dias ou datas convertidas para
// número), cor por estado. Pensado directamente para o formato já existente
// de OnboardingStageGroup (minDayOffset/maxDayOffset) e das acções de PDI
// (dueDate/status), para os dois módulos que o vão consumir (docs do plano
// "Gantt-of-stages") ligarem sem adaptador.

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { ChartTooltip } from './ChartTooltip';
import { STATUS } from './palette';

export type GanttRowStatus = 'done' | 'current' | 'pending' | 'overdue';

export interface GanttRow {
  label: string;
  start: number;
  end: number;
  status?: GanttRowStatus;
  detail?: string;
}

export interface GanttChartProps {
  rows: GanttRow[];
  /** marcador vertical (ex.: dia actual desde o início do plano) */
  todayValue?: number;
  unitLabel?: string;
  className?: string;
}

const PADDING = { top: 8, right: 16, bottom: 24, left: 140 };
const WIDTH = 640;
const ROW_HEIGHT = 32;
const BAR_H = 16;

const ROW_COLOR: Record<GanttRowStatus, string> = {
  done: STATUS.good,
  current: 'var(--color-accent)',
  overdue: STATUS.serious,
  pending: 'var(--color-border-strong)',
};

export function GanttChart({
  rows,
  todayValue,
  unitLabel = 'dias',
  className,
}: GanttChartProps) {
  const [hover, setHover] = useState<{
    idx: number;
    cx: number;
    cy: number;
  } | null>(null);

  const { min, max } = useMemo(() => {
    const starts = rows.map((r) => r.start);
    const ends = rows.map((r) => r.end);
    return {
      min: Math.min(0, ...starts),
      max: Math.max(1, ...ends, todayValue ?? 0),
    };
  }, [rows, todayValue]);

  const height =
    PADDING.top + PADDING.bottom + Math.max(1, rows.length) * ROW_HEIGHT;
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const scaleX = (v: number) =>
    PADDING.left + ((v - min) / (max - min || 1)) * plotW;

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label="Cronograma de etapas"
      >
        {rows.map((row, i) => {
          const y = PADDING.top + i * ROW_HEIGHT + (ROW_HEIGHT - BAR_H) / 2;
          const x = scaleX(row.start);
          const w = Math.max(4, scaleX(row.end) - x);
          const color = ROW_COLOR[row.status ?? 'pending'];
          return (
            <g key={row.label}>
              <text
                x={PADDING.left - 10}
                y={y + BAR_H / 2 + 4}
                textAnchor="end"
                className="fill-ink-muted text-[10px]"
              >
                {row.label}
              </text>
              <rect
                x={PADDING.left}
                y={y}
                width={plotW}
                height={BAR_H}
                rx={4}
                className="fill-surface-sunken"
              />
              <rect
                x={x}
                y={y}
                width={w}
                height={BAR_H}
                rx={4}
                fill={color}
                stroke="var(--color-surface)"
                strokeWidth={1}
                onMouseEnter={() => setHover({ idx: i, cx: x + w / 2, cy: y })}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {todayValue != null && (
          <line
            x1={scaleX(todayValue)}
            x2={scaleX(todayValue)}
            y1={PADDING.top - 2}
            y2={height - PADDING.bottom + 2}
            className="stroke-ink-faint"
            strokeDasharray="3,3"
            strokeWidth={1.5}
          />
        )}
      </svg>

      {hover && (
        <ChartTooltip
          xPct={(hover.cx / WIDTH) * 100}
          yPct={(hover.cy / height) * 100}
        >
          <p className="font-medium">{rows[hover.idx].label}</p>
          <p>
            {rows[hover.idx].start}–{rows[hover.idx].end} {unitLabel}
          </p>
          {rows[hover.idx].detail && (
            <p className="text-ink-faint">{rows[hover.idx].detail}</p>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
