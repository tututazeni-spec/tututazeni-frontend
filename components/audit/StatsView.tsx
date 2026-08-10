// components/audit/StatsView.tsx
// Vista "Estatísticas": KPIs, distribuição por acção/entidade e
// eventos críticos recentes. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { ACTION_ICONS } from './constants';
import { fmtTs } from './utils';
import type { AuditStats } from './types';

export function StatsView() {
  const { data, isLoading: loading } = useApiQuery<AuditStats>(
    queryKeys.audit.stats(),
    '/audit/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de eventos', value: data.totals.total },
          { label: 'Hoje', value: data.totals.today },
          {
            label: 'Críticos',
            value: data.totals.critical,
            color: data.totals.critical > 0 ? 'text-red-600' : 'text-gray-900',
          },
          {
            label: 'Logins falhados hoje',
            value: data.totals.failedLoginsToday,
            color:
              data.totals.failedLoginsToday > 0
                ? 'text-amber-600'
                : 'text-gray-900',
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

      <div className="grid grid-cols-2 gap-4">
        {/* Por acção */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Por acção
          </div>
          {data.byAction.map((a) => (
            <div
              key={a.action}
              className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
            >
              <span>{ACTION_ICONS[a.action] ?? '📋'}</span>
              <span className="text-xs text-gray-700 flex-1">{a.action}</span>
              <span className="text-xs font-mono font-bold text-gray-900">
                {a.count}
              </span>
            </div>
          ))}
        </div>

        {/* Por entidade */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Por entidade
          </div>
          {data.byEntity.map((e) => (
            <div
              key={e.entity}
              className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-gray-700 flex-1">{e.entity}</span>
              <span className="text-xs font-mono font-bold text-gray-900">
                {e.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos críticos recentes */}
      {data.recentCritical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-100 text-xs font-semibold text-red-700">
            🔴 Eventos críticos recentes
          </div>
          {data.recentCritical.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-red-100 last:border-0"
            >
              <span className="text-sm">
                {ACTION_ICONS[log.action] ?? '📋'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-800">
                  {log.action}
                </span>
                <span className="text-xs text-gray-500"> em {log.entity}</span>
                {log.user && (
                  <span className="text-xs text-gray-400">
                    {' '}
                    por {log.user.fullName}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {fmtTs(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
