// components/processes/AuditEventPanel.tsx
// Detalhe de um evento de auditoria (docs/Modulo_Processes.md §13): quem, quando,
// origem, estados, justificação, alterações efectuadas, decisão e documentos
// associados, e a acção seguinte desencadeada. GET /processes/audit/events/:id.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from './Skeleton';
import { AUDIT_SOURCE_LABEL } from './audit-utils';
import type { AuditEventDetail } from './types';

export interface AuditEventPanelProps {
  eventId: number;
  onClose: () => void;
  onOpenEvent: (id: number) => void;
  onOpenInstance: (instanceId: number) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
    </div>
  );
}

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export function AuditEventPanel({ eventId, onClose, onOpenEvent, onOpenInstance }: AuditEventPanelProps) {
  const { data: e, isLoading, error } = useApiQuery<AuditEventDetail>(
    queryKeys.processes.auditEvent(eventId),
    `/processes/audit/events/${eventId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={e?.label ?? 'Evento de auditoria'}
        description={e ? formatDateTime(e.createdAt) : undefined}
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        {isLoading && <Skeleton rows={3} />}
        {error && <div className="mt-3 font-body text-sm text-danger">{error.message}</div>}
        {e && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Utilizador">{e.actor.fullName}</Field>
              <Field label="Função">{e.actor.role ?? '—'}</Field>
              <Field label="Origem">{e.source ? AUDIT_SOURCE_LABEL[e.source] : '—'}</Field>
              <Field label="Resultado">
                <span className={e.result === 'FAILED' ? 'text-danger' : 'text-success-ink'}>
                  {e.result === 'FAILED' ? 'Falhou' : 'Sucesso'}
                </span>
              </Field>
              <Field label="Estado anterior">{e.previousStatus ?? '—'}</Field>
              <Field label="Novo estado">{e.newStatus ?? '—'}</Field>
              <Field label="Modelo">{e.template ? `${e.template.code} — ${e.template.title}` : '—'}</Field>
              <Field label="Processo">
                {e.instance ? (
                  <button
                    type="button"
                    onClick={() => onOpenInstance(e.instance!.id)}
                    className="text-primary hover:underline"
                  >
                    {e.instance.code}
                  </button>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Etapa">{e.stepId ? `#${e.stepId}` : '—'}</Field>
            </div>

            {e.reason && <Field label="Justificação / comentário">{e.reason}</Field>}
            {e.errorMessage && (
              <div className="rounded-control bg-danger-subtle px-3 py-2 font-body text-sm text-danger-ink">
                {e.errorMessage}
              </div>
            )}

            {e.meta && Object.keys(e.meta).length > 0 && (
              <div>
                <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Alterações e dados do evento
                </div>
                <dl className="divide-y divide-border rounded-card border border-border">
                  {Object.entries(e.meta).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2">
                      <dt className="font-body text-xs text-ink-muted">{k}</dt>
                      <dd className="col-span-2 break-words font-mono text-xs text-ink">{show(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {e.approval && (
              <div className="rounded-card border border-border p-3">
                <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Decisão associada
                </div>
                <div className="font-body text-sm text-ink">
                  Aprovação #{e.approval.id} — {e.approval.status}
                  {e.approval.decision ? ` (${e.approval.decision})` : ''}
                  {e.approval.decidedAt ? ` em ${formatDateTime(e.approval.decidedAt)}` : ''}
                </div>
                {e.approval.justification && (
                  <p className="mt-1 font-body text-sm text-ink-muted">{e.approval.justification}</p>
                )}
              </div>
            )}

            {e.document && (
              <div className="rounded-card border border-border p-3">
                <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Documento associado
                </div>
                <div className="font-body text-sm text-ink">
                  {e.document.name} — versão {e.document.version} ({e.document.validationStatus})
                </div>
                {e.document.versions.length > 0 && (
                  <p className="mt-1 font-body text-xs text-ink-muted">
                    Versões: {e.document.versions.map((v) => v.version).join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-card border border-border p-3">
                <div className="font-body text-xs uppercase tracking-wide text-ink-faint">Evento anterior</div>
                {e.previousEvent ? (
                  <button
                    type="button"
                    onClick={() => onOpenEvent(e.previousEvent!.id)}
                    className="mt-1 text-left font-body text-sm text-primary hover:underline"
                  >
                    {e.previousEvent.label} · {formatDateTime(e.previousEvent.createdAt)}
                  </button>
                ) : (
                  <div className="mt-1 font-body text-sm text-ink-faint">Primeiro registo do processo</div>
                )}
              </div>
              <div className="rounded-card border border-border p-3">
                <div className="font-body text-xs uppercase tracking-wide text-ink-faint">
                  Próxima acção desencadeada
                </div>
                {e.nextEvent ? (
                  <button
                    type="button"
                    onClick={() => onOpenEvent(e.nextEvent!.id)}
                    className="mt-1 text-left font-body text-sm text-primary hover:underline"
                  >
                    {e.nextEvent.label} · {formatDateTime(e.nextEvent.createdAt)}
                    {e.nextEvent.source ? ` (${AUDIT_SOURCE_LABEL[e.nextEvent.source]})` : ''}
                  </button>
                ) : (
                  <div className="mt-1 font-body text-sm text-ink-faint">Nenhuma registada</div>
                )}
              </div>
            </div>

            <div className="font-mono text-[11px] text-ink-faint">
              ID {e.id}
              {e.correlationId ? ` · correlação ${e.correlationId}` : ''} · hash {e.hash.slice(0, 16)}…
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
