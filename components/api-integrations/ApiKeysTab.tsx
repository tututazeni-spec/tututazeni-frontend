// components/api-integrations/ApiKeysTab.tsx

import { useState } from 'react';
import { Copy, Plus, RotateCcw, Trash2, Clock, Key } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ApiKeyItem, CreateApiKeyResponse } from './types';

export function ApiKeysTab() {
  const [newKey, setNewKey] = useState<string | null>(null);

  const {
    data: keys = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<ApiKeyItem[]>(
    queryKeys.apiIntegrations.apiKeys(),
    '/api-integrations/api-keys/list',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => {
    void refetch();
  };

  const create = async () => {
    const name = prompt('Nome da API Key:');
    if (!name) return;
    const r = await apiClient.post<CreateApiKeyResponse>(
      '/api-integrations/api-keys',
      { name, scopes: ['read'] },
    );
    if (r.key) {
      setNewKey(r.key);
      load();
    }
  };

  const confirm = useConfirm();
  const revoke = async (id: number) => {
    if (
      await confirm({
        title: 'Revogar esta API Key?',
        confirmLabel: 'Revogar',
        destructive: true,
      })
    ) {
      await apiClient.post(`/api-integrations/api-keys/${id}/revoke`, {});
      load();
    }
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
      {/* New key alert */}
      {newKey && (
        <div className="rounded-card border border-success bg-success-subtle p-4">
          <p className="mb-1 font-body text-sm font-bold text-success-ink">
            ⚠️ Copia esta chave — não será exibida novamente
          </p>
          <div className="flex items-center gap-2 rounded-control border border-success bg-surface px-3 py-2">
            <code className="flex-1 break-all font-data text-xs text-ink">
              {newKey}
            </code>
            <IconButton
              icon={Copy}
              label="Copiar chave"
              size="sm"
              intent="ghost"
              onClick={() => navigator.clipboard.writeText(newKey)}
            />
          </div>
          <Button
            size="sm"
            intent="ghost"
            className="mt-2 px-0 text-success-ink underline hover:bg-transparent hover:text-success-ink"
            onClick={() => setNewKey(null)}
          >
            Confirmar que guardei
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-ink-muted">
          {keys.length} API Key(s)
        </span>
        <Button size="sm" onClick={create}>
          <Plus size={14} strokeWidth={1.75} />
          Nova API Key
        </Button>
      </div>

      <Card>
        <div className="divide-y divide-border">
          {keys.map((k, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${k.active ? 'bg-success' : 'bg-border-strong'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-ink">
                  {k.name}
                </p>
                <p className="font-data text-[10px] text-ink-faint">
                  {k.preview}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(k.scopes ?? []).map((s: string, j: number) => (
                  <span
                    key={j}
                    className="rounded-control bg-surface-sunken px-1.5 py-0.5 font-body text-[9px] text-ink-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {k.expiresAt && (
                <span className="flex shrink-0 items-center gap-1 font-body text-[10px] text-ink-faint">
                  <Clock size={14} strokeWidth={1.75} />
                  {new Date(k.expiresAt).toLocaleDateString('pt')}
                </span>
              )}
              <div className="flex shrink-0 gap-1">
                <IconButton
                  icon={RotateCcw}
                  label="Rotacionar"
                  title="Rotacionar"
                  size="sm"
                  intent="ghost"
                  className="hover:bg-warning-subtle hover:text-warning-ink"
                  onClick={async () => {
                    const r = await apiClient.post<CreateApiKeyResponse>(
                      `/api-integrations/api-keys/${k.id}/rotate`,
                      {},
                    );
                    if (r.key) setNewKey(r.key);
                    load();
                  }}
                />
                <IconButton
                  icon={Trash2}
                  label="Revogar"
                  title="Revogar"
                  size="sm"
                  intent="ghost"
                  className="hover:bg-danger-subtle hover:text-danger-ink"
                  onClick={() => revoke(k.id)}
                />
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <EmptyState
              icon={Key}
              title="Sem API Keys criadas"
              description="Cria uma API Key para começar a integrar sistemas externos."
              className="rounded-none border-none"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
