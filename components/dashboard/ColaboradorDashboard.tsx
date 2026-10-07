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

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertBanner } from './AlertBanner';
import { ALERTS_POLL_MS, type Alert, type MyDashboardData } from './types';

// Cartão tipo "curso" (ícone + número em destaque) inspirado nos tiles de
// progresso da Udemy/MasterClass — só usado aqui; o KpiCard partilhado
// (components/ui/KpiCard) mantém-se inalterado para os restantes
// dashboards que o usam.
type KpiTone = 'blue' | 'green' | 'gold' | 'red' | 'orange';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
const KPI_TONES: Record<KpiTone, { bar: string; text: string }> = {
  blue: { bar: 'bg-blue-500', text: 'text-blue-600' },
  green: { bar: 'bg-green-600', text: 'text-green-600' },
  gold: { bar: 'bg-amber-500', text: 'text-amber-600' },
  red: { bar: 'bg-red-500', text: 'text-red-600' },
  orange: { bar: 'bg-orange-500', text: 'text-orange-600' },
};

function CourseStyleKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: KpiTone;
}) {
  const t = KPI_TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-resting transition-shadow duration-150 hover:shadow-hover">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} />
      <Icon size={26} strokeWidth={1.75} className={`mb-4 ${t.text}`} />
      <p className={`font-display text-4xl font-bold ${t.text}`}>{value}</p>
      <p className="mt-1 font-body text-sm text-ink">{label}</p>
    </div>
  );
}

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
      <div className="rounded-2xl bg-[#0F1F3D] p-5 text-canvas mb-[2cm]!">
        <div className="flex items-center gap-4">
          {data?.user && (
            <Avatar
              name={data.user.fullName ?? 'U'}
              url={data.user.avatarUrl}
              size="lg"
              className="-my-2 h-16 w-16 text-base ring-2 ring-canvas/30"
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
        <CourseStyleKpiCard
          icon={BookOpen}
          tone="blue"
          label="Cursos em Progresso"
          value={data?.learning?.inProgress ?? 0}
        />
        <CourseStyleKpiCard
          icon={CheckCircle2}
          tone="green"
          label="Cursos Concluídos"
          value={data?.learning?.completed ?? 0}
        />
        <CourseStyleKpiCard
          icon={Award}
          tone="gold"
          label="Distintivos Conquistados"
          value={data?.gamification?.recentBadges?.length ?? 0}
        />
        <CourseStyleKpiCard
          icon={ClipboardList}
          tone="red"
          label="Avaliações Pendentes"
          value={data?.engagement?.pendingSurveys ?? 0}
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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-resting">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 bg-orange-500"
          />
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-control bg-orange-100 p-2 text-orange-600">
              <Clock size={18} strokeWidth={1.75} />
            </div>
            <h3 className="font-body font-semibold text-ink">Pendentes</h3>
          </div>
          <p className="font-display text-4xl font-bold text-orange-600">
            {(data?.pendingItems ?? []).length}
          </p>
          {(() => {
            const highCount = (data?.pendingItems ?? []).filter(
              (item) => item.priority === 'HIGH',
            ).length;
            return highCount > 0 ? (
              <p className="mt-1 font-body text-xs text-danger">
                {highCount} de alta prioridade
              </p>
            ) : null;
          })()}
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
