// components/automation/RulesTab.tsx

import { useState } from 'react';
import { Copy, Pause, Play, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_INTENT, TRIGGER_LABEL } from './constants';
import type { AutomationRule, RunAllResponse } from './types';

export function RulesTab() {
  const notify = useToast();
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
    notify({
      title: `Executadas: ${r.executed} regras`,
      intent: 'success',
    });
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-ink-muted">
          {rules.length} regra(s) · {rules.filter((r) => r.active).length}{' '}
          activas
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            intent="secondary"
            onClick={runAll}
            disabled={running}
          >
            {running ? (
              <RefreshCw
                size={14}
                strokeWidth={1.75}
                className="animate-spin"
              />
            ) : (
              <Play size={14} strokeWidth={1.75} />
            )}
            Executar Todas
          </Button>
          <Button size="sm">
            <Plus size={14} strokeWidth={1.75} />
            Nova Regra
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((r) => (
          <Card key={r.id} className={r.active ? 'p-4' : 'p-4 opacity-60'}>
            <div className="flex items-start gap-3">
              <div
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${r.active ? 'bg-success' : 'bg-ink-faint'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-body text-sm font-semibold text-ink">
                    {r.name}
                  </p>
                  {r.category && (
                    <Badge intent={CATEGORY_INTENT[r.category] ?? 'neutral'}>
                      {r.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 font-body text-[10px] text-ink-faint">
                  <span>{TRIGGER_LABEL[r.trigger] ?? r.trigger}</span>
                  <span>→</span>
                  <span className="font-data">{r.action}</span>
                </div>
                {r.stats && (
                  <div className="mt-1 flex gap-3 font-body text-[10px]">
                    <span className="text-ink-faint">
                      {r.stats.total} execuções
                    </span>
                    <span className="text-success">{r.stats.success} ✅</span>
                    {r.stats.failed > 0 && (
                      <span className="text-danger">{r.stats.failed} ❌</span>
                    )}
                    <span className="font-semibold text-primary">
                      {r.stats.successRate}% ok
                    </span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton
                  icon={r.active ? Pause : Play}
                  label={r.active ? 'Pausar regra' : 'Activar regra'}
                  intent="ghost"
                  onClick={() => toggle(r.id)}
                />
                <IconButton
                  icon={Copy}
                  label="Clonar regra"
                  intent="ghost"
                  onClick={() => clone(r.id)}
                />
                <IconButton
                  icon={Trash2}
                  label="Remover regra"
                  intent="ghost"
                  className="hover:bg-danger-subtle hover:text-danger"
                  onClick={() => remove(r.id)}
                />
              </div>
            </div>
          </Card>
        ))}
        {rules.length === 0 && (
          <EmptyState
            icon={Zap}
            title="Sem automações"
            description="Usa os templates para começar."
          />
        )}
      </div>
    </div>
  );
}
