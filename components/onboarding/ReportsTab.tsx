// components/onboarding/ReportsTab.tsx
// Separador "Relatórios" (docs/onboarding.md ponto 10) — mesmo padrão de
// components/trainings/ReportsView.tsx: um endpoint agregado + filtros +
// exportação via link directo para o backend (não uma lib JS
// client-side). ADMIN/RH (GET /onboarding/reports/overview).

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { buttonVariants } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDepartmentOptions, useUnitOptions } from './planData';
import type { OnboardingReportOverview } from './types';

function RankedList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...sorted.map(([, n]) => n), 1);
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</div>
      {sorted.length === 0 ? (
        <p className="py-4 text-center font-body text-sm text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate font-body text-xs text-ink-muted" title={label}>
                {label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs text-ink-faint">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsTab() {
  const [departmentId, setDepartmentId] = useState('ALL');
  const [unitId, setUnitId] = useState('ALL');
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const params: Record<string, string | undefined> = {
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    unitId: unitId === 'ALL' ? undefined : unitId,
  };

  const { data, isLoading } = useApiQuery<OnboardingReportOverview>(
    queryKeys.onboarding.reportsOverview(params),
    '/onboarding/reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  ).toString();
  const qs = exportQuery ? `?${exportQuery}` : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select
            items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
            value={departmentId}
            onValueChange={setDepartmentId}
            className="w-52"
          />
          <Select
            items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
            value={unitId}
            onValueChange={setUnitId}
            className="w-48"
          />
        </div>
        <div className="flex gap-2">
          <a href={`/api/onboarding/reports/export.csv${qs}`} className={buttonVariants({ intent: 'ghost', size: 'sm' })}>
            <Download size={14} strokeWidth={1.75} />
            Exportar CSV
          </a>
          <a href={`/api/onboarding/reports/export.xlsx${qs}`} className={buttonVariants({ intent: 'ghost', size: 'sm' })}>
            <Download size={14} strokeWidth={1.75} />
            Exportar XLSX
          </a>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton rows={3} wrapperClassName="space-y-3" itemClassName="h-24 rounded-card bg-surface-sunken animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Onboardings" value={data.total} intent="primary" />
            <KpiCard label="Taxa de conclusão" value={`${data.completionRate}%`} intent="success" />
            <KpiCard label="Duração média (dias)" value={data.avgDurationDays} intent="info" />
            <KpiCard label="Feedback médio" value={data.avgFeedback > 0 ? `${data.avgFeedback}/5` : '—'} intent="warning" />
            <KpiCard label="Tarefas concluídas" value={data.tasksCompleted} intent="success" />
            <KpiCard label="Tarefas em aberto" value={data.tasksOverdue} intent="warning" />
            <KpiCard label="Documentos pendentes" value={data.documentsPending} intent="warning" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <RankedList title="Por departamento" rows={Object.entries(data.byDepartment)} />
            <RankedList title="Por unidade" rows={Object.entries(data.byUnit)} />
            <RankedList title="Por responsável" rows={Object.entries(data.byResponsible)} />
          </div>
        </>
      )}
    </div>
  );
}
