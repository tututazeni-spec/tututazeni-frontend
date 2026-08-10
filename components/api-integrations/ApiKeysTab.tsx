// components/api-integrations/ApiKeysTab.tsx

import { useState } from 'react';
import { Copy, Plus, RotateCcw, Trash2, Clock, Key } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* New key alert */}
      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-bold text-emerald-700 mb-1">
            ⚠️ Copia esta chave — não será exibida novamente
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-300">
            <code className="text-xs font-mono text-slate-800 flex-1 break-all">
              {newKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="shrink-0"
            >
              <Copy size={14} className="text-slate-500" />
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-emerald-700 underline"
          >
            Confirmar que guardei
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{keys.length} API Key(s)</span>
        <button
          onClick={create}
          className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={13} />
          Nova API Key
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {keys.map((k, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${k.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{k.name}</p>
                <p className="text-[10px] font-mono text-slate-400">
                  {k.preview}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(k.scopes ?? []).map((s: string, j: number) => (
                  <span
                    key={j}
                    className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {k.expiresAt && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  <Clock size={10} className="inline" />{' '}
                  {new Date(k.expiresAt).toLocaleDateString('pt')}
                </span>
              )}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={async () => {
                    const r = await apiClient.post<CreateApiKeyResponse>(
                      `/api-integrations/api-keys/${k.id}/rotate`,
                      {},
                    );
                    if (r.key) setNewKey(r.key);
                    load();
                  }}
                  className="p-1 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-600"
                  title="Rotacionar"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => revoke(k.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                  title="Revogar"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Key size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem API Keys criadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
