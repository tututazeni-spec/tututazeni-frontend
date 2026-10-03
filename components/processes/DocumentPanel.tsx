// components/processes/DocumentPanel.tsx
// Detalhe e ciclo de vida de um documento de processo (docs/Modulo_Processes.md
// §11): informação registada, histórico de versões e as acções — submeter para
// aprovação, validar, assinar, nova versão / renovação e arquivar. As
// permissões chegam do backend (`permissions`) e são reforçadas lá.

'use client';

import { useState } from 'react';
import { ExternalLink, FileDown } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { API_URL, apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { CONFIDENTIALITY_MAP, DOC_STATUS_MAP } from './constants';
import { ReasonDialog } from './ReasonDialog';
import { Skeleton } from './Skeleton';
import type { DocumentVersions, ProcessDocumentRow } from './types';

export interface DocumentPanelProps {
  doc: ProcessDocumentRow;
  onClose: () => void;
  onOpenInstance: (instanceId: number) => void;
  /** Anexa o ficheiro que cumpre um pedido (abre o formulário de anexo). */
  onFulfil: (doc: ProcessDocumentRow) => void;
}

type Sub = 'reject' | 'archive' | 'version' | null;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
    <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
  </div>
);

const ORIGIN_LABEL = { ATTACHED: 'Anexado', GENERATED: 'Gerado de modelo', REQUESTED: 'Pedido' } as const;

export function DocumentPanel({ doc, onClose, onOpenInstance, onFulfil }: DocumentPanelProps) {
  const notify = useToast();
  const [sub, setSub] = useState<Sub>(null);
  const [verNote, setVerNote] = useState('');
  const [verValid, setVerValid] = useState('');

  const { data: versions } = useApiQuery<DocumentVersions>(
    queryKeys.processes.documentVersions(doc.id),
    `/processes/documents/${doc.id}/versions`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const run = useApiMutation(
    (v: { path: string; body?: Record<string, unknown>; ok: string }) =>
      apiClient.post(`/processes/documents/${doc.id}/${v.path}`, v.body ?? {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (_d, v) => {
        notify({ title: v.ok, intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const downloadPdf = async () => {
    try {
      const res = await fetch(`${API_URL}/processes/documents/${doc.id}/pdf`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter o PDF');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Falha ao obter o PDF', intent: 'danger' });
    }
  };

  const { permissions: perm } = doc;
  const live = !doc.archivedAt && doc.instance.status !== 'CANCELLED';
  const isRequest = doc.validationStatus === 'REQUESTED';
  const canSubmit = live && perm.canManage && !isRequest && ['PENDING', 'REJECTED'].includes(doc.validationStatus);
  const canSign =
    live && doc.signatureRequired && doc.signatureStatus === 'PENDING' && doc.validationStatus === 'APPROVED';
  const canVersion = live && perm.canManage && !isRequest;

  return (
    <>
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent
          title={doc.name}
          description={`${doc.instance.code} — ${doc.instance.title}`}
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
        >
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={doc.effectiveStatus} map={DOC_STATUS_MAP} variant="dot" />
            <StatusBadge value={doc.confidentiality} map={CONFIDENTIALITY_MAP} />
            {doc.required && (
              <span className="rounded-control bg-primary-subtle px-2 py-0.5 font-body text-xs text-primary">
                Obrigatório
              </span>
            )}
            {doc.archivedAt && (
              <span className="rounded-control bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted">
                Arquivado
              </span>
            )}
            {doc.expiringSoon && (
              <span className="rounded-control bg-warning-subtle px-2 py-0.5 font-body text-xs text-warning-ink">
                Expira em {doc.daysLeft} dia(s)
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Tipo documental">{doc.docType}</Field>
            <Field label="Versão">{doc.version}</Field>
            <Field label="Origem">{ORIGIN_LABEL[doc.origin]}</Field>
            <Field label="Autor / emissor">{doc.author?.fullName ?? '—'}</Field>
            <Field label="Data de emissão">{formatDate(doc.issuedAt)}</Field>
            <Field label="Data de validade">{formatDate(doc.validUntil)}</Field>
            <Field label="Etapa">{doc.stepId ? `#${doc.stepId}` : '—'}</Field>
            <Field label="Entidade relacionada">
              {doc.relatedEntity ? [doc.relatedEntity.type, doc.relatedEntity.id].filter(Boolean).join(' ') : '—'}
            </Field>
            <Field label="Identificador">
              {doc.source?.kind === 'REPOSITORY'
                ? (doc.source.code ?? `DOC-${doc.source.id}`)
                : doc.source?.kind === 'LIBRARY'
                  ? `BIB-${doc.source.id.slice(0, 8)}`
                  : `PD-${doc.id}`}
            </Field>
            <Field label="Responsável pela aprovação">{doc.approver?.fullName ?? '—'}</Field>
            <Field label="Decisão">
              {doc.decidedAt ? `${doc.decidedBy?.fullName ?? ''} · ${formatDateTime(doc.decidedAt)}` : '—'}
              {doc.decisionNote && <div className="text-xs text-ink-muted">«{doc.decisionNote}»</div>}
            </Field>
            <Field label="Assinatura">
              {!doc.signatureRequired
                ? 'Não exigida'
                : doc.signatureStatus === 'SIGNED'
                  ? `Assinado por ${doc.signedBy?.fullName ?? ''} · ${formatDate(doc.signedAt)}`
                  : 'Pendente'}
            </Field>
            <Field label="Permissões de consulta">
              {doc.confidentiality === 'CONFIDENTIAL' && doc.viewRoles.length
                ? doc.viewRoles.join(', ')
                : doc.viewerIds.length
                  ? `${doc.viewerIds.length} utilizador(es) nomeado(s)`
                  : 'Participantes do processo'}
            </Field>
            <Field label="Retenção">{doc.retentionUntil ? `até ${formatDate(doc.retentionUntil)}` : '—'}</Field>
            {isRequest && (
              <Field label="Pedido a">
                {doc.requestedFrom?.fullName ?? '—'}
                {doc.requestNote && <div className="text-xs text-ink-muted">«{doc.requestNote}»</div>}
              </Field>
            )}
          </div>

          {doc.archivedAt && doc.archiveReason && (
            <p className="mt-3 font-body text-sm text-ink-muted">Motivo do arquivo: {doc.archiveReason}</p>
          )}

          {/* Ficheiro */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-body text-sm text-primary hover:underline"
              >
                <ExternalLink size={14} strokeWidth={1.75} />
                Abrir {doc.source?.kind === 'LIBRARY' ? 'na Biblioteca' : 'no repositório'}
              </a>
            )}
            {doc.fileRestricted && (
              <span className="font-body text-xs text-ink-faint">
                Sem acesso ao ficheiro no repositório — peça permissão ao responsável do documento.
              </span>
            )}
            {doc.generated && (
              <button
                type="button"
                onClick={downloadPdf}
                className="inline-flex items-center gap-1 font-body text-sm text-primary hover:underline"
              >
                <FileDown size={14} strokeWidth={1.75} />
                Descarregar PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenInstance(doc.instance.id)}
              className="font-body text-sm text-primary hover:underline"
            >
              Abrir processo
            </button>
          </div>

          {/* Histórico de versões */}
          <div className="mt-5">
            <div className="font-body text-xs uppercase tracking-wide text-ink-faint">
              Histórico de versões
            </div>
            {!versions ? (
              <div className="mt-2">
                <Skeleton rows={1} />
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {versions.versions.map((v) => (
                  <li key={v.id} className="rounded-card border border-border p-2 font-body text-xs">
                    <div className="text-ink">
                      <b>v{v.version}</b>
                      {v.version === versions.current ? ' (actual)' : ''} · {v.author.fullName} ·{' '}
                      {formatDateTime(v.createdAt)}
                    </div>
                    {v.note && <div className="text-ink-muted">{v.note}</div>}
                    {v.validUntil && <div className="text-ink-faint">Validade: {formatDate(v.validUntil)}</div>}
                  </li>
                ))}
                {versions.repository.length > 0 && (
                  <li className="font-body text-xs text-ink-faint">
                    O ficheiro tem {versions.repository.length} versão(ões) no repositório central.
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Nova versão / renovação */}
          {sub === 'version' && (
            <div className="mt-4 space-y-3 rounded-card border border-border p-3">
              <FormField label="O que mudou / motivo da renovação *" htmlFor="ver-note">
                <Textarea id="ver-note" rows={2} value={verNote} onChange={(e) => setVerNote(e.target.value)} className="w-full" />
              </FormField>
              <FormField label="Nova data de validade" htmlFor="ver-valid">
                <Input id="ver-valid" type="date" value={verValid} onChange={(e) => setVerValid(e.target.value)} />
              </FormField>
              <p className="font-body text-xs text-ink-faint">
                A nova versão volta a exigir validação (e assinatura, se aplicável).
              </p>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={() => setSub(null)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!verNote.trim() || (!verValid && doc.origin !== 'GENERATED')}
                  loading={run.isPending}
                  onClick={() =>
                    run.mutate({
                      path: 'versions',
                      ok: 'Nova versão criada',
                      body: {
                        note: verNote.trim(),
                        ...(verValid ? { validUntil: new Date(`${verValid}T23:59:59`).toISOString() } : {}),
                      },
                    })
                  }
                >
                  Criar versão
                </Button>
              </div>
            </div>
          )}

          {/* Acções */}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            {isRequest && live && (
              <Button onClick={() => onFulfil(doc)}>Anexar documento pedido</Button>
            )}
            {canSubmit && (
              <Button
                intent="secondary"
                loading={run.isPending}
                onClick={() => run.mutate({ path: 'submit', ok: 'Submetido para aprovação' })}
              >
                {doc.validationStatus === 'REJECTED' ? 'Resubmeter' : 'Reenviar para aprovação'}
              </Button>
            )}
            {perm.canDecide && (
              <>
                <Button intent="danger" onClick={() => setSub('reject')}>
                  Rejeitar
                </Button>
                <Button
                  loading={run.isPending}
                  onClick={() =>
                    run.mutate({ path: 'decide', ok: 'Documento validado', body: { decision: 'APPROVE' } })
                  }
                >
                  Validar
                </Button>
              </>
            )}
            {canSign && (
              <Button loading={run.isPending} onClick={() => run.mutate({ path: 'sign', ok: 'Documento assinado' })}>
                Assinar
              </Button>
            )}
            {canVersion && sub !== 'version' && (
              <Button intent="secondary" onClick={() => setSub('version')}>
                {doc.expired || doc.expiringSoon ? 'Renovar' : 'Nova versão'}
              </Button>
            )}
            {live && perm.canManage && (
              <Button intent="ghost" onClick={() => setSub('archive')}>
                Arquivar
              </Button>
            )}
          </div>
        </ModalContent>
      </Modal>

      {sub === 'reject' && (
        <ReasonDialog
          title="Rejeitar documento"
          label="Motivo da rejeição"
          confirmLabel="Rejeitar"
          destructive
          loading={run.isPending}
          onClose={() => setSub(null)}
          onConfirm={(note) =>
            run.mutate({ path: 'decide', ok: 'Documento rejeitado', body: { decision: 'REJECT', note } })
          }
        />
      )}
      {sub === 'archive' && (
        <ReasonDialog
          title="Arquivar documento"
          description="O documento não é apagado: fica arquivado e sujeito às regras de retenção."
          label="Motivo do arquivo"
          confirmLabel="Arquivar"
          loading={run.isPending}
          onClose={() => setSub(null)}
          onConfirm={(reason) => run.mutate({ path: 'archive', ok: 'Documento arquivado', body: { reason } })}
        />
      )}
    </>
  );
}
