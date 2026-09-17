// components/crm/shared.tsx
// Peças de apresentação partilhadas pelos 3 sub-módulos do CRM
// (funders/partners/beneficiaries) — antes duplicadas em cada page.tsx:
// `Info`, `Field` e `formatDate` existiam em 4 cópias quase-idênticas, e o
// financiador tinha ainda um `money()` local. Ver memory
// project_innova_component_separation_audit.

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate as formatDateShared } from '@/lib/format';

export function formatDate(iso: string | null | undefined): string {
  return formatDateShared(iso);
}

/**
 * Valor monetário com a moeda do próprio registo (financiadores/parceiros
 * podem ter grants/contratos em moedas diferentes de AOA — ao contrário de
 * `lib/format#formatKz`, que assume sempre Kwanza, isto respeita o campo
 * `currency` de cada registo).
 */
export function formatMoney(value: number, currency = 'AOA'): string {
  return `${currency} ${(value || 0).toLocaleString('pt-AO')}`;
}

// ─── Tipos partilhados pelos 3 sub-módulos ──────────────────────────────────
// `Interaction` e `InteractionForm` estavam declarados de forma idêntica em
// partners/types.ts e beneficiaries/types.ts (beneficiaries só acrescenta o
// marcador local `_optimistic`). funders tem uma variante mais estreita — sem
// `satisfaction` — e mantém a sua própria declaração.

export interface CrmInteraction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  satisfaction: number | null;
  user?: { fullName: string } | null;
}

export interface CrmInteractionForm {
  type: string;
  subject: string;
  description: string;
  outcome: string;
  satisfaction: string;
}

interface InfoProps {
  label: string;
  value: string | null | undefined;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-ink-muted uppercase">{label}</p>
      <p className="font-body text-sm text-ink">{value || '—'}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="font-body text-xs font-medium text-ink-muted uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
}

export function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <Card>
      <CardBody>
        <p className="font-body text-xs font-medium text-ink-muted uppercase">{label}</p>
        <p className={cn('font-display text-lg font-bold', color)}>{value}</p>
      </CardBody>
    </Card>
  );
}

interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 5 }: ListSkeletonProps) {
  return (
    <div className="p-6">
      <Skeleton
        rows={rows}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="h-16 bg-surface-sunken rounded-card"
      />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6">
      <Skeleton
        rows={2}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName={cn('rounded-card bg-surface-sunken', 'first:h-24 last:h-64')}
      />
    </div>
  );
}

// ─── Dashboard / Relatório — peças partilhadas pelos 3 sub-módulos ─────────

interface GroupCount {
  _count: { id: number };
  [key: string]: unknown;
}

interface DistributionListProps {
  title: string;
  data: GroupCount[] | undefined;
  labelKey: string;
  /** Traduz o valor bruto do groupBy (ex.: enum) para um rótulo legível. */
  formatLabel?: (value: string) => string;
}

/** Lista label→contagem a partir de um `groupBy` do Prisma (dashboards CRM). */
export function DistributionList({
  title,
  data,
  labelKey,
  formatLabel,
}: DistributionListProps) {
  const rows = data ?? [];
  return (
    <Card>
      <CardBody>
        <h3 className="font-body text-sm font-semibold text-ink mb-3">{title}</h3>
        {rows.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">Sem dados</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const raw = String(row[labelKey] ?? '—');
              return (
                <div key={raw} className="flex justify-between items-center">
                  <span className="font-body text-sm text-ink-muted">
                    {formatLabel ? formatLabel(raw) : raw}
                  </span>
                  <span className="font-body text-sm font-semibold text-ink">
                    {row._count.id}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export interface DateRange {
  start: string;
  end: string;
  [key: string]: string;
}

interface DateRangeFormProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  onSubmit: () => void;
  loading: boolean;
}

/** Selector de período + botão "Gerar", partilhado pelos 3 relatórios CRM. */
export function DateRangeForm({ value, onChange, onSubmit, loading }: DateRangeFormProps) {
  return (
    <Card>
      <CardBody className="flex flex-wrap items-end gap-3">
        <div>
          <label className="font-body text-xs font-medium text-ink-muted uppercase block mb-1">
            Início
          </label>
          <Input
            type="date"
            required
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-medium text-ink-muted uppercase block mb-1">
            Fim
          </label>
          <Input
            type="date"
            required
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
          />
        </div>
        <Button onClick={onSubmit} disabled={!value.start || !value.end} loading={loading}>
          Gerar relatório
        </Button>
      </CardBody>
    </Card>
  );
}

/** Estado local do período do relatório — extraído porque os 3 hooks de
 * relatório (beneficiaries/partners/funders) repetiam a mesma lógica. */
export function useDateRangeReport() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [range, setRange] = useState<DateRange>({ start: firstOfMonth, end: today });
  const [submitted, setSubmitted] = useState<DateRange | null>(null);
  return { range, setRange, submitted, generate: () => setSubmitted(range) };
}

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="p-6">
      <div className="rounded-card border border-danger bg-danger-subtle p-4 flex justify-between">
        <span className="text-danger-ink">{message}</span>
        <button onClick={onRetry} className="underline text-danger-ink">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
