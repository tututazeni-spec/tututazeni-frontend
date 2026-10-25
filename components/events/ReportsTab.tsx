// components/events/ReportsTab.tsx
// Separador "Relatórios" (docs/events.md secção 11) — indicadores e análise
// de todos os eventos. GET /events/reports/overview (ADMIN/RH/GESTOR),
// mesmo padrão de components/trainings/ReportsView.tsx: filtros + KPIs +
// RankedList local (breakdowns) + exportação CSV.

'use client';

import { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  LogIn,
  MailCheck,
  Megaphone,
  Radio,
  Receipt,
  ThumbsUp,
  UserCheck,
  UserPlus,
  UserX,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { ThermometerStatCard } from '@/components/ui/charts/ThermometerStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonVariants } from '@/components/ui/Button';
import { MODALITY_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import {
  useDepartmentOptions,
  useEventPickerOptions,
  useUnitOptions,
} from './eventFormData';
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
  ...Object.entries(TYPE_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

// Faixas do velocímetro de satisfação (escala 0–5), como no módulo Formações.
const SATISFACTION_BANDS = [
  { to: 1, color: '#c0392b' },
  { to: 2, color: '#e67e22' },
  { to: 3, color: '#f1c40f' },
  { to: 4, color: '#8fc23f' },
  { to: 5, color: '#2f9e63' },
];

// Uma cor por linha (cicla se houver mais linhas do que cores).
const ROW_COLORS = [
  '#1f6fb8',
  '#2f9e63',
  '#d6963a',
  '#b3432e',
  '#7c4dbd',
  '#0f9d9a',
  '#d6527f',
  '#6b8e23',
  '#e67e22',
  '#4a5fc1',
];

function RankedList({
  rows,
  empty,
}: {
  rows: { label: string; count: number }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center font-body text-sm text-ink-faint">
        {empty}
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2 p-4">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span
            className="w-32 shrink-0 truncate font-body text-xs text-ink-muted"
            title={r.label}
          >
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((r.count / max) * 100)}%`,
                backgroundColor: ROW_COLORS[i % ROW_COLORS.length],
              }}
            />
          </div>
          <span className="w-8 text-right font-mono text-xs text-ink-faint">
            {r.count}
          </span>
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
    departmentId:
      filters.departmentId === 'ALL' ? undefined : filters.departmentId,
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
            items={[
              { value: 'ALL', label: 'Todos os eventos' },
              ...eventOptions,
            ]}
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
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={filters.departmentId}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, departmentId: v }))
            }
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todas as unidades' },
              ...unitOptions,
            ]}
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
        <Skeleton
          rows={3}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-24 rounded-card"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard
              tab="events"
              icon={CalendarDays}
              label="Eventos"
              value={data.totals.events}
              intent="primary"
            />
            <KpiCard
              tab="events"
              icon={Megaphone}
              label="Publicados"
              value={data.totals.published}
              intent="info"
            />
            <KpiCard
              tab="events"
              icon={Radio}
              label="Ao vivo"
              value={data.totals.live}
              intent="danger"
            />
            <KpiCard
              tab="events"
              icon={CheckCircle2}
              label="Concluídos"
              value={data.totals.ended}
              intent="success"
            />
            <KpiCard
              tab="events"
              icon={XCircle}
              label="Cancelados"
              value={data.totals.cancelled}
              intent="warning"
            />
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Participação
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                tab="participants"
                icon={UserPlus}
                label="Inscritos"
                value={data.registration.registered}
                intent="primary"
              />
              <SpeedometerStatCard
                label="Taxa de inscrição"
                value={data.registration.rate}
                bands={RATE_BANDS}
                display={`${Math.round(data.registration.rate)}%`}
              />
              <KpiCard
                tab="participants"
                icon={MailCheck}
                label="Confirmados"
                value={data.confirmation.confirmed}
                intent="info"
              />
              <SpeedometerStatCard
                label="Taxa de confirmação"
                value={data.confirmation.rate}
                bands={RATE_BANDS}
                display={`${Math.round(data.confirmation.rate)}%`}
              />
              <KpiCard
                tab="checkin-attendance"
                icon={UserCheck}
                label="Presentes"
                value={data.participation.present}
                intent="success"
              />
              <SpeedometerStatCard
                label="Taxa de participação"
                value={data.participation.rate}
                bands={RATE_BANDS}
                display={`${Math.round(data.participation.rate)}%`}
              />
              <KpiCard
                tab="checkin-attendance"
                icon={UserX}
                label="Ausências"
                value={data.participation.absences}
                intent="danger"
              />
              <KpiCard
                tab="checkin-attendance"
                icon={LogIn}
                label="Check-ins realizados"
                value={data.checkins.total}
                intent="primary"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Presença por sessão
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard
                tab="participants"
                icon={ClipboardList}
                label="Registadas"
                value={data.sessionAttendance.total}
                intent="primary"
              />
              <KpiCard
                icon={LogIn}
                label="Com check-in"
                value={data.sessionAttendance.checkedIn}
                intent="success"
              />
              <DonutStatCard label="Taxa" value={data.sessionAttendance.rate} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Custos
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard
                icon={Wallet}
                label="Orçamento"
                value={formatKz(data.costs.budget)}
                intent="primary"
              />
              <KpiCard
                icon={Receipt}
                label="Custo real"
                value={formatKz(data.costs.actualCost)}
                intent="warning"
              />
              <ThermometerStatCard
                label="Execução orçamental"
                value={data.costs.budgetExecutionRate}
                bands={RATE_BANDS}
                display={`${Math.round(data.costs.budgetExecutionRate)}%`}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Satisfação
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SpeedometerStatCard
                label="Satisfação média"
                value={data.satisfaction.avgRating ?? 0}
                max={5}
                bands={SATISFACTION_BANDS}
                display={
                  data.satisfaction.avgRating != null
                    ? Number(data.satisfaction.avgRating).toFixed(1)
                    : '—'
                }
                caption="em 5.0"
              />
              <KpiCard
                tab="evaluation"
                icon={ThumbsUp}
                label="NPS do evento"
                value={data.nps.avg != null ? data.nps.avg : '—'}
                intent="success"
              />
              <SpeedometerStatCard
                label="Avaliação dos oradores"
                value={data.speakers.avgRating ?? 0}
                max={5}
                bands={SATISFACTION_BANDS}
                display={
                  data.speakers.avgRating != null
                    ? Number(data.speakers.avgRating).toFixed(1)
                    : '—'
                }
                caption="em 5.0"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden p-0">
              <div className="cursor-default select-none border-b border-border bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
                Por unidade
              </div>
              <RankedList
                rows={data.byUnit.map((u) => ({
                  label: u.unit,
                  count: u.count,
                }))}
                empty="Sem unidades"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="cursor-default select-none border-b border-border bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
                Por departamento
              </div>
              <RankedList
                rows={data.byDepartment.map((d) => ({
                  label: d.department,
                  count: d.count,
                }))}
                empty="Sem departamentos"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="cursor-default select-none border-b border-border bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
                Presencial / online / híbrido
              </div>
              <RankedList
                rows={data.byModality.map((m) => ({
                  label:
                    MODALITY_CFG[m.modalidade as keyof typeof MODALITY_CFG]
                      ?.label ?? m.modalidade,
                  count: m.count,
                }))}
                empty="Sem eventos"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="cursor-default select-none border-b border-border bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
              Participantes por evento
            </div>
            <RankedList
              rows={data.topEventsByParticipants.map((e) => ({
                label: e.title,
                count: e.participants,
              }))}
              empty="Sem eventos"
            />
          </Card>
        </>
      )}
    </div>
  );
}
