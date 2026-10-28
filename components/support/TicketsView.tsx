'use client';
// Separador "Os meus pedidos" (qualquer utilizador) e "Fila de suporte" (ADMIN/RH).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { NewTicketForm } from './NewTicketForm';
import { TicketThread } from './TicketThread';
import {
  Paginated,
  PRIORITY_LABEL,
  Priority,
  STATUS_LABEL,
  Ticket,
  TicketStatus,
  formatWhen,
} from './types';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'thread'; id: number };

function TicketRow({
  t,
  showRequester,
  onOpen,
}: {
  t: Ticket;
  showRequester: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-[56px] w-full flex-col items-start gap-1 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">
            #{t.id} · {t.subject}
          </span>
          <span className="block text-xs text-ink-muted">
            {PRIORITY_LABEL[t.priority]} · {formatWhen(t.createdAt)}
            {showRequester && t.requester ? ` · ${t.requester.fullName}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {t.overdue && <Badge intent="danger">Em atraso</Badge>}
          <Badge intent={t.status === 'RESOLVED' ? 'success' : 'info'}>
            {STATUS_LABEL[t.status]}
          </Badge>
        </span>
      </button>
    </li>
  );
}

export function MyTicketsView() {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const query = useApiQuery<Paginated<Ticket>>(
    ['support', 'tickets', 'my'],
    '/support/tickets/my',
  );

  if (mode.kind === 'new') {
    return (
      <Card>
        <CardBody>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">
            Novo pedido de suporte
          </h2>
          <NewTicketForm
            onCreated={(t) => setMode({ kind: 'thread', id: t.id })}
          />
        </CardBody>
      </Card>
    );
  }
  if (mode.kind === 'thread') {
    return (
      <TicketThread
        id={mode.id}
        staff={false}
        onBack={() => setMode({ kind: 'list' })}
      />
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Os meus pedidos
          </h2>
          <Button type="button" onClick={() => setMode({ kind: 'new' })}>
            <Plus size={16} aria-hidden /> Novo pedido
          </Button>
        </div>
        <QueryBoundary query={query}>
          {(page) =>
            page.data.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Ainda não abriu nenhum pedido. Antes de abrir um, veja se a
                resposta está nas perguntas frequentes.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {page.data.map((t) => (
                  <TicketRow
                    key={t.id}
                    t={t}
                    showRequester={false}
                    onOpen={() => setMode({ kind: 'thread', id: t.id })}
                  />
                ))}
              </ul>
            )
          }
        </QueryBoundary>
      </CardBody>
    </Card>
  );
}

interface Summary {
  byStatus: Record<string, number>;
  overdue: number;
  awaitingFirstResponse: number;
  answeredWithinTargetPct: number | null;
  sampleSize: number;
}

export function SupportQueueView() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');

  const summary = useApiQuery<Summary>(
    ['support', 'summary'],
    '/support/tickets/summary',
  );
  const queue = useApiQuery<Paginated<Ticket>>(
    ['support', 'queue', status, priority],
    '/support/tickets',
    {
      params: { status: status || undefined, priority: priority || undefined },
    },
  );

  if (openId !== null) {
    return <TicketThread id={openId} staff onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <QueryBoundary query={summary}>
        {(s) => (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <KpiCard
              label="Em atraso"
              value={s.overdue}
              intent={s.overdue > 0 ? 'danger' : 'success'}
              sub="sem primeira resposta no prazo"
            />
            <KpiCard
              label="A aguardar resposta"
              value={s.awaitingFirstResponse}
              sub="ainda sem primeira resposta"
            />
            <KpiCard
              label="Respondidos no prazo"
              value={
                s.answeredWithinTargetPct === null
                  ? '—'
                  : `${s.answeredWithinTargetPct}%`
              }
              sub={`últimos ${s.sampleSize} respondidos`}
            />
          </div>
        )}
      </QueryBoundary>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-ink">
              Fila de suporte
            </h2>
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                aria-label="Filtrar por estado"
                density="sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus | '')}
              >
                <option value="">Todos os estados</option>
                {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="Filtrar por prioridade"
                density="sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | '')}
              >
                <option value="">Todas as prioridades</option>
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Ordenada pelo prazo de primeira resposta: o mais urgente primeiro.
          </p>
          <QueryBoundary query={queue}>
            {(page) =>
              page.data.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Sem pedidos nesta vista.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {page.data.map((t) => (
                    <TicketRow
                      key={t.id}
                      t={t}
                      showRequester
                      onOpen={() => setOpenId(t.id)}
                    />
                  ))}
                </ul>
              )
            }
          </QueryBoundary>
        </CardBody>
      </Card>
    </div>
  );
}
