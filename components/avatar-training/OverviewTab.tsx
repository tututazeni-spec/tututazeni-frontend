// components/avatar-training/OverviewTab.tsx
// Visão Geral (docs/Avatar_Training.md §3): indicadores com fórmula/fonte/período,
// «Sem dados» quando não existem dados e alertas. GET /avatar-training/overview.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AvatarProgram, Indicator, Overview } from './types';

const SCOPE_LABEL = {
  ALL: 'Toda a organização',
  TEAM: 'A sua equipa',
  SELF: 'Os seus dados',
} as const;

const ALL = 'ALL';

function OverviewFilters({
  from,
  to,
  departmentId,
  programId,
  onChange,
}: {
  from: string;
  to: string;
  departmentId: string;
  programId: string;
  onChange: (patch: Partial<Record<'from' | 'to' | 'departmentId' | 'programId', string>>) => void;
}) {
  const deptParams = { limit: 200 };
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const programs = useApiQuery<AvatarProgram[]>(
    queryKeys.avatarTraining.programs({}),
    '/avatar-training/programs',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="De" htmlFor="ov-from">
        <Input
          id="ov-from"
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </FormField>
      <FormField label="Até" htmlFor="ov-to">
        <Input
          id="ov-to"
          type="date"
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </FormField>
      <FormField label="Departamento" htmlFor="ov-dept">
        <Select
          value={departmentId}
          onValueChange={(v) => onChange({ departmentId: v })}
          items={[
            { value: ALL, label: 'Todos' },
            ...(depts.data?.data ?? []).map((d) => ({
              value: String(d.id),
              label: d.name,
            })),
          ]}
        />
      </FormField>
      <FormField label="Formação" htmlFor="ov-prog">
        <Select
          value={programId}
          onValueChange={(v) => onChange({ programId: v })}
          items={[
            { value: ALL, label: 'Todas' },
            ...(programs.data ?? []).map((p) => ({
              value: String(p.id),
              label: p.title,
            })),
          ]}
        />
      </FormField>
    </div>
  );
}

function IndicatorCard({ i }: { i: Indicator }) {
  const noData = i.status !== 'OK' || i.value === null;
  return (
    <Card className="p-4" title={`${i.formula}\nFonte: ${i.source}`}>
      <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {i.label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink">
        {i.status === 'RESTRICTED'
          ? 'Restrito'
          : noData
            ? 'Sem dados'
            : i.value}
      </div>
      {!noData && (
        <div className="font-body text-xs text-ink-muted">{i.unit}</div>
      )}
      <p className="mt-2 line-clamp-2 font-body text-[11px] text-ink-faint">
        {i.formula}
      </p>
      <p className="mt-1 font-body text-[11px] text-ink-faint">
        Fonte: {i.source} · Actualizado em {formatDateTime(i.updatedAt)}
      </p>
    </Card>
  );
}

export function OverviewTab() {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    departmentId: ALL,
    programId: ALL,
  });
  // Datas locais → limites do dia; o backend usa os últimos 30 dias por omissão.
  const invalidRange = !!filters.from && !!filters.to && filters.from > filters.to;
  const params: Record<string, string | number> = {};
  // Intervalo inválido: ignora as datas (o backend responderia 400 e a aba perderia os filtros).
  if (!invalidRange) {
    if (filters.from) params.from = new Date(`${filters.from}T00:00:00`).toISOString();
    if (filters.to) params.to = new Date(`${filters.to}T23:59:59.999`).toISOString();
  }
  if (filters.departmentId !== ALL) params.departmentId = Number(filters.departmentId);
  if (filters.programId !== ALL) params.programId = Number(filters.programId);

  const { data, isLoading, error, refetch } = useApiQuery<Overview>(
    queryKeys.avatarTraining.overview(params),
    '/avatar-training/overview',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card animate-pulse"
      />
    );

  return (
    <div className="space-y-6">
      <OverviewFilters
        {...filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />
      {invalidRange && (
        <p role="alert" className="font-body text-xs text-danger-ink">
          O início do período é posterior ao fim.
        </p>
      )}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.code}
              role="alert"
              className={`flex items-start gap-2 rounded-card border px-4 py-3 font-body text-sm ${
                a.severity === 'CRITICAL'
                  ? 'border-danger bg-danger-subtle text-danger-ink'
                  : 'border-warning bg-warning-subtle text-warning-ink'
              }`}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.indicators.map((i) => (
          <IndicatorCard key={i.code} i={i} />
        ))}
      </div>

      <p className="font-body text-xs text-ink-faint">
        Âmbito: {SCOPE_LABEL[data.scope]} · Período{' '}
        {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)} ·
        Actualizado em {formatDateTime(data.generatedAt)}
        {data.truncated && ' · Resultados truncados (limite de leitura)'}
      </p>
    </div>
  );
}
