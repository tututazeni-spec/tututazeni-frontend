// components/acl/AuditTab.tsx

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AclAuditResponse } from './types';

export function AuditTab() {
  const [view, setView] = useState<'all' | 'denied'>('all');
  const { data, isLoading: loading } = useApiQuery<AclAuditResponse>(
    queryKeys.acl.audit(view),
    view === 'denied' ? '/acl/audit/denied' : '/acl/audit',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'denied'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-xs px-4 py-2 rounded-lg font-medium ${view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            {v === 'all' ? 'Todas as Alterações' : '🔴 Acessos Negados'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {data?.meta?.total ?? 0} registos
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {(data?.data ?? []).map((log, i) => {
            const changes = log.changes
              ? (() => {
                  try {
                    return JSON.parse(log.changes);
                  } catch {
                    return null;
                  }
                })()
              : null;
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${log.action === 'ACCESS_DENIED' ? 'bg-red-500' : 'bg-indigo-400'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-700">
                      {log.user?.fullName ?? `User ${log.userId}`}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    {changes?.subject && (
                      <span className="text-[10px] text-slate-400">
                        {changes.subject}
                      </span>
                    )}
                  </div>
                  {changes?.reason && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {changes.reason}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString('pt')}
                </span>
              </div>
            );
          })}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de auditoria</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 0) > 1 && (
        <p className="text-xs text-slate-400 text-center">
          Pág. 1 / {data?.meta?.totalPages} — {data?.meta?.total} registos
          totais
        </p>
      )}
    </div>
  );
}
