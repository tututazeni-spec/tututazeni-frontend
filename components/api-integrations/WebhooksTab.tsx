// components/api-integrations/WebhooksTab.tsx

import { Zap, Trash2, Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { Webhook } from './types';

export function WebhooksTab() {
  const {
    data: list = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<Webhook[]>(
    queryKeys.apiIntegrations.webhooks(),
    '/api-integrations/webhooks/list',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => {
    void refetch();
  };

  const confirm = useConfirm();
  const remove = async (id: number) => {
    if (
      await confirm({
        title: 'Remover webhook?',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      await apiClient.delete(`/api-integrations/webhooks/${id}`);
      load();
    }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{list.length} webhook(s)</span>
        <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={13} />
          Novo Webhook
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((h) => (
          <div
            key={h.id}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {h.name}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${h.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {h.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{h.url}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => remove(h.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(h.events ?? []).map((e: string, i: number) => (
                <span
                  key={i}
                  className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono"
                >
                  {e}
                </span>
              ))}
            </div>

            {/* Stats */}
            {h.stats && (
              <div className="flex gap-3 text-[10px] text-slate-400">
                <span className="text-emerald-600 font-medium">
                  ✅ {h.stats.delivered} entregues
                </span>
                <span className="text-red-500 font-medium">
                  ❌ {h.stats.failed} falhas
                </span>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-12 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem webhooks configurados</p>
          </div>
        )}
      </div>
    </div>
  );
}
