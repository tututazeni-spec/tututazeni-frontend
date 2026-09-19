// components/live-classes/ReportsView.tsx
// Separador "Relatórios" (docs/aulas-ao-vivo.md secção 13) — aulas
// realizadas/canceladas, horas ministradas, participantes/presenças/
// ausências/atrasos, avaliação média, desempenho por formador, participação
// por departamento/unidade, horas por colaborador. Exportação CSV — mesmo
// padrão de components/trainings/ReportsView.tsx.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonVariants } from '@/components/ui/Button';
import type { LiveClassesReport } from './types';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_ITEMS = [
  { value: 'ALL', label: 'Todos os anos' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = CURRENT_YEAR - i;
    return { value: String(y), label: String(y) };
  }),
];

function RankedList({ rows, empty }: { rows: { label: string; count: number }[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-center font-body text-sm text-ink-faint">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2 p-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate font-body text-xs text-ink-muted" title={r.label}>
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-xs text-ink-faint">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsView() {
  const [year, setYear] = useState('ALL');

  const params: Record<string, string | number | undefined> = {};
  if (year !== 'ALL') params.year = year;

  const { data, isLoading } = useApiQuery<LiveClassesReport>(
    queryKeys.liveClasses.reports(params),
    '/live-classes/reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select items={YEAR_ITEMS} value={year} onValueChange={setYear} className="w-40" />
        <a
          href={`/api/live-classes/reports/export${exportQuery ? `?${exportQuery}` : ''}`}
          className={buttonVariants({ intent: 'ghost', size: 'sm' })}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar CSV
        </a>
      </div>

      {isLoading || !data ? (
        <Skeleton rows={3} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-24 rounded-card" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Aulas" value={data.totals.classes} intent="primary" />
            <KpiCard label="Realizadas" value={data.totals.completed} intent="success" />
            <KpiCard label="Canceladas" value={data.totals.cancelled} intent="danger" />
            <KpiCard label="Horas ministradas" value={data.totals.hoursDelivered} />
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Participantes e presença
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <KpiCard label="Participantes" value={data.attendance.participants} intent="primary" />
              <KpiCard label="Presenças" value={data.attendance.present} intent="success" />
              <KpiCard label="Ausências" value={data.attendance.absent} intent="danger" />
              <KpiCard label="Atrasos" value={data.attendance.late} intent="warning" />
              <KpiCard label="Taxa de presença" value={`${data.attendance.attendanceRate}%`} intent="info" />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Avaliação
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Avaliação média"
                value={data.avgEvaluation != null ? `${data.avgEvaluation} / 5` : '—'}
                intent="accent"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Desempenho por formador
              </div>
              <RankedList
                rows={data.byInstructor.map((i) => ({ label: i.instructor, count: i.completed }))}
                empty="Sem formadores"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Participação por departamento
              </div>
              <RankedList
                rows={data.byDepartment.map((d) => ({ label: d.department, count: d.count }))}
                empty="Sem departamentos"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Participação por unidade
              </div>
              <RankedList
                rows={data.byUnit.map((u) => ({ label: u.unit, count: u.count }))}
                empty="Sem unidades"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Horas de formação por colaborador (top 20)
            </div>
            <RankedList
              rows={data.hoursByCollaborator.map((h) => ({ label: h.collaborator, count: h.hours }))}
              empty="Sem horas registadas"
            />
          </Card>
        </>
      )}
    </div>
  );
}
