// components/dashboard/ColaboradorDashboard.tsx
// Separador "O Meu Dashboard" — dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.

'use client';

import { BookOpen, CheckCircle, Award, Target, Clock, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Avatar, KPICard, Skeleton, AlertBanner } from './atoms';
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
        <Skeleton count={4} />
        <Skeleton count={2} />
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
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          {data?.user && (
            <Avatar
              name={data.user.fullName ?? 'U'}
              url={data.user.avatarUrl}
              size={12}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{data?.user?.fullName}</p>
            <p className="text-indigo-200 text-sm">
              {data?.user?.position?.name} · {data?.user?.department?.name}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xl">
              <Zap size={18} />
              {points}
            </div>
            <p className="text-indigo-200 text-xs">
              {level?.label} · Nível {level?.level}
            </p>
          </div>
        </div>
        {level && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-indigo-200 mb-1">
              <span>Próximo nível</span>
              <span>
                {points}/{level.nextAt}
              </span>
            </div>
            <ProgressBar
              value={(points / level.nextAt) * 100}
              color="bg-amber-400"
              height="h-1.5"
            />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={BookOpen}
          label="Cursos em Progresso"
          value={data?.learning?.inProgress ?? 0}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KPICard
          icon={CheckCircle}
          label="Cursos Concluídos"
          value={data?.learning?.completed ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={Award}
          label="Badges Conquistados"
          value={data?.gamification?.recentBadges?.length ?? 0}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={Target}
          label="Avaliações Pendentes"
          value={(data?.engagement?.pendingSurveys ?? 0) + 0}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PDI */}
        {plan && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Target size={15} className="text-indigo-500" />
                PDI Activo
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {plan.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3 truncate">{plan.name}</p>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Progresso</span>
              <span className="font-bold text-indigo-600">
                {plan.progress}%
              </span>
            </div>
            <ProgressBar
              value={plan.progress}
              color={plan.progress >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}
            />
            <p className="text-[10px] text-slate-400 mt-2">
              {plan.completedActions} / {plan.goals} acções concluídas
            </p>
          </div>
        )}

        {/* Pending items */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />
            Pendentes
          </h3>
          {(data?.pendingItems ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Tudo em dia! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {(data?.pendingItems ?? []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${item.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`}
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
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            Evolução de Competências
          </h3>
          <div className="space-y-2">
            {(data?.skills ?? []).map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{s.name}</span>
                  <span className="font-semibold text-slate-700">
                    {s.current}/{s.target ?? 5}
                  </span>
                </div>
                <ProgressBar
                  value={(s.current / (s.target ?? 5)) * 100}
                  color={
                    s.current >= (s.target ?? 5)
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
