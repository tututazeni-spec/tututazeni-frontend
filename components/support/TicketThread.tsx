'use client';
// Conversa de um pedido. Para o suporte (ADMIN/RH) acrescenta notas internas e mudança de estado.

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { friendlyMessage } from '@/lib/errorReporting';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Textarea } from '@/components/ui/Textarea';
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TicketDetail,
  TicketStatus,
  formatWhen,
} from './types';

export function TicketThread({
  id,
  staff,
  onBack,
}: {
  id: number;
  staff: boolean;
  onBack: () => void;
}) {
  const key = ['support', 'ticket', id];
  const query = useApiQuery<TicketDetail>(key, `/support/tickets/${id}`);
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const invalidate = [key, ['support', 'tickets', 'my'], ['support', 'queue']];

  const reply = useApiMutation(
    (v: { body: string; internal: boolean }) =>
      apiClient.post(`/support/tickets/${id}/messages`, v),
    {
      invalidateKeys: invalidate,
      onSuccess: () => {
        setBody('');
        setInternal(false);
        setError(undefined);
      },
      onError: (e) => setError(friendlyMessage(e)),
    },
  );

  const setStatus = useApiMutation(
    (status: TicketStatus) =>
      apiClient.patch(`/support/tickets/${id}/status`, { status }),
    {
      invalidateKeys: invalidate,
      onError: (e) => setError(friendlyMessage(e)),
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-[44px] items-center gap-2 self-start text-sm font-semibold text-primary"
      >
        <ArrowLeft size={16} aria-hidden /> Voltar aos pedidos
      </button>

      <QueryBoundary query={query}>
        {(t) => (
          <>
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-ink">
                      #{t.id} · {t.subject}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {CATEGORY_LABEL[t.category]} · prioridade{' '}
                      {PRIORITY_LABEL[t.priority].toLowerCase()} · aberto em{' '}
                      {formatWhen(t.createdAt)}
                      {t.requester ? ` · ${t.requester.fullName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.overdue && <Badge intent="danger">Em atraso</Badge>}
                    {staff ? (
                      <NativeSelect
                        aria-label="Estado do pedido"
                        density="sm"
                        value={t.status}
                        onChange={(e) =>
                          setStatus.mutate(e.target.value as TicketStatus)
                        }
                      >
                        {(Object.keys(STATUS_LABEL) as TicketStatus[]).map(
                          (s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ),
                        )}
                      </NativeSelect>
                    ) : (
                      <Badge
                        intent={t.status === 'RESOLVED' ? 'success' : 'info'}
                      >
                        {STATUS_LABEL[t.status]}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
                  {t.description}
                </p>
                {!t.firstRespondedAt && t.status !== 'CLOSED' && (
                  <p className="mt-3 text-xs text-ink-muted">
                    Primeira resposta prevista até{' '}
                    {formatWhen(t.firstResponseDueAt)}.
                  </p>
                )}
              </CardBody>
            </Card>

            <ol className="flex flex-col gap-3" aria-label="Conversa">
              {t.messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.internal
                      ? 'rounded-control border border-warning bg-warning-subtle p-3'
                      : m.staff
                        ? 'rounded-control border border-border bg-info-subtle p-3'
                        : 'rounded-control border border-border bg-surface p-3'
                  }
                >
                  <p className="text-xs text-ink-muted">
                    {m.author?.fullName ?? 'Utilizador removido'}
                    {m.staff ? ' · Suporte' : ''}
                    {m.internal ? ' · nota interna' : ''} ·{' '}
                    {formatWhen(m.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {m.body}
                  </p>
                </li>
              ))}
            </ol>

            {t.status === 'CLOSED' ? (
              <p className="text-sm text-ink-muted">
                Este pedido está fechado. Se precisar de mais ajuda, abra um
                novo pedido.
              </p>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!body.trim()) {
                    setError('Escreva uma mensagem antes de enviar.');
                    return;
                  }
                  reply.mutate({ body: body.trim(), internal });
                }}
              >
                <Textarea
                  aria-label="A sua resposta"
                  rows={4}
                  maxLength={5000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    staff
                      ? 'Responder ao utilizador…'
                      : 'Escreva a sua resposta…'
                  }
                />
                {staff && (
                  <label className="flex min-h-[44px] items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    Nota interna (o utilizador não vê)
                  </label>
                )}
                {error && (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                )}
                <div>
                  <Button type="submit" loading={reply.isPending}>
                    {internal ? 'Guardar nota' : 'Enviar resposta'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
