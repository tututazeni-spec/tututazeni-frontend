// components/dashboard/ManagerDashboard.tsx
// Separador "Gestor" — dados próprios (useApiQuery) + apresentação, mesmo
// padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.
//
// O ProgressBar da fundação é mono-cor — a cor que comunicava "PDI em bom
// ritmo" (progresso ≥ 80%) passa para o texto de percentagem adjacente.
//
// Auditoria (Set/2026): GET /dashboard/manager já calculava e devolvia mais
// dados do que este componente mostrava — KPIs accionáveis (avaliações
// pendentes, ações de PDI atrasadas) e dados por membro (departamento, xp,
// inscrições) ficavam computados no backend e descartados aqui. Ver memory
// project_innova_computed_then_discarded_bugs para o padrão geral.

'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertBanner } from './AlertBanner';
import { ALERTS_POLL_MS, type Alert, type ManagerDashboardData } from './types';

const PERIODS = [
  { id: 'WEEK', label: 'Semana' },
  { id: 'MONTH', label: 'Mês' },
  { id: 'QUARTER', label: 'Trimestre' },
  { id: 'YEAR', label: 'Ano' },
];

type KpiTone = 'blue' | 'green' | 'gold' | 'red' | 'orange';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
const KPI_TONES: Record<KpiTone, { bar: string; text: string }> = {
  blue: { bar: 'bg-blue-500', text: 'text-blue-600' },
  green: { bar: 'bg-green-600', text: 'text-green-600' },
  gold: { bar: 'bg-amber-500', text: 'text-amber-600' },
  red: { bar: 'bg-red-500', text: 'text-red-600' },
  orange: { bar: 'bg-orange-500', text: 'text-orange-600' },
};

function HighlightKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  tone: KpiTone;
}) {
  const t = KPI_TONES[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-resting transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-hover motion-reduce:hover:scale-100">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} />
      <Icon size={26} strokeWidth={1.75} className={`mb-4 ${t.text}`} />
      <div className="flex items-baseline gap-2">
        <p className={`font-display text-4xl font-bold ${t.text}`}>{value}</p>
        {typeof trend === 'number' && trend !== 0 && (
          <span
            className={`font-body text-xs font-semibold ${trend > 0 ? 'text-success' : 'text-danger'}`}
          >
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="mt-1 font-body text-sm text-ink">{label}</p>
      {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

function GaugeKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  percent,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  percent: number;
  tone: KpiTone;
}) {
  const t = KPI_TONES[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const TRACK_COLOR: Record<KpiTone, string> = {
    blue: '#DBEAFE',
    green: '#DCFCE7',
    gold: '#FEF3C7',
    red: '#FEE2E2',
    orange: '#FFEDD5',
  };
  const STROKE_COLOR: Record<KpiTone, string> = {
    blue: '#3B82F6',
    green: '#16A34A',
    gold: '#F59E0B',
    red: '#EF4444',
    orange: '#F97316',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-resting transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-hover motion-reduce:hover:scale-100">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={TRACK_COLOR[tone]}
              strokeWidth="8"
            />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={STROKE_COLOR[tone]}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={20} strokeWidth={1.75} className={t.text} />
          </div>
        </div>
        <div className="min-w-0">
          <p className={`font-display text-3xl font-bold ${t.text}`}>{value}</p>
          <p className="mt-0.5 font-body text-sm text-ink">{label}</p>
          {sub && (
            <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: kpis.inProgressTrend) com o histórico de inscrições em curso
// por período. Enquanto isso, usa-se uma série de exemplo.
const MOCK_ENROLLMENT_TREND = [4, 6, 5, 8, 7, 9, 11];

function SparklineKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend: number[];
  tone: KpiTone;
}) {
  const t = KPI_TONES[tone];
  const width = 100;
  const height = 32;
  const max = Math.max(...trend, 1);
  const min = Math.min(...trend, 0);
  const range = max - min || 1;
  const points = trend
    .map((v, i) => {
      const x = (i / Math.max(trend.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  const lastY = height - ((trend[trend.length - 1] - min) / range) * height;

  const STROKE_COLOR: Record<KpiTone, string> = {
    blue: '#3B82F6',
    green: '#16A34A',
    gold: '#F59E0B',
    red: '#EF4444',
    orange: '#F97316',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-resting transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-hover motion-reduce:hover:scale-100">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Icon size={26} strokeWidth={1.75} className={`mb-4 ${t.text}`} />
          <p className={`font-display text-4xl font-bold ${t.text}`}>{value}</p>
          <p className="mt-1 font-body text-sm text-ink">{label}</p>
          {sub && (
            <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>
          )}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-1 h-8 w-20 shrink-0"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={STROKE_COLOR[tone]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={width} cy={lastY} r="2.5" fill={STROKE_COLOR[tone]} />
        </svg>
      </div>
    </div>
  );
}

export function ManagerDashboard() {
  const [period, setPeriod] = useState('MONTH');

  const { data, isLoading } = useApiQuery<ManagerDashboardData>(
    queryKeys.dashboard.manager(period),
    '/dashboard/manager',
    { params: { period }, staleTime: STALE_TIME.DYNAMIC },
  );

  // Mesma key de alerts → reutiliza a cache partilhada (não há novo pedido).
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const kpis = data?.kpis ?? {};
  const mandatoryOk = (kpis.mandatoryRate ?? 0) >= 80;
  const hasPendingEvals = (kpis.pendingEvals ?? 0) > 0;
  const hasOverdueActions = (kpis.overdueActions ?? 0) > 0;

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* Period filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            intent={period === p.id ? 'primary' : 'ghost'}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* KPIs — visão geral da equipa */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HighlightKpiCard
          icon={Users}
          tone="blue"
          label="Equipa"
          value={data?.teamSize ?? 0}
        />
        <HighlightKpiCard
          icon={Target}
          tone="green"
          label="PDIs Activos"
          value={kpis.activePlans ?? 0}
          sub={`Cobertura: ${kpis.pdpCoverage ?? 0}% · ${kpis.completedPlans ?? 0} concluídos`}
        />
        <HighlightKpiCard
          icon={Star}
          tone="gold"
          label="Pontuação Média"
          value={kpis.avgScore?.toFixed(1) ?? '–'}
          trend={kpis.scoreTrend}
        />
        <GaugeKpiCard
          icon={GraduationCap}
          tone={mandatoryOk ? 'green' : 'red'}
          label="Formação Obrigatória"
          value={`${kpis.mandatoryRate ?? 0}%`}
          percent={kpis.mandatoryRate ?? 0}
        />
      </div>

      {/* KPIs — accionáveis para o gestor + engagement da equipa */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HighlightKpiCard
          icon={ClipboardList}
          tone={hasPendingEvals ? 'red' : 'green'}
          label="Avaliações Pendentes"
          value={kpis.pendingEvals ?? 0}
          sub="Aguardam a tua avaliação"
        />
        <HighlightKpiCard
          icon={AlarmClock}
          tone={hasOverdueActions ? 'red' : 'green'}
          label="Ações de PDI Atrasadas"
          value={kpis.overdueActions ?? 0}
          sub="Da equipa, prazo já passado"
        />
        <SparklineKpiCard
          icon={BookOpen}
          tone="orange"
          label="Inscrições em Curso"
          value={kpis.inProgress ?? 0}
          sub={`${kpis.completedEnrollments ?? 0} concluídas no período`}
          trend={MOCK_ENROLLMENT_TREND}
        />
        <HighlightKpiCard
          icon={MessageSquare}
          tone="blue"
          label="Engajamento"
          value={kpis.engagementResponses ?? 0}
          sub={`${kpis.avatarSessions ?? 0} sessões de avatar concluídas`}
        />
      </div>

      {/* Team table */}
      <div className="rounded-card border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-body font-semibold text-ink-muted">Equipa</h3>
          <span className="font-body text-xs text-ink-faint">
            {data?.teamSize ?? 0} colaboradores
          </span>
        </div>
        <div className="max-h-80 divide-y divide-border overflow-y-auto">
          {(data?.team ?? []).map((u) => (
            <div
              key={u.user.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-sunken"
            >
              <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-ink">
                  {u.user.fullName}
                </p>
                <p className="font-body text-[10px] text-ink-faint">
                  {[u.user.position?.name, u.user.department?.name]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {u.enrollment && (
                <div className="hidden shrink-0 text-center sm:block">
                  <p className="font-body text-xs font-medium text-ink">
                    {u.enrollment.completed}
                  </p>
                  <p className="font-body text-[9px] text-ink-faint">
                    concluídos
                  </p>
                </div>
              )}
              {typeof u.xp === 'number' && (
                <div className="hidden shrink-0 text-center sm:block">
                  <p className="font-body text-xs font-medium text-ink">
                    {u.xp}
                  </p>
                  <p className="font-body text-[9px] text-ink-faint">xp</p>
                </div>
              )}
              {u.plan && (
                <div className="w-20">
                  <ProgressBar value={u.plan.progress} />
                  <p className="mt-0.5 text-center font-body text-[9px] text-ink-faint">
                    {u.plan.progress}% PDI
                    {u.plan.status ? ` · ${u.plan.status}` : ''}
                  </p>
                </div>
              )}
              {u.lastScore && (
                <span
                  className={`font-body text-sm font-bold ${
                    u.lastScore >= 4
                      ? 'text-success'
                      : u.lastScore >= 2.5
                        ? 'text-warning-ink'
                        : 'text-danger'
                  }`}
                >
                  {u.lastScore.toFixed(1)}
                </span>
              )}
              {u.alert && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-danger"
                  title="Em risco"
                />
              )}
            </div>
          ))}
          {(data?.team?.length ?? 0) === 0 && (
            <div className="py-8 text-center font-body text-sm text-ink-faint">
              Sem equipa directa
            </div>
          )}
        </div>
      </div>

      {/* Manager alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 font-body font-semibold text-ink-muted">
            <AlertTriangle
              size={14}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Alertas da Equipa
          </h3>
          <div className="space-y-2">
            {(data?.alerts ?? []).map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${a.priority === 'URGENT' ? 'bg-danger' : 'bg-warning'}`}
                />
                <p className="font-body text-sm text-ink">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
