// components/onboarding/OverviewTab.tsx
// Separador "Visão Geral" (docs/onboarding.md ponto 1) — KPIs, breakdown
// por estado/departamento/unidade/responsável, próximas entradas e lista
// de onboardings activos. Sucessor de DashboardView.tsx (Fase A do
// remodelo), mesmos dados + apresentação, com os KPIs em falta face ao
// spec acrescentados (taxa de conclusão, documentos/formações pendentes,
// novos colaboradores, avaliações de integração pendentes, breakdowns).

'use client';

import { useState } from 'react';
import {
  AlarmClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Smile,
  UserPlus,
  Users,
  Circle,
  Loader,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { type NavyStatTone } from '@/components/ui/NavyStatCard';
import { NavyStatGroupCard } from '@/components/ui/NavyStatGroupCard';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { Dashboard } from './types';

const STATUS_CARD: Record<string, { icon: LucideIcon; tone: NavyStatTone }> = {
  NOT_STARTED: { icon: Circle, tone: 'blue' },
  IN_PROGRESS: { icon: Loader, tone: 'orange' },
  COMPLETED: { icon: CheckCircle2, tone: 'green' },
  ABANDONED: { icon: XCircle, tone: 'red' },
  ON_HOLD: { icon: PauseCircle, tone: 'orange' },
};

// Mesma grelha no cabeçalho e nas linhas (desenho da lista de Avaliações 360°).
const ACTIVE_GRID =
  'grid grid-cols-[minmax(0,2.4fr)_minmax(0,0.5fr)_minmax(0,0.8fr)_minmax(0,1.1fr)] items-center gap-x-4 px-4';

const UPCOMING_GRID =
  'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)] items-center gap-x-4 px-4';

// Uma cor por linha (cíclica), para distinguir departamentos/unidades/responsáveis.
const BAR_COLORS = [
  'bg-[#2563EB]',
  'bg-[#16A34A]',
  'bg-[#F59E0B]',
  'bg-danger',
  'bg-[#7C3AED]',
  'bg-[#0891B2]',
  'bg-[#DB2777]',
  'bg-[#65A30D]',
];

function RankedList({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...sorted.map(([, n]) => n), 1);
  return (
    <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      <div className="bg-brand-dark px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </div>
      {sorted.length === 0 ? (
        <div className="p-4">
          <EmptyState variant="inline" title="Sem dados" />
        </div>
      ) : (
        sorted.map(([label, count], i) => (
          <div
            key={label}
            className="flex items-center gap-3 border-b border-brand-line bg-surface px-4 py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken"
          >
            <span
              className="w-28 shrink-0 truncate font-semibold text-ink"
              title={label}
            >
              {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.round((count / max) * 100)}%` }}
              />
            </div>
            <span className="w-6 text-right text-ink">{count}</span>
          </div>
        ))
      )}
    </div>
  );
}

export interface OverviewTabProps {
  /** ADMIN/RH: passa para o detalhe do plano a acção "Remover plano". */
  canManagePlan?: boolean;
  /** ADMIN/RH/GESTOR: aprovar / rejeitar / saltar tarefas no detalhe. */
  canManageTasks?: boolean;
}

export function OverviewTab({
  canManagePlan = false,
  canManageTasks = false,
}: OverviewTabProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.onboarding.dashboard(),
    '/onboarding/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card"
      />
    );

  const { summary, active, upcomingStarts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          tab="plans"
          icon={Users}
          label="Total de integrações"
          value={summary.total}
          intent="info"
        />
        <KpiCard
          tab="plans"
          icon={UserPlus}
          label="Novos colaboradores (30d)"
          value={summary.newHires}
          intent="success"
        />
        <DonutStatCard
          label="Taxa de conclusão"
          value={summary.completionRate}
          color="#1877F2"
        />
        <KpiCard
          tab="tasks"
          icon={AlarmClock}
          label="Tarefas atrasadas"
          value={summary.overdueTasks}
          intent="danger"
        />
        <KpiCard
          tab="documents"
          icon={FileText}
          label="Documentos pendentes"
          value={summary.pendingDocuments}
          intent="warning"
        />
        <KpiCard
          tab="training"
          icon={GraduationCap}
          label="Formações pendentes"
          value={summary.pendingTrainings}
          intent="warning"
        />
        <KpiCard
          tab="integration-evaluations"
          icon={ClipboardCheck}
          label="Avaliações de integração pendentes"
          value={summary.pendingIntegrationEvals}
          intent="warning"
        />
        <KpiCard
          tab="reports"
          icon={Smile}
          label="Satisfação média"
          value={
            summary.avgSurveyScore > 0 ? `${summary.avgSurveyScore}/5` : '—'
          }
          intent="warning"
          iconIntent="caution"
        />
      </div>

      {/* Status breakdown */}
      <NavyStatGroupCard
        title="Integrações dos Colaboradores por Estado"
        items={Object.entries(STATUS_CFG).map(([status, cfg]) => {
          const look = STATUS_CARD[status] ?? STATUS_CARD.NOT_STARTED;
          return {
            key: status,
            icon: look.icon,
            tone: look.tone,
            label: cfg.label,
            value: summary.byStatus[status] ?? 0,
          };
        })}
      />

      {/* Breakdowns */}
      <div className="grid grid-cols-3 gap-3">
        <RankedList
          title="Onboardings por departamento"
          rows={Object.entries(summary.byDepartment)}
        />
        <RankedList
          title="Onboardings por unidade"
          rows={Object.entries(summary.byUnit)}
        />
        <RankedList
          title="Onboardings por responsável"
          rows={Object.entries(summary.byResponsible)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Próximas entradas */}
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <div
            className={cn(
              UPCOMING_GRID,
              'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
            )}
          >
            <div>Colaborador</div>
            <div>Início</div>
          </div>
          {upcomingStarts.length === 0 ? (
            <EmptyState
              title="Sem entradas agendadas"
              description="Não há colaboradores com data de início futura"
              className="border-0 rounded-none"
            />
          ) : (
            upcomingStarts.map((p) => (
              <div
                key={p.id}
                className={cn(
                  UPCOMING_GRID,
                  'border-b border-brand-line bg-surface py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken',
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    name={p.user.fullName}
                    url={p.user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="break-words font-semibold text-ink">
                      {p.user.fullName}
                    </div>
                    <div className="break-words text-xs text-ink-muted">
                      {p.template.name}
                    </div>
                  </div>
                </div>
                <div className="text-ink">{fmtDate(p.startDate)}</div>
              </div>
            ))
          )}
        </div>

        {/* Colaboradores activos */}
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          {/* Mesmo desenho da lista de Avaliações 360° (evaluation360). */}
          <div
            className={cn(
              ACTIVE_GRID,
              'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
            )}
          >
            <div>Colaborador</div>
            <div className="text-right">Dia</div>
            <div className="text-right">Progresso</div>
            <div>Estado</div>
          </div>
          {active.map((plan) => (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(plan.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDetailId(plan.id);
                }
              }}
              className={cn(
                ACTIVE_GRID,
                'cursor-pointer border-b border-brand-line bg-surface py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={plan.user.fullName}
                  url={plan.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="break-words font-semibold text-ink">
                    {plan.user.fullName}
                  </div>
                  <div className="break-words text-xs text-ink-muted">
                    {plan.user.position?.name ?? '—'} ·{' '}
                    {plan.user.department?.name ?? '—'}
                  </div>
                </div>
              </div>
              <div className="text-right text-ink">{plan.daysIn ?? 0}</div>
              <div className="text-right text-ink">{plan.progress ?? 0}%</div>
              <div>
                {plan.status !== 'NOT_STARTED' && (
                  <StatusBadge value={plan.status} map={STATUS_CFG} />
                )}
              </div>
            </div>
          ))}
          {active.length === 0 && (
            <EmptyState
              title="Sem onboardings activos"
              description="Não há colaboradores em processo de integração no momento"
              className="border-0 rounded-none"
            />
          )}
        </div>
      </div>

      {detailId !== null && (
        <PlanDetailModal
          planId={detailId}
          canManagePlan={canManagePlan}
          canManageTasks={canManageTasks}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
