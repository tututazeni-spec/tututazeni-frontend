// components/analytics/MyDashboardView.tsx
// Separador "O meu progresso" — aprendizagem, streak, competências e
// PDIs activos. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard, ProgressBar, Skeleton } from './atoms';
import type { CollaboratorDashboard } from './types';

export function MyDashboardView() {
  const { data, isLoading } = useApiQuery<CollaboratorDashboard>(
    queryKeys.analyticsPage.me(),
    '/analytics/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* Stats pessoais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Cursos concluídos"
          value={data.learning.completed}
          color="text-emerald-600"
        />
        <KpiCard
          label="Em progresso"
          value={data.learning.inProgress}
          color="text-blue-600"
        />
        <KpiCard
          label="Horas de aprendizagem"
          value={`${data.learning.totalHours}h`}
          color="text-purple-600"
        />
        <KpiCard
          label="XP ganho"
          value={data.xp.total}
          color="text-amber-600"
        />
      </div>

      {/* Streak + Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
          <div className="text-sm text-amber-100 mb-1">
            Streak de aprendizagem
          </div>
          <div className="text-4xl font-bold">{data.streak.current}</div>
          <div className="text-sm text-amber-100 mt-1">
            dias consecutivos 🔥 (recorde: {data.streak.longest})
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-3">Competências top</div>
          <div className="space-y-2">
            {data.competencies.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-28 truncate">
                  {c.name}
                </div>
                <div className="flex-1">
                  <ProgressBar
                    pct={Math.round((c.currentLevel / 5) * 100)}
                    color={
                      c.targetLevel && c.currentLevel < c.targetLevel
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }
                  />
                </div>
                <div className="text-xs font-mono text-gray-500 flex-shrink-0">
                  {c.currentLevel}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDI */}
      {data.pdi.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Os meus PDIs activos
          </div>
          <div className="space-y-3">
            {data.pdi.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {p.name}
                  </div>
                  <ProgressBar
                    pct={
                      p.actionsTotal > 0
                        ? Math.round((p.actionsDone / p.actionsTotal) * 100)
                        : 0
                    }
                  />
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono font-bold text-blue-600">
                    {p.actionsDone}/{p.actionsTotal}
                  </div>
                  {p.overdueActions > 0 && (
                    <div className="text-xs text-red-600">
                      ⚠ {p.overdueActions} atrasadas
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
