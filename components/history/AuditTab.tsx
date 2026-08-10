// components/history/AuditTab.tsx
// Tab "Auditoria": estatísticas de auditoria, top acções,
// aniversários de empresa e alertas de segurança recentes. Extraído
// de app/(platform)/history/page.tsx.

'use client';

import { Activity, BarChart2, Shield, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AuditStats, UpcomingData } from './types';

export function AuditTab() {
  const dataQ = useApiQuery<AuditStats>(
    queryKeys.history.auditStats(),
    '/history/audit/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const upcomingQ = useApiQuery<UpcomingData>(
    queryKeys.history.upcoming(),
    '/history/upcoming',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const upcoming = upcomingQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* Audit stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Total de Eventos',
            value: data?.total ?? 0,
            icon: Activity,
          },
          {
            label: 'Top Acção',
            value: data?.byAction?.[0]?.action ?? '–',
            icon: BarChart2,
          },
          {
            label: 'Utilizadores',
            value: data?.topUsers?.length ?? 0,
            icon: Users,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <k.icon size={16} className="text-indigo-600 mb-2" />
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Top actions */}
      {(data?.byAction ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Top Acções</h4>
          <div className="space-y-1.5">
            {(data?.byAction ?? []).slice(0, 8).map((a, i) => {
              const max = data?.byAction?.[0]?.count ?? 1;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 w-5 text-right">
                    #{i + 1}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-700 w-40 truncate">
                    {a.action}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-1.5 bg-indigo-400 rounded-full"
                      style={{ width: `${(a.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-10 text-right">
                    {a.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming anniversaries */}
      {(upcoming?.anniversaries?.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h4 className="font-semibold text-amber-700 mb-3">
            🎉 Aniversários de Empresa este Mês
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(upcoming?.anniversaries ?? []).slice(0, 6).map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2"
              >
                <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                  {u.fullName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {u.fullName}
                  </p>
                  <p className="text-[10px] text-amber-600 font-semibold">
                    {u.years} {u.years === 1 ? 'ano' : 'anos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent alerts */}
      {(data?.recentAlerts ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Shield size={14} className="text-red-500" />
            Eventos de Segurança Recentes
          </h4>
          <div className="space-y-2">
            {(data?.recentAlerts ?? []).map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-600 py-1.5 border-b border-slate-50"
              >
                <span className="font-mono text-red-500 shrink-0">
                  {a.action}
                </span>
                <span>·</span>
                <span>{a.user?.fullName ?? `User ${a.userId}`}</span>
                <span className="ml-auto text-slate-400">
                  {new Date(a.timestamp).toLocaleDateString('pt')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
