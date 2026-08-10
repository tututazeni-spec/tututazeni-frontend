// components/leadership/TeamView.tsx
// Separador "A minha equipa" — saúde da equipa, alertas e grid de
// liderados. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
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
      <div
        className={`border rounded-xl p-5 ${
          teamHealth.healthStatus === 'GREEN'
            ? 'bg-emerald-50 border-emerald-200'
            : teamHealth.healthStatus === 'YELLOW'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Saúde da equipa
            </div>
            <div
              className={`text-3xl font-bold font-mono ${HEALTH_CFG[teamHealth.healthStatus].cls}`}
            >
              {teamHealth.globalScore}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${HEALTH_CFG[teamHealth.healthStatus].dot}`}
            />
            <span
              className={`text-sm font-medium ${HEALTH_CFG[teamHealth.healthStatus].cls}`}
            >
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
              label: 'Turnover',
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
          ].map(({ label, value, suffix, invert }) => (
            <div
              key={label}
              className="bg-white/60 rounded-lg p-2.5 text-center"
            >
              <div className="text-lg font-bold font-mono text-gray-800">
                {value !== null && value !== undefined
                  ? `${value}${suffix}`
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {data.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">
            ⚠ Alertas ({data.alerts.length})
          </div>
          {data.alerts.map((a, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 py-1.5 border-b border-amber-100 last:border-0"
            >
              <span
                className={`text-xs font-mono flex-shrink-0 ${a.type === 'PERFORMANCE_RISK' ? 'text-red-600' : 'text-amber-600'}`}
              >
                {a.type === 'PERFORMANCE_RISK' ? '🔴' : '🟡'}
              </span>
              <p className="text-xs text-amber-800">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Team grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div>
          <div>Performance</div>
          <div>Status</div>
          <div>Pendente</div>
        </div>
        {data.team.map((member) => (
          <div
            key={member.user.id}
            className="grid grid-cols-[1fr_120px_100px_80px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={member.user.fullName}
                avatarUrl={member.user.avatarUrl}
                size="sm"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.user.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {member.user.position?.name ?? '—'}
                </div>
              </div>
            </div>
            <div className="text-sm font-mono font-medium text-gray-900">
              {member.latestReview?.score !== null &&
              member.latestReview?.score !== undefined
                ? member.latestReview.score
                : '—'}
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${HEALTH_CFG[member.statusColor].dot}`}
              />
              <span className={`text-xs ${HEALTH_CFG[member.statusColor].cls}`}>
                {HEALTH_CFG[member.statusColor].label}
              </span>
            </div>
            <div className="text-xs font-mono text-center">
              {member.pendingApprovals > 0 ? (
                <span className="text-amber-600 font-medium">
                  {member.pendingApprovals}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </div>
          </div>
        ))}
        {data.team.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem liderados atribuídos
          </div>
        )}
      </div>
    </div>
  );
}
