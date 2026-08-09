// components/dashboard/ManagerDashboard.tsx
// Separador "Gestor" — dados próprios (useApiQuery) + apresentação, mesmo
// padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.

'use client';

import { Users, Target, Star, Shield } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Avatar, KPICard, Skeleton, AlertBanner } from './atoms';
import { ALERTS_POLL_MS, type Alert, type ManagerDashboardData } from './types';

export function ManagerDashboard() {
  const { data, isLoading } = useApiQuery<ManagerDashboardData>(
    queryKeys.dashboard.manager(),
    '/dashboard/manager',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  // Mesma key de alerts → reutiliza a cache partilhada (não há novo pedido).
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton count={4} />
      </div>
    );

  const kpis = data?.kpis ?? {};

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Equipa" value={data?.teamSize ?? 0} />
        <KPICard
          icon={Target}
          label="PDIs Activos"
          value={kpis.activePlans ?? 0}
          sub={`Cobertura: ${kpis.pdpCoverage ?? 0}%`}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KPICard
          icon={Star}
          label="Score Médio"
          value={kpis.avgScore?.toFixed(1) ?? '–'}
          trend={kpis.scoreTrend}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={Shield}
          label="Formação Obrigatória"
          value={`${kpis.mandatoryRate ?? 0}%`}
          color={
            (kpis.mandatoryRate ?? 0) >= 80
              ? 'text-emerald-600'
              : 'text-red-500'
          }
          bg="bg-emerald-50"
        />
      </div>

      {/* Team table */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Equipa</h3>
          <span className="text-xs text-slate-400">
            {data?.teamSize ?? 0} colaboradores
          </span>
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {(data?.team ?? []).map((u) => (
            <div
              key={u.user.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
            >
              <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {u.user.fullName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {u.user.position?.name}
                </p>
              </div>
              {u.plan && (
                <div className="w-20">
                  <ProgressBar
                    value={u.plan.progress}
                    color={
                      u.plan.progress >= 80 ? 'bg-emerald-500' : 'bg-indigo-400'
                    }
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5 text-center">
                    {u.plan.progress}% PDI
                  </p>
                </div>
              )}
              {u.lastScore && (
                <span
                  className={`text-sm font-bold ${u.lastScore >= 4 ? 'text-emerald-600' : u.lastScore >= 2.5 ? 'text-amber-600' : 'text-red-500'}`}
                >
                  {u.lastScore.toFixed(1)}
                </span>
              )}
              {u.alert && (
                <span
                  className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                  title="Em risco"
                />
              )}
            </div>
          ))}
          {(data?.team?.length ?? 0) === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              Sem equipa directa
            </div>
          )}
        </div>
      </div>

      {/* Manager alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            ⚠️ Alertas da Equipa
          </h3>
          <div className="space-y-2">
            {(data?.alerts ?? []).map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${a.priority === 'URGENT' ? 'bg-red-500' : 'bg-amber-400'}`}
                />
                <p className="text-sm text-slate-700">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
