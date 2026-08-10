// components/automation/RulesTab.tsx

import { useState } from 'react';
import { Zap, Play, Pause, Copy, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, CATEGORY_COLOR, TRIGGER_LABEL } from './atoms';
import type { AutomationRule, RunAllResponse } from './types';

export function RulesTab() {
  const [running, setRunning] = useState(false);

  const {
    data: rules = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<AutomationRule[]>(
    queryKeys.automation.rules(),
    '/automation/rules',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => {
    void refetch();
  };

  const toggle = async (id: number) => {
    await apiClient.patch(`/automation/rules/${id}/toggle`, {});
    load();
  };
  const clone = async (id: number) => {
    await apiClient.post(`/automation/rules/${id}/clone`, {});
    load();
  };
  const confirm = useConfirm();
  const remove = async (id: number) => {
    if (
      await confirm({
        title: 'Remover regra?',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      await apiClient.delete(`/automation/rules/${id}`);
      load();
    }
  };
  const runAll = async () => {
    setRunning(true);
    const r = await apiClient.post<RunAllResponse>('/automation/run', {});
    setRunning(false);
    alert(`Executadas: ${r.executed} regras`);
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {rules.length} regra(s) · {rules.filter((r) => r.active).length}{' '}
          activas
        </span>
        <div className="flex gap-2">
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-1 text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            {running ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Play size={12} />
            )}
            Executar Todas
          </button>
          <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={12} />
            Nova Regra
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className={`bg-white rounded-xl border p-4 ${r.active ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${r.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {r.name}
                  </p>
                  {r.category && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[r.category] ?? CATEGORY_COLOR.CUSTOM}`}
                    >
                      {r.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{TRIGGER_LABEL[r.trigger] ?? r.trigger}</span>
                  <span>→</span>
                  <span className="font-mono">{r.action}</span>
                </div>
                {r.stats && (
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <span className="text-slate-400">
                      {r.stats.total} execuções
                    </span>
                    <span className="text-emerald-600">
                      {r.stats.success} ✅
                    </span>
                    {r.stats.failed > 0 && (
                      <span className="text-red-500">{r.stats.failed} ❌</span>
                    )}
                    <span className="text-indigo-500 font-semibold">
                      {r.stats.successRate}% ok
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => toggle(r.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  title="Toggle"
                >
                  {r.active ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  onClick={() => clone(r.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  title="Clonar"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                  title="Remover"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Zap size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              Sem automações — usa os templates para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
