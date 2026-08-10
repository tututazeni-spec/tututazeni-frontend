// components/automation/ExecutionsTab.tsx

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { ExecutionsResponse } from './types';

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SKIPPED: 'bg-slate-100 text-slate-500',
};

export function ExecutionsTab() {
  const [status, setStatus] = useState('');
  const { data, isLoading: loading } = useApiQuery<ExecutionsResponse>(
    queryKeys.automation.executions(status),
    '/automation/executions',
    { params: { status: status || undefined }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'SUCCESS', 'FAILED', 'PENDING'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {s || 'Todas'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {data?.meta?.total ?? 0} execuções
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {(data?.data ?? []).map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${e.status === 'SUCCESS' ? 'bg-emerald-500' : e.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-400'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">
                  Rule #{e.ruleId}
                </p>
                {e.error && (
                  <p className="text-[10px] text-red-500 truncate">{e.error}</p>
                )}
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[e.status] ?? STATUS_COLOR.PENDING}`}
              >
                {e.status}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {e.startedAt ? new Date(e.startedAt).toLocaleString('pt') : '–'}
              </span>
              {e.status === 'FAILED' && (
                <button
                  onClick={() => {
                    void apiClient
                      .post(`/automation/executions/${e.id}/rerun`, {})
                      .catch(() => {});
                  }}
                  className="text-[10px] px-2 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem execuções registadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
