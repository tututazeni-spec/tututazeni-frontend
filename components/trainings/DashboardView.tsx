// components/trainings/DashboardView.tsx
// Separador "Visão Geral" (docs/trainings-detalhado.md pt.1) — KPIs de
// formações/participantes, próximas sessões, indicadores e top
// treinamentos. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import {
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DoorOpen,
  GraduationCap,
  Percent,
  PlayCircle,
  ShieldAlert,
  Smile,
  UserCheck,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime, formatKz } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import {
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { WalletStat } from '@/components/roi-impact/WalletStat';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={BookOpen}
          label="Total formações"
          value={data.trainings.total}
          intent="primary"
        />
        <KpiCard
          icon={ClipboardList}
          label="Planeadas"
          value={data.trainings.planned}
          intent="info"
        />
        <KpiCard
          icon={CalendarClock}
          label="Agendadas"
          value={data.trainings.scheduled}
          intent="info"
        />
        <KpiCard
          icon={PlayCircle}
          label="Em curso"
          value={data.trainings.inProgress}
          intent="warning"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Concluídas"
          value={data.trainings.completed}
          intent="success"
        />
        <KpiCard
          icon={XCircle}
          label="Canceladas"
          value={data.trainings.cancelled}
          intent="danger"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={UsersRound}
          label="Turmas activas"
          value={data.trainings.activeClasses}
        />
        <KpiCard
          icon={UserCheck}
          label="Formadores activos"
          value={data.activeInstructors}
        />
        <KpiCard
          icon={DoorOpen}
          label="Salas em utilização"
          value={data.roomsInUse}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Obrigatórias"
          value={data.trainings.mandatory}
          intent="danger"
        />
      </div>

      {/* Participantes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Users}
          label="Participantes inscritos"
          value={data.participants.registered}
          intent="primary"
        />
        <KpiCard
          icon={GraduationCap}
          label="Em formação"
          value={data.participants.inTraining}
          intent="warning"
        />
        <KpiCard
          icon={BadgeCheck}
          label="Participações concluídas"
          value={data.participants.completed}
          intent="success"
        />
      </div>

      {/* Indicadores */}
      <div>
        <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Indicadores
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SpeedometerStatCard
            label="Taxa de conclusão"
            value={data.completionRate}
            bands={RATE_BANDS}
            display={`${Math.round(data.completionRate)}%`}
          />
          <SpeedometerStatCard
            label="Taxa de participação"
            value={data.participationRate}
            bands={RATE_BANDS}
            display={`${Math.round(data.participationRate)}%`}
          />
          <SpeedometerStatCard
            label="Taxa de aprovação"
            value={data.approvalRate}
            bands={RATE_BANDS}
            display={`${Math.round(data.approvalRate)}%`}
          />
          <NavyStatCard
            icon={Smile}
            label="Satisfação média"
            value={data.avgRating.toFixed(1)}
            sub="em 5.0"
            tone={
              data.avgRating >= 4
                ? 'green'
                : data.avgRating >= 3
                  ? 'orange'
                  : 'red'
            }
          />
          <DonutStatCard
            label="Execução do plano"
            value={data.planExecutionRate}
          />
          <DonutStatCard
            label="Execução orçamental"
            value={data.budgetExecutionRate}
          />
          <KpiCard
            icon={Clock}
            label="Horas/colaborador"
            value={data.hoursPerEmployee}
          />
          <WalletStat
            zoom
            money="bills"
            tone="red"
            label="Custo/participante"
            value={formatKz(data.costPerParticipant)}
          />
          <WalletStat
            zoom
            money="coins"
            tone="red"
            label="Custo/hora"
            value={formatKz(data.costPerHour)}
          />
        </div>
      </div>

      {/* Próximas sessões */}
      {data.upcomingSessions.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
            Próximas sessões
          </div>
          {data.upcomingSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {s.title}
                </div>
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
          <div className="bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
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
