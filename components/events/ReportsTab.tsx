// components/events/ReportsTab.tsx
// Separador "Relatórios" (docs/events.md secção 11) — indicadores e análise
// de todos os eventos. GET /events/reports/overview (ADMIN/RH/GESTOR),
// mesmo padrão de components/trainings/ReportsView.tsx: filtros + KPIs +
// RankedList local (breakdowns) + exportação CSV.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonVariants } from '@/components/ui/Button';
import { MODALITY_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { useDepartmentOptions, useEventPickerOptions, useUnitOptions } from './eventFormData';
import type { EventReport } from './types';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_ITEMS = [
  { value: 'ALL', label: 'Todos os anos' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = CURRENT_YEAR - i;
    return { value: String(y), label: String(y) };
  }),
];
const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
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
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((r.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-xs text-ink-faint">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsTab() {
  const eventOptions = useEventPickerOptions('reports');
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const [filters, setFilters] = useState({
    year: 'ALL',
    eventId: 'ALL',
    type: 'ALL',
    departmentId: 'ALL',
    unitId: 'ALL',
    status: 'ALL',
  });

  const params: Record<string, string | undefined> = {
    year: filters.year === 'ALL' ? undefined : filters.year,
    eventId: filters.eventId === 'ALL' ? undefined : filters.eventId,
    type: filters.type === 'ALL' ? undefined : filters.type,
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
    status: filters.status === 'ALL' ? undefined : filters.status,
  };

  const { data, isLoading } = useApiQuery<EventReport>(
    queryKeys.events.reports(params),
    '/events/reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            items={YEAR_ITEMS}
            value={filters.year}
            onValueChange={(v) => setFilters((f) => ({ ...f, year: v }))}
            className="w-32"
          />
          <Combobox
            items={[{ value: 'ALL', label: 'Todos os eventos' }, ...eventOptions]}
            value={filters.eventId}
            onValueChange={(v) => setFilters((f) => ({ ...f, eventId: v }))}
            placeholder="Filtrar por evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="w-56"
          />
          <Select
            items={TYPE_ITEMS}
            value={filters.type}
            onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
          />
          <Select
            items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
            value={filters.departmentId}
            onValueChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}
          />
          <Select
            items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
            value={filters.unitId}
            onValueChange={(v) => setFilters((f) => ({ ...f, unitId: v }))}
          />
          <Select
            items={STATUS_ITEMS}
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
        </div>
        <a
          href={`/api/events/reports/export${exportQuery ? `?${exportQuery}` : ''}`}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard label="Eventos" value={data.totals.events} intent="primary" />
            <KpiCard label="Publicados" value={data.totals.published} intent="info" />
            <KpiCard label="Ao vivo" value={data.totals.live} intent="danger" />
            <KpiCard label="Concluídos" value={data.totals.ended} intent="success" />
            <KpiCard label="Cancelados" value={data.totals.cancelled} intent="warning" />
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Participação
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Inscritos" value={data.registration.registered} intent="primary" />
              <KpiCard label="Taxa de inscrição" value={`${data.registration.rate}%`} intent="info" />
              <KpiCard label="Confirmados" value={data.confirmation.confirmed} intent="info" />
              <KpiCard label="Taxa de confirmação" value={`${data.confirmation.rate}%`} intent="info" />
              <KpiCard label="Presentes" value={data.participation.present} intent="success" />
              <KpiCard label="Taxa de participação" value={`${data.participation.rate}%`} intent="success" />
              <KpiCard label="Ausências" value={data.participation.absences} intent="danger" />
              <KpiCard label="Check-ins realizados" value={data.checkins.total} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Presença por sessão
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard label="Registadas" value={data.sessionAttendance.total} />
              <KpiCard label="Com check-in" value={data.sessionAttendance.checkedIn} intent="success" />
              <KpiCard label="Taxa" value={`${data.sessionAttendance.rate}%`} intent="info" />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Custos
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard label="Orçamento" value={formatKz(data.costs.budget)} />
              <KpiCard label="Custo real" value={formatKz(data.costs.actualCost)} />
              <KpiCard
                label="Execução orçamental"
                value={`${data.costs.budgetExecutionRate}%`}
                intent="warning"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Satisfação
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard
                label="Satisfação média"
                value={data.satisfaction.avgRating != null ? `${data.satisfaction.avgRating} / 5` : '—'}
                intent="accent"
              />
              <KpiCard
                label="NPS do evento"
                value={data.nps.avg != null ? data.nps.avg : '—'}
                intent="warning"
              />
              <KpiCard
                label="Avaliação dos oradores"
                value={data.speakers.avgRating != null ? `${data.speakers.avgRating} / 5` : '—'}
                intent="accent"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Por unidade
              </div>
              <RankedList rows={data.byUnit.map((u) => ({ label: u.unit, count: u.count }))} empty="Sem unidades" />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Por departamento
              </div>
              <RankedList
                rows={data.byDepartment.map((d) => ({ label: d.department, count: d.count }))}
                empty="Sem departamentos"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Presencial / online / híbrido
              </div>
              <RankedList
                rows={data.byModality.map((m) => ({
                  label: MODALITY_CFG[m.modalidade as keyof typeof MODALITY_CFG]?.label ?? m.modalidade,
                  count: m.count,
                }))}
                empty="Sem eventos"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Participantes por evento
            </div>
            <RankedList
              rows={data.topEventsByParticipants.map((e) => ({ label: e.title, count: e.participants }))}
              empty="Sem eventos"
            />
          </Card>
        </>
      )}
    </div>
  );
}
