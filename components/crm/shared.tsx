// components/crm/shared.tsx
// Peças de apresentação partilhadas pelos 3 sub-módulos do CRM
// (funders/partners/beneficiaries) — antes duplicadas em cada page.tsx:
// `Info`, `Field` e `formatDate` existiam em 4 cópias quase-idênticas, e o
// financiador tinha ainda um `money()` local. Ver memory
// project_innova_component_separation_audit.

import type { ReactNode } from 'react';
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

interface InfoProps {
  label: string;
  value: string | null | undefined;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
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
      <span className="text-xs text-gray-500 uppercase">{label}</span>
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
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 5 }: ListSkeletonProps) {
  return (
    <div className="p-6 space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
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
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex justify-between">
        <span>{message}</span>
        <button onClick={onRetry} className="underline">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
