// components/executive-reports/ExecutiveFiltersBar.tsx
// Filtros globais do módulo (docs/Executive_Reports.md §5): período, unidade,
// departamento e comparação. Partilhados por todos os separadores — o estado
// vive na página e é passado a cada painel.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type {
  CompareFilter,
  ExecutiveFilters,
  PeriodFilter,
  Unit,
} from './dashboardTypes';

// Sentinel 'ALL' porque o Select (Radix) não aceita value="" num Item.
const ALL = 'ALL';

const PERIOD_ITEMS: { value: PeriodFilter; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Este trimestre' },
  { value: 'year', label: 'Este ano' },
  { value: 'custom', label: 'Período personalizado' },
];

const COMPARE_ITEMS: { value: CompareFilter; label: string }[] = [
  { value: 'previous', label: 'Período anterior' },
  { value: 'previous_year', label: 'Mesmo período do ano anterior' },
  { value: 'target', label: 'Meta definida' },
];

interface DeptOption {
  id: number;
  name: string;
}

export interface ExecutiveFiltersBarProps {
  filters: ExecutiveFilters;
  onChange: (next: ExecutiveFilters) => void;
  /** Gestores/líderes ficam limitados ao seu departamento no backend. */
  restrictedScope?: boolean;
}

export function ExecutiveFiltersBar({
  filters,
  onChange,
  restrictedScope,
}: ExecutiveFiltersBarProps) {
  const unitsQ = useApiQuery<Unit[]>(queryKeys.departments.units(), '/units', {
    staleTime: STALE_TIME.SEMI_STATIC,
    enabled: !restrictedScope,
  });
  const deptParams = { limit: 200 };
  const deptsQ = useApiQuery<{ data: DeptOption[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    {
      params: deptParams,
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: !restrictedScope,
    },
  );

  const set = (patch: Partial<ExecutiveFilters>) =>
    onChange({ ...filters, ...patch });

  const unitItems = [
    { value: ALL, label: 'Todas as unidades' },
    ...(unitsQ.data ?? []).map((u) => ({
      value: String(u.id),
      label: u.name,
    })),
  ];
  const deptItems = [
    { value: ALL, label: 'Todos os departamentos' },
    ...(deptsQ.data?.data ?? []).map((d) => ({
      value: String(d.id),
      label: d.name,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-4">
      <Select
        className="min-w-[11rem]"
        items={PERIOD_ITEMS}
        value={filters.period}
        onValueChange={(v) => set({ period: v as PeriodFilter })}
      />
      {filters.period === 'custom' && (
        <>
          <Input
            type="date"
            aria-label="Data inicial"
            value={filters.dateFrom ?? ''}
            onChange={(e) => set({ dateFrom: e.target.value || undefined })}
          />
          <Input
            type="date"
            aria-label="Data final"
            value={filters.dateTo ?? ''}
            onChange={(e) => set({ dateTo: e.target.value || undefined })}
          />
        </>
      )}
      {restrictedScope ? (
        <span className="font-body text-sm text-ink-muted">
          Âmbito: o seu departamento
        </span>
      ) : (
        <>
          <Select
            className="min-w-[11rem]"
            items={unitItems}
            value={filters.unitId ? String(filters.unitId) : ALL}
            onValueChange={(v) =>
              set({ unitId: v === ALL ? undefined : Number(v) })
            }
          />
          <Select
            className="min-w-[13rem]"
            items={deptItems}
            value={filters.departmentId ? String(filters.departmentId) : ALL}
            onValueChange={(v) =>
              set({ departmentId: v === ALL ? undefined : Number(v) })
            }
          />
        </>
      )}
      <div className="flex items-center gap-2">
        <span className="font-body text-xs text-ink-muted">Comparar com</span>
        <Select
          className="min-w-[12rem]"
          items={COMPARE_ITEMS}
          value={filters.compareWith}
          onValueChange={(v) => set({ compareWith: v as CompareFilter })}
        />
      </div>
    </div>
  );
}
