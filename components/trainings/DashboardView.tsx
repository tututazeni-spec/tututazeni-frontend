// components/trainings/DashboardView.tsx
// Separador "Visão Geral" (docs/trainings-detalhado.md pt.1) — KPIs de
// formações/participantes, próximas sessões, indicadores e top
// treinamentos. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import {
  Banknote,
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
  Timer,
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
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { SpeedometerChart } from '@/components/ui/charts/SpeedometerChart';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { TYPE_CFG } from './constants';
import type { Dashboard } from './types';

const RATE_THRESHOLDS = { warning: 70, danger: 50 };

// Faixas do velocímetro de satisfação (escala 0–5).
const SATISFACTION_BANDS = [
  { to: 1, color: '#c0392b' },
  { to: 2, color: '#e67e22' },
  { to: 3, color: '#f1c40f' },
  { to: 4, color: '#8fc23f' },
  { to: 5, color: '#2f9e63' },
];

// Mesmo desenho do NavyStatCard (cabeçalho azul-marinho), com gráfico no corpo.
function ChartStatCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[155px] flex-col overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)]">
      <div className="flex min-h-[60px] shrink-0 items-center bg-[#152F59] px-4 py-2">
        <h3 className="font-body text-[13px] font-semibold leading-tight text-white">
          {label}
        </h3>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 py-3">
        {children}
      </div>
    </div>
  );
}

function GaugeStatCard({ label, value }: { label: string; value: number }) {
  return (
    <ChartStatCard label={label}>
      <GaugeChart value={value} thresholds={RATE_THRESHOLDS} size={140} />
    </ChartStatCard>
  );
}

// Rosca de progresso em Card próprio (fora do estilo NavyStatCard): azul escuro
// até 50%, azul claro de 50% até ao valor, cinza no restante, separadores
// brancos entre fatias. Valores acima de 100% enchem o anel.
function DonutStatCard({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const parts = [
    { v: Math.min(pct, 50), color: '#152F59' },
    { v: Math.max(0, pct - 50), color: '#6FA8DC' },
    { v: 100 - pct, color: '#CBD2DC' },
  ].filter((p) => p.v > 0);
  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gap = parts.length > 1 ? 1.5 : 0;
  let offset = 0;
  return (
    <Card className="flex min-h-[155px] flex-col items-center justify-center gap-2 p-4">
      <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </h3>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label}: ${Math.round(value)}%`}
          className="-rotate-90"
        >
          {parts.map((p, i) => {
            const len = (p.v / 100) * circ;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(0, len - gap)} ${circ}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-ink">
          {Math.round(value)}%
        </span>
      </div>
    </Card>
  );
}

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
          <GaugeStatCard
            label="Taxa de conclusão"
            value={data.completionRate}
          />
          <GaugeStatCard
            label="Taxa de participação"
            value={data.participationRate}
          />
          <GaugeStatCard label="Taxa de aprovação" value={data.approvalRate} />
          <Card className="flex min-h-[155px] flex-col items-center justify-center gap-2 p-4">
            <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Satisfação média
            </h3>
            <SpeedometerChart
              value={data.avgRating}
              min={0}
              max={5}
              bands={SATISFACTION_BANDS}
              size={150}
              display={data.avgRating.toFixed(1)}
              label="em 5.0"
            />
          </Card>
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
          <KpiCard
            icon={Banknote}
            label="Custo/participante"
            value={formatKz(data.costPerParticipant)}
          />
          <KpiCard
            icon={Timer}
            label="Custo/hora"
            value={formatKz(data.costPerHour)}
          />
        </div>
      </div>

      {/* Próximas sessões */}
      {data.upcomingSessions.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
