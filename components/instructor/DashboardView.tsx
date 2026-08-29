// components/instructor/DashboardView.tsx
// Vista "Dashboard": alerta de risco, KPIs, turmas activas e
// reviews recentes. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { AlertTriangle, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { DashboardData } from './types';

interface DashboardViewProps {
  onSelectCohort: (id: number) => void;
}

// O ProgressBar da fundação é mono-cor (bg-accent) — o sentido (progresso
// acima/abaixo de 60%) que a barra original comunicava por cor passa para
// a percentagem adjacente, mesmo padrão de AnalyticsTab/OverviewTab do
// engagement.
function progressTextClass(pct: number): string {
  return pct > 60 ? 'text-success' : 'text-info';
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          strokeWidth={1.75}
          className={
            n <= Math.round(rating)
              ? 'fill-accent text-accent'
              : 'text-ink-faint'
          }
        />
      ))}
    </div>
  );
}

export function DashboardView({ onSelectCohort }: DashboardViewProps) {
  const { data, isLoading } = useApiQuery<DashboardData>(
    queryKeys.instructor.dashboard(),
    '/instructors/my/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton rows={4} itemClassName="skeleton-shimmer h-16 rounded-card" />
    );

  const { metrics, cohorts, recentReviews } = data;

  return (
    <div className="space-y-5">
      {/* Alerta de risco */}
      {metrics.totalAtRisk > 0 && (
        <div className="flex items-center gap-3 rounded-card border border-danger bg-danger-subtle p-4">
          <AlertTriangle
            size={24}
            strokeWidth={1.75}
            className="shrink-0 text-danger"
          />
          <div>
            <div className="font-body text-sm font-semibold text-danger-ink">
              {metrics.totalAtRisk} aluno(s) em risco nas tuas turmas activas
            </div>
            <div className="font-body text-xs text-danger">
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
          },
          {
            label: 'Avaliação média',
            value: metrics.ratingAverage.toFixed(1),
          },
        ].map(({ label, value }) => (
          <Card
            key={label}
            className="border-transparent bg-surface-sunken p-4 shadow-none"
          >
            <div className="mb-1 font-body text-xs text-black">{label}</div>
            <div className="font-mono text-2xl font-bold text-black">
              {value}
            </div>
          </Card>
        ))}
      </div>

      {/* Turmas activas */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Turmas activas
        </div>
        {cohorts.length === 0 ? (
          <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
            Sem turmas activas
          </div>
        ) : (
          cohorts.map((c) => {
            const modalityCfg =
              MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCohort(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCohort(c.id);
                  }
                }}
                className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-ink">
                      {c.name}
                    </span>
                    <StatusBadge value={c.status} map={STATUS_CFG} />
                    <span className="font-body text-xs text-ink-faint">
                      {modalityCfg.label}
                    </span>
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {c.course.title}
                  </div>
                  <div className="mt-1.5 flex max-w-xs items-center gap-2">
                    <ProgressBar value={c.avgProgress} className="flex-1" />
                    <span
                      className={cn(
                        'w-9 shrink-0 font-mono text-xs',
                        progressTextClass(c.avgProgress),
                      )}
                    >
                      {c.avgProgress}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-body text-sm font-bold text-ink">
                    {c.totalStudents} alunos
                  </div>
                  {c.atRisk > 0 && (
                    <div className="font-body text-xs text-danger">
                      {c.atRisk} em risco
                    </div>
                  )}
                  <div className="font-body text-xs text-ink-faint">
                    {fmtDate(c.startDate)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Reviews recentes */}
      {recentReviews.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Avaliações recentes
          </div>
          <div className="space-y-3">
            {recentReviews.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar
                  name={r.user?.fullName ?? 'A'}
                  url={r.user?.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-ink">
                      {r.user?.fullName}
                    </span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="font-body text-xs text-ink-muted">
                    {r.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
