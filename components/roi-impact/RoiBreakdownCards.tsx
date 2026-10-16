// components/roi-impact/BenchmarkGroupAvgCards.tsx
// Três cards de "ROI médio" da aba Benchmarks, cada um com o seu gráfico:
// departamento (barras), unidade (medidor em arco) e ciclo/ano (anel).
// Desenho baseado em public/images/roi medio por {departamento,unidade,ciclo}.jpeg.
// Cartões brancos (sem NavyStatCard); dados de /benchmarks/internal-comparisons.

'use client';

import { Building2, CalendarDays, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import type { BenchmarkGroupAvg } from './types';

const NAVY = '#0F1F3D';
const PALETTE = [
  '#2F80ED',
  '#14B8A6',
  '#6366F1',
  '#F59E0B',
  '#A855F7',
  '#0E7490',
];

const fmtPct = (v: number) =>
  `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`;

/** Média ponderada pelo número de análises de cada grupo. */
function weightedAvg(rows: BenchmarkGroupAvg[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0)
    return rows.reduce((s, r) => s + r.avgValue, 0) / rows.length;
  return rows.reduce((s, r) => s + r.avgValue * r.count, 0) / total;
}

function CardShell({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100">
      <CardBody>
        <div className="mb-4 flex items-center gap-3">
          <Icon
            className="h-6 w-6 shrink-0"
            style={{ color: NAVY }}
            strokeWidth={1.8}
            aria-hidden
          />
          <h4 className="font-display text-sm font-semibold text-ink">
            {title}
          </h4>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

function Legend({ rows }: { rows: BenchmarkGroupAvg[] }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {rows.map((r, i) => (
        <li
          key={String(r.key)}
          className="flex items-center justify-between gap-3 font-body text-sm"
        >
          <span className="flex min-w-0 items-center gap-2 text-ink-muted">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="truncate">{String(r.key ?? '—')}</span>
          </span>
          <span className="font-semibold" style={{ color: NAVY }}>
            {fmtPct(r.avgValue)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <p className="font-body text-sm text-ink-faint">
      Sem análises de ROI para agrupar.
    </p>
  );
}

// ── Departamento: valor médio + barras verticais ─────────────────

export function RoiByDepartmentCard({ rows }: { rows: BenchmarkGroupAvg[] }) {
  const avg = weightedAvg(rows);
  const maxVal = Math.max(...rows.map((r) => r.avgValue), 0);
  const step = Math.max(1, Math.ceil(maxVal / 3 / 2) * 2);
  const axisMax = step * 3;
  const ticks = [3, 2, 1, 0].map((i) => i * step);

  return (
    <CardShell icon={Users} title="ROI médio por departamento">
      {avg == null ? (
        <Empty />
      ) : (
        <>
          <p
            className="font-display text-4xl font-bold"
            style={{ color: NAVY }}
          >
            {fmtPct(avg)}
          </p>
          <p className="mb-3 font-body text-xs text-ink-faint">
            média de {rows.reduce((s, r) => s + r.count, 0)} análise(s)
          </p>
          <div className="flex gap-2">
            <div className="flex h-40 flex-col justify-between text-right font-body text-xs text-ink-faint">
              {ticks.map((t) => (
                <span key={t}>{t}%</span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between">
                {ticks.map((t) => (
                  <div key={t} className="border-t border-border/70" />
                ))}
              </div>
              <div className="relative flex h-40 items-end justify-around gap-2">
                {rows.map((r) => (
                  <div
                    key={String(r.key)}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <span
                      className="mb-1 font-body text-xs font-semibold"
                      style={{ color: NAVY }}
                    >
                      {fmtPct(r.avgValue)}
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-md bg-gradient-to-b from-[#3B8EF0] to-[#1D63D6]"
                      style={{
                        height: `${Math.max(0, Math.min(100, (r.avgValue / axisMax) * 100)) * 0.85}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-around gap-2">
                {rows.map((r) => (
                  <span
                    key={String(r.key)}
                    className="min-w-0 flex-1 truncate text-center font-body text-xs text-ink-muted"
                    title={String(r.key ?? '—')}
                  >
                    {String(r.key ?? '—')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </CardShell>
  );
}

// ── Unidade: medidor em arco de 270° + legenda ───────────────────

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function RoiByUnitCard({ rows }: { rows: BenchmarkGroupAvg[] }) {
  const avg = weightedAvg(rows);
  const top = Math.max(avg ?? 0, ...rows.map((r) => r.avgValue), 0);
  const scaleMax = Math.max(5, Math.ceil(top / 5) * 5);
  const pct = avg == null ? 0 : Math.max(0, Math.min(1, avg / scaleMax));

  const size = 200;
  const c = size / 2;
  const r = 78;
  const stroke = 18;
  const start = 135;
  const sweep = 270;

  return (
    <CardShell icon={Building2} title="ROI médio por unidade">
      {avg == null ? (
        <Empty />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div
            className="relative shrink-0"
            style={{ width: size, height: 170 }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`ROI médio por unidade: ${fmtPct(avg)}`}
            >
              <path
                d={arcPath(c, c, r, start, start + sweep)}
                fill="none"
                stroke="#D5EEEA"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
              {pct > 0 && (
                <path
                  d={arcPath(c, c, r, start, start + sweep * pct)}
                  fill="none"
                  stroke="#0F8B83"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-x-0 top-[62px] text-center">
              <p
                className="font-display text-3xl font-bold"
                style={{ color: NAVY }}
              >
                {fmtPct(avg)}
              </p>
              <p className="font-body text-xs text-ink-muted">ROI médio</p>
            </div>
            <span className="absolute bottom-0 left-3 font-body text-xs text-ink-faint">
              0%
            </span>
            <span className="absolute bottom-0 right-3 font-body text-xs text-ink-faint">
              {scaleMax}%
            </span>
          </div>
          <Legend rows={rows} />
        </div>
      )}
    </CardShell>
  );
}

// ── Ciclo/ano: anel + legenda ────────────────────────────────────

export function RoiByCycleCard({ rows }: { rows: BenchmarkGroupAvg[] }) {
  const avg = weightedAvg(rows);
  const size = 180;
  const c = size / 2;
  const r = 66;
  const stroke = 34;
  const circ = 2 * Math.PI * r;
  const weights = rows.map((x) => Math.max(0, x.avgValue));
  const total = weights.reduce((s, w) => s + w, 0);

  let offset = 0;
  const segments = rows.map((row, i) => {
    const len = total > 0 ? (weights[i] / total) * circ : 0;
    const seg = {
      key: String(row.key),
      len,
      offset,
      color: PALETTE[i % PALETTE.length],
    };
    offset += len;
    return seg;
  });

  return (
    <CardShell icon={CalendarDays} title="ROI médio por ciclo/ano">
      {avg == null ? (
        <Empty />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`ROI médio por ciclo: ${fmtPct(avg)}`}
              className="-rotate-90"
            >
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={stroke}
              />
              {segments.map((s) => (
                <circle
                  key={s.key}
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${s.len} ${circ - s.len}`}
                  strokeDashoffset={-s.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p
                className="font-display text-2xl font-bold"
                style={{ color: NAVY }}
              >
                {fmtPct(avg)}
              </p>
              <p className="font-body text-xs text-ink-muted">ROI médio</p>
            </div>
          </div>
          <Legend rows={rows} />
        </div>
      )}
    </CardShell>
  );
}
