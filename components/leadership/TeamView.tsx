// components/leadership/TeamView.tsx
// Separador "A minha equipa" — saúde da equipa, alertas e grid de
// liderados. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { HEALTH_CFG } from './constants';
import type { TeamDashboard } from './types';

export function TeamView() {
  const { data, isLoading } = useApiQuery<TeamDashboard>(
    queryKeys.leadership.teamDashboard(),
    '/leadership/team/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const { teamHealth } = data;

  return (
    <div className="space-y-5">
      {/* Team Health */}
      <div className="rounded-card border border-black bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-1 font-body text-xs font-medium text-black">
              Saúde da equipa
            </div>
            <div className="font-mono text-3xl font-bold text-black">
              {teamHealth.globalScore}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-4 w-4 rounded-full ${HEALTH_CFG[teamHealth.healthStatus].dot}`}
            />
            <span className="font-body text-sm font-medium text-black">
              {HEALTH_CFG[teamHealth.healthStatus].label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: 'Engajamento',
              value: teamHealth.metrics.engagementScore,
              suffix: '%',
            },
            {
              label: 'Rotatividade',
              value: teamHealth.metrics.turnoverRate,
              suffix: '%',
              invert: true,
            },
            {
              label: 'Absenteísmo',
              value: teamHealth.metrics.absenteeismRate,
              suffix: '%',
              invert: true,
            },
            {
              label: 'PDIs concl.',
              value: teamHealth.metrics.pdisCompletedPct,
              suffix: '%',
            },
            {
              label: 'Aval. no prazo',
              value: teamHealth.metrics.evaluationsOnTimePct,
              suffix: '%',
            },
          ].map(({ label, value, suffix }) => (
            <div
              key={label}
              className="rounded-control bg-surface/60 p-2.5 text-center"
            >
              <div className="font-mono text-lg font-bold text-ink">
                {value !== null && value !== undefined
                  ? `${value}${suffix}`
                  : '—'}
              </div>
              <div className="font-body text-xs text-ink-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {data.alerts.length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <div className="mb-2 font-body text-sm font-semibold text-warning-ink">
            ⚠ Alertas ({data.alerts.length})
          </div>
          {data.alerts.map((a, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 border-b border-warning/30 py-1.5 last:border-0"
            >
              <span
                className={`flex-shrink-0 font-mono text-xs ${a.type === 'PERFORMANCE_RISK' ? 'text-danger-ink' : 'text-warning-ink'}`}
              >
                {a.type === 'PERFORMANCE_RISK' ? '🔴' : '🟡'}
              </span>
              <p className="font-body text-xs text-warning-ink">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Team grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div>Colaborador</div>
          <div>Performance</div>
          <div>Status</div>
          <div>Pendente</div>
        </div>
        {data.team.map((member) => (
          <div
            key={member.user.id}
            className="grid grid-cols-[1fr_120px_100px_80px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={member.user.fullName}
                url={member.user.avatarUrl ?? undefined}
                size="sm"
              />
              <div>
                <div className="font-body text-sm font-medium text-ink">
                  {member.user.fullName}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {member.user.position?.name ?? '—'}
                </div>
              </div>
            </div>
            <div className="font-mono text-sm font-medium text-ink">
              {member.latestReview?.score !== null &&
              member.latestReview?.score !== undefined
                ? member.latestReview.score
                : '—'}
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${HEALTH_CFG[member.statusColor].dot}`}
              />
              <span
                className={`font-body text-xs ${HEALTH_CFG[member.statusColor].cls}`}
              >
                {HEALTH_CFG[member.statusColor].label}
              </span>
            </div>
            <div className="text-center font-mono text-xs">
              {member.pendingApprovals > 0 ? (
                <span className="font-medium text-warning-ink">
                  {member.pendingApprovals}
                </span>
              ) : (
                <span className="text-ink-faint">—</span>
              )}
            </div>
          </div>
        ))}
        {data.team.length === 0 && (
          <div className="px-4 py-12 text-center font-body text-sm text-ink-faint">
            Sem liderados atribuídos
          </div>
        )}
      </Card>
    </div>
  );
}
