// components/trainings/DashboardView.tsx
// Separador "Visão Geral" (docs/trainings-detalhado.md pt.1) — KPIs de
// formações/participantes, próximas sessões, indicadores e top
// treinamentos. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime, formatKz } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from './StarRating';
import { TYPE_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.trainings.adminDashboard(),
    '/trainings/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* Formações */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <KpiCard label="Total formações" value={data.trainings.total} intent="primary" />
        <KpiCard label="Planeadas" value={data.trainings.planned} intent="info" />
        <KpiCard label="Agendadas" value={data.trainings.scheduled} intent="info" />
        <KpiCard label="Em curso" value={data.trainings.inProgress} intent="warning" />
        <KpiCard label="Concluídas" value={data.trainings.completed} intent="success" />
        <KpiCard label="Canceladas" value={data.trainings.cancelled} intent="danger" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Turmas activas" value={data.trainings.activeClasses} />
        <KpiCard label="Formadores activos" value={data.activeInstructors} />
        <KpiCard label="Salas em utilização" value={data.roomsInUse} />
        <KpiCard label="Obrigatórias" value={data.trainings.mandatory} intent="danger" />
      </div>

      {/* Participantes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="mb-1 font-body text-xs text-ink-faint">Participantes inscritos</div>
          <div className="font-mono text-3xl font-bold text-ink">{data.participants.registered}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 font-body text-xs text-ink-faint">Em formação</div>
          <div className="font-mono text-3xl font-bold text-ink">{data.participants.inTraining}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 font-body text-xs text-ink-faint">Concluídos</div>
          <div className="font-mono text-3xl font-bold text-ink">{data.participants.completed}</div>
        </Card>
      </div>

      {/* Indicadores */}
      <div>
        <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Indicadores
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Taxa de conclusão" value={`${data.completionRate}%`} intent="success" />
          <KpiCard label="Taxa de participação" value={`${data.participationRate}%`} intent="info" />
          <KpiCard label="Taxa de aprovação" value={`${data.approvalRate}%`} intent="info" />
          <KpiCard label="Execução do plano" value={`${data.planExecutionRate}%`} intent="primary" />
          <KpiCard label="Execução orçamental" value={`${data.budgetExecutionRate}%`} intent="warning" />
          <KpiCard label="Horas/colaborador" value={data.hoursPerEmployee} />
          <KpiCard label="Custo/participante" value={formatKz(data.costPerParticipant)} />
          <KpiCard label="Custo/hora" value={formatKz(data.costPerHour)} />
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-1 font-body text-xs text-ink-faint">Satisfação média</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-3xl font-bold text-accent">{data.avgRating.toFixed(1)}</div>
          <StarRating value={data.avgRating} />
        </div>
      </Card>

      {/* Próximas sessões */}
      {data.upcomingSessions.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Próximas sessões
          </div>
          {data.upcomingSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">{s.title}</div>
                <div className="font-body text-xs text-ink-faint">
                  {formatDateTime(s.date)}
                  {s.location ? ` · ${s.location}` : ''}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Top */}
      {data.topTrainings.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Mais populares
          </div>
          {data.topTrainings.map((t, idx) => (
            <div
              key={t.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-6 text-center font-mono text-lg font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {t.title}
                </div>
                <div className="flex items-center gap-2 font-body text-xs text-ink-faint">
                  <span className={`${TYPE_CFG[t.type].cls} rounded px-1.5`}>
                    {TYPE_CFG[t.type].icon}
                  </span>
                  <span>{t._count.participants} inscritos</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
