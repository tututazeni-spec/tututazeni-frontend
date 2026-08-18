// components/dashboard/ColaboradorDashboard.tsx
// Separador "O Meu Dashboard" — dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.
//
// O ProgressBar da fundação é mono-cor (usa sempre bg-accent) — onde o
// design original recolorava a barra para comunicar sentido (nível de
// gamificação, progresso do PDI, evolução de competências), essa
// informação passa para o texto/badge adjacente.

'use client';

import { BookOpen, CheckCircle, Award, Target, Clock, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertBanner } from './AlertBanner';
import { ALERTS_POLL_MS, type Alert, type MyDashboardData } from './types';

export function ColaboradorDashboard() {
  // Duas queries independentes → correm em paralelo (sem waterfall).
  const { data, isLoading } = useApiQuery<MyDashboardData>(
    queryKeys.dashboard.my(),
    '/dashboard/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton
          rows={4}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
          itemClassName="h-24 rounded-card bg-surface-sunken"
        />
        <Skeleton
          rows={2}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
          itemClassName="h-24 rounded-card bg-surface-sunken"
        />
      </div>
    );

  const plan = data?.development?.activePlan;
  const level = data?.gamification?.level;
  const points = data?.gamification?.totalPoints ?? 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Hero: user + points */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-active p-5 text-canvas mb-[2cm]!">
        <div className="flex items-center gap-4">
          {data?.user && (
            <Avatar
              name={data.user.fullName ?? 'U'}
              url={data.user.avatarUrl}
              size="lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">
              {data?.user?.fullName}
            </p>
            <p className="font-body text-sm text-canvas/80">
              {data?.user?.position?.name} · {data?.user?.department?.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1.5 font-display text-xl font-bold text-accent">
              <Zap size={18} strokeWidth={1.75} />
              {points}
            </div>
            <p className="font-body text-xs text-canvas/80">
              {level?.label} · Nível {level?.level}
            </p>
          </div>
        </div>
        {level && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between font-body text-xs text-canvas/80">
              <span>Próximo nível</span>
              <span>
                {points}/{level.nextAt}
              </span>
            </div>
            <ProgressBar value={(points / level.nextAt) * 100} />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={BookOpen}
          label="Cursos em Progresso"
          value={data?.learning?.inProgress ?? 0}
          intent="info"
        />
        <KpiCard
          icon={CheckCircle}
          label="Cursos Concluídos"
          value={data?.learning?.completed ?? 0}
          intent="success"
        />
        <KpiCard
          icon={Award}
          label="Badges Conquistados"
          value={data?.gamification?.recentBadges?.length ?? 0}
          intent="warning"
        />
        <KpiCard
          icon={Target}
          label="Avaliações Pendentes"
          value={data?.engagement?.pendingSurveys ?? 0}
          intent="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* PDI */}
        {plan && (
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-body font-semibold text-ink-muted">
                <Target size={14} strokeWidth={1.75} className="text-primary" />
                PDI Activo
              </h3>
              <span className="rounded-pill bg-info-subtle px-2 py-0.5 font-body text-xs text-info-ink">
                {plan.status}
              </span>
            </div>
            <p className="mb-3 truncate font-body text-sm text-ink-muted">
              {plan.name}
            </p>
            <div className="mb-1 flex justify-between font-body text-xs">
              <span className="text-ink-faint">Progresso</span>
              <span
                className={`font-bold ${plan.progress >= 80 ? 'text-success' : 'text-primary'}`}
              >
                {plan.progress}%
              </span>
            </div>
            <ProgressBar value={plan.progress} />
            <p className="mt-2 font-body text-[10px] text-ink-faint">
              {plan.completedActions} / {plan.goals} acções concluídas
            </p>
          </div>
        )}

        {/* Pending items */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 flex items-center gap-2 font-body font-semibold text-ink-muted">
            <Clock size={14} strokeWidth={1.75} className="text-warning-ink" />
            Pendentes
          </h3>
          {(data?.pendingItems ?? []).length === 0 ? null : (
            <div className="space-y-2">
              {(data?.pendingItems ?? []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 font-body text-sm text-ink-muted"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${item.priority === 'HIGH' ? 'bg-danger' : 'bg-warning'}`}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Competencies radar */}
      {(data?.skills?.length ?? 0) > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 font-body font-semibold text-ink-muted">
            Evolução de Competências
          </h3>
          <div className="space-y-2">
            {(data?.skills ?? []).map((s, i) => (
              <div key={i}>
                <div className="mb-0.5 flex justify-between font-body text-xs">
                  <span className="text-ink-muted">{s.name}</span>
                  <span
                    className={`font-semibold ${s.current >= (s.target ?? 5) ? 'text-success' : 'text-ink'}`}
                  >
                    {s.current}/{s.target ?? 5}
                  </span>
                </div>
                <ProgressBar value={(s.current / (s.target ?? 5)) * 100} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
