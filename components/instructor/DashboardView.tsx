// components/instructor/DashboardView.tsx
// Vista "Dashboard": alerta de risco, KPIs, turmas activas e
// reviews recentes. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton, Stars } from './atoms';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { DashboardData } from './types';

interface DashboardViewProps {
  onSelectCohort: (id: number) => void;
}

export function DashboardView({ onSelectCohort }: DashboardViewProps) {
  const { data, isLoading } = useApiQuery<DashboardData>(
    queryKeys.instructor.dashboard(),
    '/instructors/my/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { metrics, cohorts, recentReviews } = data;

  return (
    <div className="space-y-5">
      {/* Alerta de risco */}
      {metrics.totalAtRisk > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-red-700">
              {metrics.totalAtRisk} aluno(s) em risco nas tuas turmas activas
            </div>
            <div className="text-xs text-red-500">
              Sem actividade há mais de 7 dias ou progresso abaixo de 20%
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Turmas activas', value: metrics.activeCohorts },
          { label: 'Total de alunos', value: metrics.totalStudents },
          {
            label: 'Taxa de conclusão',
            value: `${metrics.avgCompletionRate}%`,
            color: 'text-emerald-600',
          },
          {
            label: 'Avaliação média',
            value: metrics.ratingAverage.toFixed(1),
            color: 'text-amber-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Turmas activas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Turmas activas
        </div>
        {cohorts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Sem turmas activas
          </div>
        ) : (
          cohorts.map((c) => {
            const modalityCfg =
              MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCohort(c.id)}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      {c.name}
                    </span>
                    <StatusBadge value={c.status} map={STATUS_CFG} />
                    <span className="text-xs text-gray-400">
                      {modalityCfg.icon} {modalityCfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{c.course.title}</div>
                  <div className="mt-1.5 max-w-xs">
                    <ProgressBar
                      pct={c.avgProgress}
                      color={
                        c.avgProgress > 60 ? 'bg-emerald-500' : 'bg-blue-500'
                      }
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">
                    {c.totalStudents} alunos
                  </div>
                  {c.atRisk > 0 && (
                    <div className="text-xs text-red-600">
                      ⚠ {c.atRisk} em risco
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {fmtDate(c.startDate)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reviews recentes */}
      {recentReviews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Avaliações recentes
          </div>
          <div className="space-y-3">
            {recentReviews.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar
                  name={r.user?.fullName ?? 'A'}
                  avatarUrl={r.user?.avatarUrl}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      {r.user?.fullName}
                    </span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-xs text-gray-500">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
