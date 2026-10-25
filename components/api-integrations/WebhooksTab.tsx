// components/api-integrations/WebhooksTab.tsx

import { useState } from 'react';
import { Trash2, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { NewWebhookModal } from './NewWebhookModal';
import type { Webhook } from './types';

export function WebhooksTab() {
  const notify = useToast();
  const [showNew, setShowNew] = useState(false);
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
      try {
        await apiClient.delete(`/api-integrations/webhooks/${id}`);
      } catch (e) {
        reportError(e, { source: 'WebhooksTab.remove' });
        notify({
          title: 'Não foi possível remover o webhook',
          intent: 'danger',
        });
      }
      load();
    }
  };

  if (loading)
    return (
      <Skeleton
        wrapperClassName="space-y-3"
        itemClassName="bg-surface-sunken rounded-card h-16"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-ink-muted">
          {list.length} webhook(s)
        </span>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Novo Webhook
        </Button>
      </div>

      <div className="grid gap-3">
        {list.map((h) => (
          <Card key={h.id}>
            <CardBody>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold text-ink">
                      {h.name}
                    </p>
                    <Badge intent={h.active ? 'success' : 'neutral'}>
                      {h.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <p className="font-data text-micro text-ink-faint">
                    {h.url}
                  </p>
                </div>
                <IconButton
                  icon={Trash2}
                  label="Remover"
                  size="sm"
                  intent="ghost"
                  className="hover:bg-danger-subtle hover:text-danger-ink"
                  onClick={() => remove(h.id)}
                />
              </div>

              {/* Events */}
              <div className="mb-2 flex flex-wrap gap-1">
                {(h.events ?? []).map((e: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-control bg-primary-subtle px-1.5 py-0.5 font-data text-micro text-primary"
                  >
                    {e}
                  </span>
                ))}
              </div>

              {/* Stats */}
              {h.stats && (
                <div className="flex gap-3 font-body text-micro text-ink-faint">
                  <span className="font-medium text-success">
                    <CheckCircle2
                      size={12}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    {h.stats.delivered} entregues
                  </span>
                  <span className="font-medium text-danger">
                    <XCircle
                      size={12}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    {h.stats.failed} falhas
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {list.length === 0 && (
          <EmptyState
            title="Sem webhooks configurados"
            description="Cria um webhook para receber eventos em tempo real."
          />
        )}
      </div>
      {showNew && <NewWebhookModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
