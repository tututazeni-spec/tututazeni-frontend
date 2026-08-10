// components/onboarding/DashboardView.tsx
// Separador "Dashboard" — KPIs, breakdown por estado e lista de
// onboardings activos. Dados próprios + apresentação. Extraído de
// app/(platform)/onboarding/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { STATUS_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.onboarding.dashboard(),
    '/onboarding/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { summary, active } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total planos', value: summary.total },
          {
            label: 'Em progresso',
            value: summary.byStatus['IN_PROGRESS'] ?? 0,
            color: 'text-blue-600',
          },
          {
            label: 'Tarefas atrasadas',
            value: summary.overdueTasks,
            color: summary.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900',
          },
          {
            label: 'Satisfação média',
            value:
              summary.avgSurveyScore > 0 ? `${summary.avgSurveyScore}/5` : '—',
            color: 'text-amber-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div
            key={status}
            className={`rounded-xl px-3 py-2 text-center ${cfg.cls.replace('text-', 'bg-').replace('-700', '-50').replace('-500', '-50')}`}
          >
            <div className="text-lg font-bold font-mono">
              {summary.byStatus[status] ?? 0}
            </div>
            <div className={`text-xs font-medium ${cfg.cls.split(' ')[1]}`}>
              {cfg.label}
            </div>
          </div>
        ))}
      </div>

      {/* Colaboradores activos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Onboardings activos
        </div>
        {active.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <Avatar
              name={plan.user.fullName}
              avatarUrl={plan.user.avatarUrl}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {plan.user.fullName}
              </div>
              <div className="text-xs text-gray-400">
                {plan.user.position?.name ?? '—'} · {plan.user.department?.name}
              </div>
              <div className="mt-1">
                <ProgressBar pct={plan.progress ?? 0} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400">
                Dia {plan.daysIn ?? 0}
              </div>
              <div className="text-sm font-mono font-medium text-gray-800">
                {plan.progress}%
              </div>
              <StatusBadge value={plan.status} map={STATUS_CFG} />
            </div>
          </div>
        ))}
        {active.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            Sem onboardings activos
          </div>
        )}
      </div>
    </div>
  );
}
