// components/avatar-training/SettingsTab.tsx
// Configurações (docs/Avatar_Training.md §2/§15): estado dos fornecedores de
// voz/vídeo sem expor segredos (GET /avatar-training/providers/health). A
// edição de tarifas e limites (PUT providers/:provider/:serviceType) é só
// ADMIN/RH e fica para a API por agora.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProviderHealth } from './types';

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponível',
  NOT_CONFIGURED: 'Não configurado',
  DISABLED: 'Desactivado',
};

export function SettingsTab() {
  const { data, isLoading, error, refetch } = useApiQuery<ProviderHealth>(
    queryKeys.avatarTraining.providers(),
    '/avatar-training/providers/health',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-16 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border bg-surface p-4 font-body text-sm text-ink-muted">
        Modo texto:{' '}
        <span className="font-medium text-ink">
          {data.textMode.available ? 'sempre disponível' : 'indisponível'}
        </span>
        . A voz e o vídeo são opcionais e exigem aviso de privacidade
        reconhecido pelo formando. As transcrições são anonimizadas após o
        prazo de retenção configurado.
      </div>

      <div className="space-y-2">
        {data.providers.map((p) => (
          <div
            key={`${p.provider}-${p.serviceType}`}
            className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-3"
          >
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold text-ink">
                {p.provider} · {p.serviceType}
              </div>
              {p.note && (
                <div className="font-body text-xs text-ink-muted">{p.note}</div>
              )}
            </div>
            <span className="shrink-0 font-body text-xs text-ink-muted">
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>
        ))}
      </div>

      {data.lastIncident && (
        <p className="font-body text-xs text-ink-faint">
          Último incidente: {data.lastIncident.provider}
          {data.lastIncident.errorCode ? ` (${data.lastIncident.errorCode})` : ''}{' '}
          em {formatDateTime(data.lastIncident.createdAt)}
        </p>
      )}
    </div>
  );
}
