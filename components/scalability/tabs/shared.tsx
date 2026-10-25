'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Info, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CardTitleBar } from '../InfraTabs';
import type { AlertSeverity, IntegrationStatus } from '../types';

// ─── UTILITY FUNCTIONS ─────────────────────────────────────
export { timeAgo } from '@/lib/format';


export function formatPercent(v: number, decimals = 1): string {
  return v.toFixed(decimals) + '%';
}

export type StateIntent = 'danger' | 'warning' | 'success' | 'info';

export const INTENT_TEXT: Record<StateIntent, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
};

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────

export interface SectionHeaderProps {
  title: string;
  sub?: string;
  /** Faixa #0F1F3D a 60% com letra branca (sem efeito de cursor). */
  banner?: boolean;
}

export function SectionHeader({
  title,
  sub,
  banner = false,
}: SectionHeaderProps) {
  if (banner)
    return (
      <div className="rounded-card bg-brand/60 px-5 py-3 text-white">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {sub && <p className="mt-1 font-body text-sm text-white/80">{sub}</p>}
      </div>
    );
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {sub && <p className="mt-1 font-body text-sm text-ink-muted">{sub}</p>}
    </div>
  );
}

export interface ThresholdBarProps {
  /** 0–100 */
  pct: number;
  state?: StateIntent;
  className?: string;
}

export function ThresholdBar({ pct, state, className }: ThresholdBarProps) {
  const fill =
    state === 'danger'
      ? 'bg-danger'
      : state === 'warning'
        ? 'bg-warning'
        : 'bg-primary';
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-300',
          fill,
        )}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  );
}

// Taxa de erro (escala 0–5%): mais baixo é melhor.
export const ERROR_RATE_BANDS = [
  { to: 1, color: '#2f9e63' },
  { to: 2, color: '#8fc23f' },
  { to: 3, color: '#f1c40f' },
  { to: 4, color: '#e67e22' },
  { to: 5, color: '#c0392b' },
];

// Cards "Crescimento" (public/images/crescimento diario…): fundo sólido,
// ícone em círculo, valor grande, variação e traço de tendência decorativo.
export const GROWTH_TONES = {
  blue: 'bg-[#1E4A9E]',
  green: 'bg-[#1F8A5F]',
  purple: 'bg-[#4B2FA3]',
} as const;

export interface GrowthCardProps {
  icon: typeof Users;
  tone: keyof typeof GROWTH_TONES;
  label: string;
  value: string;
  /** Linha de variação (com ▲); omitida quando não há dados. */
  chip?: string;
  caption: string;
}

export function GrowthCard({
  icon: Icon,
  tone,
  label,
  value,
  chip,
  caption,
}: GrowthCardProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[155px] flex-col justify-between overflow-hidden rounded-panel p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)] transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100',
        GROWTH_TONES[tone],
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <h3 className="font-body text-sm font-semibold">{label}</h3>
      </div>
      <div>
        <p className="font-display text-4xl font-bold leading-none">{value}</p>
        {chip && (
          <p className="mt-3 flex items-center gap-1 font-body text-xs font-semibold text-[#6EE7A8]">
            <span aria-hidden>▲</span> {chip}
          </p>
        )}
        <p className="mt-0.5 font-body text-xs text-white/80">{caption}</p>
      </div>
      <svg
        aria-hidden
        viewBox="0 0 100 50"
        className="absolute bottom-4 right-4 h-12 w-24 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2,44 22,30 36,36 56,18 70,24 94,4" />
        <polyline points="82,4 94,4 94,16" />
      </svg>
    </div>
  );
}

export interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  barValue?: number;
  barMax?: number;
  barWarn?: number;
  barDanger?: number;
  /** Rótulo num cabeçalho navy (#0F1F3D a 60%) em vez de texto solto. */
  headed?: boolean;
}

export function MetricTile({
  label,
  value,
  unit,
  sub,
  barValue,
  barMax,
  barWarn,
  barDanger,
  headed = false,
}: MetricTileProps) {
  const hasBar = barValue !== undefined && barMax !== undefined;
  const pct = hasBar ? (barValue! / barMax!) * 100 : 0;
  const isDanger =
    barValue !== undefined && barDanger !== undefined && barValue >= barDanger;
  const isWarn =
    !isDanger &&
    barValue !== undefined &&
    barWarn !== undefined &&
    barValue >= barWarn;

  return (
    <Card className={headed ? 'overflow-hidden' : undefined}>
      {headed && <CardTitleBar>{label}</CardTitleBar>}
      <CardBody>
        {!headed && (
          <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
            {label}
          </p>
        )}
        <p className="mt-1 font-display text-2xl font-bold text-ink">
          {value}
          {unit && (
            <span className="ml-1 font-body text-sm font-normal text-ink-muted">
              {unit}
            </span>
          )}
        </p>
        {sub && (
          <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>
        )}
        {hasBar && (
          <ThresholdBar
            pct={pct}
            state={isDanger ? 'danger' : isWarn ? 'warning' : undefined}
            className="mt-3"
          />
        )}
      </CardBody>
    </Card>
  );
}

export interface StatusRow {
  label: string;
  value: string | number;
  intent?: StateIntent;
}

export interface StatusCardProps {
  title: string;
  rows: StatusRow[];
}

export function StatusCard({ title, rows }: StatusCardProps) {
  return (
    <Card className="overflow-hidden">
      <h3 className="flex items-center bg-brand/60 px-5 py-3 font-body text-sm font-semibold text-white">
        {title}
      </h3>
      <CardBody>
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-muted">
                {r.label}
              </span>
              <span
                className={cn(
                  'font-body text-sm font-semibold',
                  r.intent ? INTENT_TEXT[r.intent] : 'text-ink',
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-pill border px-3 py-1 font-body text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary-subtle text-primary'
          : 'border-border text-ink-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

// ─── STATUS MAPPINGS ───────────────────────────────────────

export const INTEGRATION_STATUS: Record<
  IntegrationStatus,
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ACTIVE: { label: 'Activo', intent: 'success' },
  INACTIVE: { label: 'Inactivo', intent: 'neutral' },
  ERROR: { label: 'Erro', intent: 'danger' },
  PENDING_AUTH: { label: 'Aguarda Auth', intent: 'warning' },
  RATE_LIMITED: { label: 'Limite Atingido', intent: 'warning' },
  CONFIGURING: { label: 'Em Configuração', intent: 'neutral' },
  SUSPENDED: { label: 'Suspensa', intent: 'warning' },
};

export const SEVERITY: Record<
  AlertSeverity,
  { label: string; intent: 'danger' | 'warning' | 'info'; border: string }
> = {
  CRITICAL: { label: 'Crítico', intent: 'danger', border: 'border-l-danger' },
  WARNING: { label: 'Aviso', intent: 'warning', border: 'border-l-warning' },
  INFO: { label: 'Info', intent: 'info', border: 'border-l-info' },
};
