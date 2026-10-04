// components/audit/EventDetailModal.tsx
// Modal «Detalhes do Evento» (docs/modulo_audit.md §5). Só leitura: o backend
// já remove segredos e oculta valores sensíveis a quem não é ADMIN.

'use client';

import { Printer } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  SEVERITY_CFG,
  STATUS_CFG,
  actionLabel,
  entityLabel,
} from './constants';
import { DiffViewer } from './DiffViewer';
import { fmtTs } from './utils';
import type { AuditEventDetail, RelatedEvent } from './types';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 font-body text-xs">
      <span className="w-36 flex-shrink-0 text-ink-faint">{label}</span>
      <span className="min-w-0 break-words text-ink">{value || '—'}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1 border-b border-border pb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

function Related({
  events,
  onOpen,
}: {
  events: RelatedEvent[];
  onOpen: (id: number) => void;
}) {
  if (events.length === 0)
    return <p className="font-body text-xs text-ink-faint">Sem eventos.</p>;
  return (
    <div className="divide-y divide-border rounded-control border border-border">
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onOpen(e.id)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-body text-xs hover:bg-surface-sunken"
        >
          <span className="font-data text-ink-faint">{e.code}</span>
          <span className="flex-1 truncate text-ink">
            {actionLabel(e.action)} · {entityLabel(e.entity)}
            {e.entityId ? ` #${e.entityId}` : ''}
          </span>
          <span className="flex-shrink-0 text-ink-faint">
            {fmtTs(e.timestamp)}
          </span>
        </button>
      ))}
    </div>
  );
}

interface EventDetailModalProps {
  eventId: number | null;
  onClose: () => void;
  onOpenEvent: (id: number) => void;
  /** Filtra a tabela pelo registo afectado («Consultar eventos relacionados»). */
  onFilterRecord?: (entity: string, entityId: number) => void;
}

export function EventDetailModal({
  eventId,
  onClose,
  onOpenEvent,
  onFilterRecord,
}: EventDetailModalProps) {
  const { data, isLoading, error } = useApiQuery<AuditEventDetail>(
    queryKeys.audit.detail(eventId ?? 0),
    `/audit/${eventId}/detail`,
    { enabled: eventId != null },
  );

  return (
    <Modal open={eventId != null} onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Detalhes do Evento"
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        {isLoading && <Skeleton rows={6} />}
        {error && (
          <p className="mt-3 font-body text-sm text-danger-ink">
            Não foi possível carregar o evento.
          </p>
        )}
        {data && (
          <Body data={data} onOpen={onOpenEvent} onFilter={onFilterRecord} />
        )}
      </ModalContent>
    </Modal>
  );
}

function Body({
  data,
  onOpen,
  onFilter,
}: {
  data: AuditEventDetail;
  onOpen: (id: number) => void;
  onFilter?: (entity: string, entityId: number) => void;
}) {
  const sev = SEVERITY_CFG[data.severity] ?? SEVERITY_CFG.LOW;
  const hasChanges = data.changes && Object.keys(data.changes).length > 0;
  const hasValues = data.before != null || data.after != null;

  return (
    <div className="mt-3">
      {data.masked && (
        <div className="mb-2 rounded-control bg-warning-subtle px-3 py-2 font-body text-xs text-warning-ink">
          Os valores deste evento estão ocultos: dados sensíveis só são visíveis
          a administradores.
        </div>
      )}

      <Section title="Identificação">
        <Field label="ID do evento" value={data.code} />
        <Field label="Acção" value={actionLabel(data.action)} />
        <Field label="Módulo / entidade" value={entityLabel(data.entity)} />
        <Field
          label="Registo afectado"
          value={
            data.entityId
              ? `${data.entityName ?? data.entity} #${data.entityId}`
              : null
          }
        />
        <Field
          label="Resultado"
          value={<StatusBadge value={data.status} map={STATUS_CFG} />}
        />
        <Field
          label="Gravidade"
          value={<span className={sev.cls}>{sev.label}</span>}
        />
      </Section>

      <Section title="Autor e contexto">
        <Field
          label="Utilizador"
          value={
            data.user
              ? `${data.user.fullName} (${data.user.email})`
              : 'Sistema / processo automático'
          }
        />
        <Field label="Perfil" value={data.user?.role?.name} />
        <Field label="Departamento" value={data.user?.department?.name} />
        <Field label="Data e hora" value={fmtTs(data.timestamp)} />
        <Field label="IP de origem" value={data.ip} />
        <Field label="Navegador / dispositivo" value={data.userAgent} />
        <Field label="Correlação" value={data.correlationId} />
        <Field label="Motivo / justificação" value={data.reason} />
      </Section>

      {(hasChanges || hasValues) && (
        <Section title="Alterações efectuadas">
          {hasChanges ? (
            <DiffViewer changes={data.changes!} />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(['before', 'after'] as const).map((k) => (
                <div key={k}>
                  <div className="mb-1 font-body text-xs text-ink-faint">
                    {k === 'before' ? 'Valor anterior' : 'Valor posterior'}
                  </div>
                  <pre className="max-h-40 overflow-auto rounded bg-surface-sunken p-2 font-data text-xs">
                    {data[k] != null ? JSON.stringify(data[k], null, 2) : '—'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {data.metadata && Object.keys(data.metadata).length > 0 && (
        <Section title="Contexto técnico">
          <pre className="max-h-40 overflow-auto rounded bg-surface-sunken p-2 font-data text-xs">
            {JSON.stringify(data.metadata, null, 2)}
          </pre>
        </Section>
      )}

      <Section title="Mesmo registo">
        <Related events={data.related.sameRecord} onOpen={onOpen} />
      </Section>
      <Section title="Mesmo autor (±10 min)">
        <Related events={data.related.sameActor} onOpen={onOpen} />
      </Section>

      <div className="mt-5 flex justify-end gap-2">
        {onFilter && data.entityId && (
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onFilter(data.entity, data.entityId!)}
          >
            Consultar eventos do registo
          </Button>
        )}
        <Button intent="secondary" size="sm" onClick={() => window.print()}>
          <Printer size={14} className="mr-1" /> Imprimir
        </Button>
      </div>
    </div>
  );
}
