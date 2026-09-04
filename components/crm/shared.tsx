// components/crm/shared.tsx
// Peças de apresentação partilhadas pelos 3 sub-módulos do CRM
// (funders/partners/beneficiaries) — antes duplicadas em cada page.tsx:
// `Info`, `Field` e `formatDate` existiam em 4 cópias quase-idênticas, e o
// financiador tinha ainda um `money()` local. Ver memory
// project_innova_component_separation_audit.

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card, CardBody } from '@/components/ui/Card';
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
