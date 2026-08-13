// components/automation/ExecutionsTab.tsx

import { useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ExecutionsResponse } from './types';

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  RUNNING: 'info',
  PENDING: 'warning',
  SKIPPED: 'neutral',
};

const DOT_CLASS: Record<string, string> = {
  SUCCESS: 'bg-success',
  FAILED: 'bg-danger',
};

const STATUS_FILTERS = ['', 'SUCCESS', 'FAILED', 'PENDING'] as const;

export function ExecutionsTab() {
  const [status, setStatus] = useState('');
  const { data, isLoading: loading } = useApiQuery<ExecutionsResponse>(
    queryKeys.automation.executions(status),
    '/automation/executions',
    { params: { status: status || undefined }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const executions = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            intent={status === s ? 'primary' : 'secondary'}
            onClick={() => setStatus(s)}
          >
            {s || 'Todas'}
          </Button>
        ))}
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {data?.meta?.total ?? 0} execuções
        </span>
      </div>

      <Card>
        <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
          {executions.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken"
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[e.status] ?? 'bg-warning'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-body text-xs font-medium text-ink">Rule #{e.ruleId}</p>
                {e.error && (
                  <p className="truncate font-body text-[10px] text-danger">{e.error}</p>
                )}
              </div>
              <Badge intent={STATUS_INTENT[e.status] ?? 'warning'}>{e.status}</Badge>
              <span className="shrink-0 font-body text-[10px] text-ink-faint">
                {e.startedAt ? new Date(e.startedAt).toLocaleString('pt') : '–'}
              </span>
              {e.status === 'FAILED' && (
                <Button
                  size="sm"
                  intent="secondary"
                  className="shrink-0"
                  onClick={() => {
                    void apiClient
                      .post(`/automation/executions/${e.id}/rerun`, {})
                      .catch(() => {});
                  }}
                >
                  <RotateCcw size={14} strokeWidth={1.75} />
                  Retry
                </Button>
              )}
            </div>
          ))}
          {executions.length === 0 && (
            <EmptyState
              icon={Activity}
              title="Sem execuções registadas"
              description="As execuções das regras de automação aparecem aqui."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
