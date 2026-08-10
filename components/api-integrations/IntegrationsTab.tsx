// components/api-integrations/IntegrationsTab.tsx

import { useState } from 'react';
import { Plug, Play, Pause, RefreshCw, Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, HEALTH_CONFIG } from './atoms';
import type { Integration, TestIntegrationResponse } from './types';

export function IntegrationsTab() {
  const [testing, setTesting] = useState<number | null>(null);

  const {
    data: list = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<Integration[]>(
    queryKeys.apiIntegrations.list(),
    '/api-integrations',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => {
    void refetch();
  };

  const testIntegration = async (id: number) => {
    setTesting(id);
    const r = await apiClient
      .post<TestIntegrationResponse>(`/api-integrations/${id}/test`, {})
      .catch(() => null);
    setTesting(null);
    if (r) alert(r.success ? `✅ ${r.message}` : `❌ ${r.message}`);
    load();
  };

  const toggle = async (id: number) => {
    await apiClient.patch(`/api-integrations/${id}/toggle`, {});
    load();
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">
          {list.length} integração(ões)
        </span>
        <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={13} />
          Nova Integração
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((i) => {
          const hc = HEALTH_CONFIG[i.health] ?? HEALTH_CONFIG.UNKNOWN;
          return (
            <div
              key={i.id}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-xl ${hc.bg}`}>
                <Plug size={18} className={hc.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {i.name}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${hc.bg} ${hc.color}`}
                  >
                    {i.health}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${i.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {i.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {i.endpoint}
                </p>
                {i.lastTested && (
                  <p className="text-[9px] text-slate-300 mt-0.5">
                    Testado: {new Date(i.lastTested).toLocaleString('pt')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => testIntegration(i.id)}
                  disabled={testing === i.id}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Testar"
                >
                  {testing === i.id ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} />
                  )}
                </button>
                <button
                  onClick={() => toggle(i.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Toggle"
                >
                  {i.active ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Plug size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem integrações configuradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
