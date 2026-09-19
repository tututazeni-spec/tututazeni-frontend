// components/trainings/ReportsView.tsx
// Separador "Relatórios" (docs/trainings-detalhado.md pt.10) — serve
// Academia, RH e Administração: execução do plano, participantes, horas,
// formações por categoria/modalidade/formador, custos, satisfação/NPS,
// eficácia, competências desenvolvidas, certificados. Filtros (ano/
// modalidade) + exportação CSV, mesmo padrão de filtros de CalendarView.tsx.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonVariants } from '@/components/ui/Button';
import { TYPE_CFG } from './constants';
import type { TrainingReport } from './types';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_ITEMS = [
  { value: 'ALL', label: 'Todos os anos' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = CURRENT_YEAR - i;
    return { value: String(y), label: String(y) };
  }),
];

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  ...Object.entries(TYPE_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
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
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span
            className="w-32 shrink-0 truncate font-body text-xs text-ink-muted"
            title={r.label}
          >
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((r.count / max) * 100)}%` }}
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

export function ReportsView() {
  const [year, setYear] = useState('ALL');
  const [modality, setModality] = useState('ALL');

  const params: Record<string, string | number | undefined> = {};
  if (year !== 'ALL') params.year = year;
  if (modality !== 'ALL') params.modality = modality;

  const { data, isLoading } = useApiQuery<TrainingReport>(
    queryKeys.trainings.reports(params),
    '/trainings/reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select
            items={YEAR_ITEMS}
            value={year}
            onValueChange={setYear}
            className="w-40"
          />
          <Select
            items={MODALITY_ITEMS}
            value={modality}
            onValueChange={setModality}
            className="w-48"
          />
        </div>
        <a
          href={`/api/trainings/reports/export${exportQuery ? `?${exportQuery}` : ''}`}
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
              label="Formações"
              value={data.totals.trainings}
              intent="primary"
            />
            <KpiCard
              label="Planeadas"
              value={data.totals.planned}
              intent="info"
            />
            <KpiCard
              label="Publicadas"
              value={data.totals.published}
              intent="info"
            />
            <KpiCard
              label="Concluídas"
              value={data.totals.completed}
              intent="success"
            />
            <KpiCard
              label="Canceladas"
              value={data.totals.cancelled}
              intent="danger"
            />
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Participantes
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Inscritos"
                value={data.participants.enrolled}
                intent="primary"
              />
              <KpiCard
                label="Concluíram"
                value={data.participants.completed}
                intent="success"
              />
              <KpiCard
                label="Não concluíram"
                value={data.participants.notCompleted}
                intent="warning"
              />
              <KpiCard
                label="Cancelados"
                value={data.participants.cancelled}
                intent="danger"
              />
              <KpiCard
                label="Taxa de participação"
                value={`${data.participants.participationRate}%`}
                intent="info"
              />
              <KpiCard
                label="Taxa de conclusão"
                value={`${data.participants.completionRate}%`}
                intent="success"
              />
              <KpiCard label="Horas de formação" value={data.hours.total} />
              <KpiCard
                label="Execução do plano"
                value={`${data.planExecution.rate}%`}
                intent="primary"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Custos
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Custo total" value={formatKz(data.costs.total)} />
              <KpiCard
                label="Custo/participante"
                value={formatKz(data.costs.perParticipant)}
              />
              <KpiCard
                label="Custo/hora"
                value={formatKz(data.costs.perHour)}
              />
              <KpiCard
                label="Execução orçamental"
                value={`${data.costs.budgetExecutionRate}%`}
                intent="warning"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Satisfação e eficácia
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Satisfação média"
                value={
                  data.satisfaction.avgRating != null
                    ? `${data.satisfaction.avgRating} / 5`
                    : '—'
                }
                intent="accent"
              />
              <KpiCard
                label="NPS"
                value={
                  data.satisfaction.nps != null ? data.satisfaction.nps : '—'
                }
                intent="warning"
              />
              <KpiCard
                label="Taxa de aprovação"
                value={`${data.efficacy.approvalRate}%`}
                intent="success"
              />
              <KpiCard
                label="Competências desenvolvidas"
                value={data.competenciesDeveloped}
              />
              <KpiCard
                label="Certificados emitidos"
                value={data.certificatesIssued}
                intent="primary"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Por categoria
              </div>
              <RankedList
                rows={data.byCategory.map((c) => ({
                  label: c.category,
                  count: c.count,
                }))}
                empty="Sem categorias"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Por modalidade
              </div>
              <RankedList
                rows={data.byModality.map((m) => ({
                  label:
                    TYPE_CFG[m.modality as keyof typeof TYPE_CFG]?.label ??
                    m.modality,
                  count: m.count,
                }))}
                empty="Sem modalidades"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Por formador
              </div>
              <RankedList
                rows={data.byInstructor.map((i) => ({
                  label: i.instructor,
                  count: i.count,
                }))}
                empty="Sem formadores"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Horas por departamento
            </div>
            <RankedList
              rows={data.hours.byDepartment.map((d) => ({
                label: d.department,
                count: d.hours,
              }))}
              empty="Sem horas registadas"
            />
          </Card>
        </>
      )}
    </div>
  );
}
