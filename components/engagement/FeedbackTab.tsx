// components/engagement/FeedbackTab.tsx
// Separador "Feedback" — envio + lista filtrável de feedback. Dados
// próprios (useApiQuery + apiClient.post directo) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<FeedbackTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.
//
// Checkbox "Enviar anonimamente" fica nativo (a Fase A não tem Checkbox
// próprio) — só `accent-primary` para usar o token de cor em vez da cor
// por omissão do browser.

'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import type { FeedbackItem } from './types';

const TYPE_INTENT: Record<string, BadgeProps['intent']> = {
  OPEN: 'info',
  ANONYMOUS: 'neutral',
  PEER: 'info',
  MANAGER: 'warning',
  RECOGNITION: 'success',
};

const TYPE_LABEL: Record<string, string> = {
  OPEN: 'Aberto',
  ANONYMOUS: 'Anónimo',
  PEER: 'Entre Pares',
  MANAGER: 'Do Gestor',
};

const TYPE_FILTERS = ['', 'OPEN', 'ANONYMOUS', 'PEER', 'MANAGER'] as const;
const NEW_FEEDBACK_TYPES = ['OPEN', 'PEER', 'MANAGER'] as const;

export interface FeedbackTabProps {
  userId?: number;
}

export function FeedbackTab({ userId }: FeedbackTabProps) {
  const notify = useToast();
  const [type, setType] = useState('');
  const [msg, setMsg] = useState('');
  const [anon, setAnon] = useState(false);

  const params = { limit: 20, ...(type ? { type } : {}) };
  const {
    data: resp,
    isLoading,
    refetch,
  } = useApiQuery<{ data: FeedbackItem[] }>(
    queryKeys.engagement.feedback(type),
    '/engagement/feedback',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = resp?.data ?? [];

  const send = async () => {
    if (!msg.trim()) return;
    try {
      await apiClient.post('/engagement/feedback', {
        type: type || 'OPEN',
        message: msg,
        anonymous: anon,
      });
      setMsg('');
      refetch();
    } catch (e) {
      reportError(e, { source: 'FeedbackTab.send' });
      notify({ title: 'Não foi possível enviar o feedback', intent: 'danger' });
    }
  };

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* New feedback box */}
      <Card>
        <CardBody>
          <h3 className="mb-3 font-display font-semibold text-ink">
            Novo Feedback
          </h3>
          <div className="mb-3 flex gap-2">
            {NEW_FEEDBACK_TYPES.map((t) => (
              <Button
                key={t}
                size="sm"
                intent={type === t ? 'primary' : 'secondary'}
                onClick={() => setType(t)}
              >
                {TYPE_LABEL[t]}
              </Button>
            ))}
          </div>
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            placeholder="Escreve o teu feedback..."
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 font-body text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
                className="rounded accent-primary"
              />
              Enviar anonimamente
            </label>
            <Button size="sm" onClick={send}>
              Enviar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {TYPE_FILTERS.map((t) => (
          <Button
            key={t}
            size="sm"
            intent={type === t ? 'primary' : 'ghost'}
            onClick={() => setType(t)}
          >
            {t ? TYPE_LABEL[t] : 'Todos'}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.map((f, i) => (
          <Card key={i}>
            <CardBody>
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={f.from?.fullName ?? 'Anónimo'}
                    url={f.from?.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {f.from?.fullName ?? 'Anónimo'}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {new Date(f.createdAt).toLocaleDateString('pt')}
                    </p>
                  </div>
                </div>
                <Badge intent={TYPE_INTENT[f.type] ?? 'neutral'}>
                  {f.type}
                </Badge>
              </div>
              <p className="ml-10 font-body text-sm text-ink-muted">
                {f.message}
              </p>
              {f.reply && (
                <div className="ml-10 mt-2 rounded-control border-l-2 border-primary bg-surface-sunken p-2">
                  <p className="font-body text-xs text-ink-muted">Resposta:</p>
                  <p className="font-body text-xs text-ink">{f.reply}</p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {data.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Nenhum feedback encontrado"
            description="Não há feedback para o filtro seleccionado."
          />
        )}
      </div>
    </div>
  );
}
