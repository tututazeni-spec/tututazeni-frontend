// components/api-integrations/IntegrationsTab.tsx

import { useState } from 'react';
import { Plug, Play, Pause, RefreshCw, Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Integration, TestIntegrationResponse } from './types';

const HEALTH_INTENT: Record<string, NonNullable<BadgeProps['intent']>> = {
  OK: 'success',
  ERROR: 'danger',
  DEGRADED: 'warning',
  STALE: 'neutral',
  INACTIVE: 'neutral',
  UNKNOWN: 'neutral',
};

const HEALTH_CHIP_CLASSES: Record<NonNullable<BadgeProps['intent']>, string> = {
  success: 'bg-success-subtle text-success-ink',
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
  neutral: 'bg-surface-sunken text-ink-muted',
};

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

  if (loading)
    return (
      <Skeleton
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="bg-surface-sunken rounded-card h-16"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-ink-muted">
          {list.length} integração(ões)
        </span>
        <Button size="sm">
          <Plus size={14} strokeWidth={1.75} />
          Nova Integração
        </Button>
      </div>

      <div className="grid gap-3">
        {list.map((i) => {
          const intent = HEALTH_INTENT[i.health] ?? 'neutral';
          return (
            <Card key={i.id} className="flex items-center gap-4 p-4">
              <div
                className={`rounded-control p-2.5 ${HEALTH_CHIP_CLASSES[intent]}`}
              >
                <Plug size={18} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <p className="font-body text-sm font-semibold text-ink">
                    {i.name}
                  </p>
                  <Badge intent={intent}>{i.health}</Badge>
                  <Badge intent={i.active ? 'success' : 'neutral'}>
                    {i.active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <p className="truncate font-data text-[10px] text-ink-faint">
                  {i.endpoint}
                </p>
                {i.lastTested && (
                  <p className="mt-0.5 font-body text-[9px] text-ink-faint">
                    Testado: {new Date(i.lastTested).toLocaleString('pt')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton
                  icon={testing === i.id ? RefreshCw : Play}
                  label="Testar"
                  title="Testar"
                  size="sm"
                  intent="ghost"
                  disabled={testing === i.id}
                  className={testing === i.id ? '[&_svg]:animate-spin' : ''}
                  onClick={() => testIntegration(i.id)}
                />
                <IconButton
                  icon={i.active ? Pause : Play}
                  label="Toggle"
                  title="Toggle"
                  size="sm"
                  intent="ghost"
                  onClick={() => toggle(i.id)}
                />
              </div>
            </Card>
          );
        })}
        {list.length === 0 && (
          <EmptyState
            icon={Plug}
            title="Sem integrações configuradas"
            description="Adiciona uma integração para começar a ligar sistemas externos."
          />
        )}
      </div>
    </div>
  );
}
