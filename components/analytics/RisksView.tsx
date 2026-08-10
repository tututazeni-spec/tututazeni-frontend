// components/analytics/RisksView.tsx
// Separador "Riscos" — sumário e tabs (inactivos/PDIs/acções
// críticas). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KpiCard, Skeleton } from './atoms';
import type { RiskAlert } from './types';

export function RisksView() {
  const [tab, setTab] = useState<'inactive' | 'pdis' | 'actions'>('inactive');
  const { data, isLoading } = useApiQuery<RiskAlert>(
    queryKeys.analyticsPage.risks(),
    '/analytics/risks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  const { summary } = data;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Inactivos (+60 dias)"
          value={summary.inactiveCount}
          color={summary.inactiveCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          bg="bg-amber-50"
        />
        <KpiCard
          label="PDIs atrasados"
          value={summary.overduePDICount}
          color={summary.overduePDICount > 0 ? 'text-red-600' : 'text-gray-900'}
          bg="bg-red-50"
        />
        <KpiCard
          label="Acções críticas"
          value={summary.criticalActionCount}
          color={
            summary.criticalActionCount > 0 ? 'text-red-600' : 'text-gray-900'
          }
          bg="bg-red-50"
        />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['inactive', 'pdis', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {
              {
                inactive: '😴 Inactivos',
                pdis: '📋 PDIs',
                actions: '⚠ Acções',
              }[t]
            }
          </button>
        ))}
      </div>

      {tab === 'inactive' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.inactiveCollaborators.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
              <div className="flex-1 text-sm text-gray-800">{u.fullName}</div>
              <span className="text-xs text-amber-600 font-medium">
                Sem actividade há +60 dias
              </span>
            </div>
          ))}
          {data.inactiveCollaborators.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              ✅ Sem colaboradores inactivos
            </div>
          )}
        </div>
      )}

      {tab === 'pdis' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.overduePDIs.map((p) => (
            <div
              key={p.planId}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <Avatar
                name={p.user.fullName}
                avatarUrl={p.user.avatarUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {p.planName}
                </div>
                <div className="text-xs text-gray-400">{p.user.fullName}</div>
              </div>
              <span className="text-xs text-red-600 font-medium flex-shrink-0">
                ⚠ {p.daysOverdue} dias em atraso
              </span>
            </div>
          ))}
          {data.overduePDIs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              ✅ Sem PDIs atrasados
            </div>
          )}
        </div>
      )}

      {tab === 'actions' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.criticalActions.map((a) => (
            <div
              key={a.actionId}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <Avatar
                name={a.user.fullName}
                avatarUrl={a.user.avatarUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {a.actionTitle}
                </div>
                <div className="text-xs text-gray-400">{a.user.fullName}</div>
              </div>
              <span className="text-xs text-red-600 font-medium flex-shrink-0">
                🔴 {a.daysOverdue} dias
              </span>
            </div>
          ))}
          {data.criticalActions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              ✅ Sem acções críticas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
