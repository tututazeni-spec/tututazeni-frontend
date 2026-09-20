// components/documents/DetailDrawer.tsx
// Painel lateral de detalhe do documento seleccionado. Extraído de
// app/(platform)/documents/page.tsx. Migrado para a fundação de design:
// classes Tailwind cruas passam a tokens; pill de categoria passa a Badge;
// botões de acção passam a Button; botão fechar passa a IconButton. Mantém-
// se bespoke (não Radix Dialog) — é um painel lateral, não há um componente
// "Drawer" na fundação (components/ui/) e não é para inventar um a meio
// deste módulo; comportamento idêntico ao original (fecha por clique no
// backdrop ou no X).
//
// docs/biblioteca.md acrescentou: badge de estado do fluxo de aprovação +
// botões de transição (role-gated), histórico de versões (carregado on-
// demand via GET /documents/:id — a lista não inclui `versions`), e a
// secção de confirmação de leitura (banner para o colaborador, % de
// conclusão para ADMIN/RH/DIRECTOR).

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  Share2,
  Star,
  X,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { CATEGORY_CONFIG, STATUS_CONFIG } from './constants';
import {
  useConfirmRead,
  useDocumentWorkflow,
  usePendingReads,
  useReadStatus,
  useRejectDocument,
  useToggleFavorite,
} from './hooks';
import { formatBytes } from './utils';
import type { Document, DocVersionRow } from './types';

interface DetailDrawerProps {
  doc: Document;
  onClose: () => void;
  onDownload: (d: Document) => void;
}

// Espelha @Roles(...) nos endpoints de aprovação em
// document-repository.controller.ts.
const APPROVER_ROLES = ['ADMIN', 'RH', 'DIRECTOR'];
const WORKFLOW_ROLES = ['ADMIN', 'RH', 'GESTOR'];

export function DetailDrawer({ doc, onClose, onDownload }: DetailDrawerProps) {
  const role = useCurrentRole();
  const catCfg = CATEGORY_CONFIG[doc.category];
  const statusCfg = STATUS_CONFIG[doc.status];
  const [showHistory, setShowHistory] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: detail } = useApiQuery<Document & { versions: DocVersionRow[] }>(
    queryKeys.documents.detail(doc.id),
    `/documents/${doc.id}`,
    { enabled: showHistory },
  );

  const { data: pendingReads } = usePendingReads();
  const isPendingForMe = pendingReads.some((p) => p.id === doc.id);
  const { data: readStatus } = useReadStatus(
    APPROVER_ROLES.includes(role ?? '') && doc.requiresReadConfirmation ? doc.id : null,
  );

  const workflow = useDocumentWorkflow();
  const reject = useRejectDocument();
  const confirmRead = useConfirmRead();
  const toggleFavorite = useToggleFavorite();

  const canWorkflow = WORKFLOW_ROLES.includes(role ?? '');
  const canApprove = APPROVER_ROLES.includes(role ?? '');

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md h-full overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              {doc.documentCode && (
                <p className="text-xs font-mono text-ink-faint mb-1">
                  {doc.documentCode}
                  {doc.documentNumber && ` · ${doc.documentNumber}`}
                </p>
              )}
              <h2 className="font-bold text-ink text-lg">{doc.title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {catCfg && <Badge intent={catCfg.intent}>{catCfg.label}</Badge>}
                {statusCfg && <Badge intent={statusCfg.intent}>{statusCfg.label}</Badge>}
              </div>
            </div>
            <IconButton icon={X} label="Fechar" intent="ghost" onClick={onClose} />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {doc.requiresReadConfirmation && isPendingForMe && (
            <div className="rounded-card border border-warning bg-warning-subtle p-3 space-y-2">
              <div className="flex items-center gap-2 text-warning-ink text-sm font-medium">
                <AlertTriangle size={15} strokeWidth={1.75} />
                Leitura obrigatória pendente
              </div>
              <Button
                size="sm"
                onClick={() => confirmRead.mutate(doc.id)}
                loading={confirmRead.isPending}
              >
                <CheckCircle2 size={14} strokeWidth={1.75} /> Confirmar leitura
              </Button>
            </div>
          )}

          {canApprove && doc.requiresReadConfirmation && readStatus && (
            <div className="rounded-card border border-border bg-surface-sunken p-3 text-sm">
              <p className="text-ink-muted mb-1">Confirmação de leitura</p>
              <p className="font-semibold text-ink">
                {readStatus.confirmedCount} / {readStatus.totalRequired} ({readStatus.percentage}%)
              </p>
              {readStatus.pendingUsers.length > 0 && (
                <p className="mt-1 text-xs text-ink-faint">
                  Por confirmar: {readStatus.pendingUsers.map((u) => u.fullName).join(', ')}
                </p>
              )}
            </div>
          )}

          {[
            { label: 'Versão', value: doc.version },
            { label: 'Tamanho', value: formatBytes(doc.fileSize) },
            { label: 'Departamento', value: doc.department ?? '—' },
            {
              label: 'Criado por',
              value: doc.createdBy?.fullName ?? '—',
            },
            {
              label: 'Proprietário',
              value: doc.owner?.fullName ?? '—',
            },
            {
              label: 'Elaborador',
              value: doc.elaboratedBy?.fullName ?? '—',
            },
            {
              label: 'Aprovador',
              value: doc.approver?.fullName ?? '—',
            },
            {
              label: 'Validade',
              value: doc.expiresAt
                ? new Date(doc.expiresAt).toLocaleDateString('pt-PT')
                : '—',
            },
            {
              label: 'Retenção legal',
              value: doc.retentionUntil
                ? new Date(doc.retentionUntil).toLocaleDateString('pt-PT')
                : '—',
            },
            {
              label: 'Downloads',
              value: String(doc.downloadCount ?? 0),
            },
            {
              label: 'Versões',
              value: String(doc._count?.versions ?? 1),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2 border-b border-border last:border-0 text-sm"
            >
              <span className="text-ink-muted">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          ))}

          {doc.tags.length > 0 && (
            <div>
              <p className="text-xs text-ink-muted mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded-pill"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {canWorkflow && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <p className="text-xs text-ink-muted">Fluxo de aprovação</p>
              <div className="flex flex-wrap gap-2">
                {doc.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => workflow.mutate({ id: doc.id, action: 'submit-review' })}
                  >
                    Enviar para revisão
                  </Button>
                )}
                {doc.status === 'EM_REVISAO' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => workflow.mutate({ id: doc.id, action: 'submit-approval' })}
                  >
                    Enviar para aprovação
                  </Button>
                )}
                {doc.status === 'PENDENTE_APROVACAO' && canApprove && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => workflow.mutate({ id: doc.id, action: 'approve' })}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      intent="danger"
                      onClick={() => setShowRejectReason((s) => !s)}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                {doc.status === 'APROVADO' && (
                  <Button
                    size="sm"
                    onClick={() => workflow.mutate({ id: doc.id, action: 'publish' })}
                  >
                    Publicar
                  </Button>
                )}
                {doc.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => workflow.mutate({ id: doc.id, action: 'suspend' })}
                  >
                    Suspender
                  </Button>
                )}
                {doc.status === 'SUSPENSO' && (
                  <Button
                    size="sm"
                    onClick={() => workflow.mutate({ id: doc.id, action: 'publish' })}
                  >
                    Republicar
                  </Button>
                )}
              </div>
              {showRejectReason && (
                <div className="flex gap-2">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motivo da rejeição"
                    className="flex-1 px-3 py-1.5 text-xs border border-border-strong rounded-control bg-surface focus:outline-none focus:border-accent"
                  />
                  <Button
                    size="sm"
                    intent="danger"
                    disabled={!rejectReason.trim()}
                    onClick={() => {
                      reject.mutate({ id: doc.id, reason: rejectReason });
                      setShowRejectReason(false);
                      setRejectReason('');
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => onDownload(doc)}>
              <Download size={15} strokeWidth={1.75} /> Download
            </Button>
            <Button intent="secondary" onClick={() => toggleFavorite.mutate(doc.id)}>
              <Star size={15} strokeWidth={1.75} /> Favorito
            </Button>
            <Button intent="secondary">
              <Share2 size={15} strokeWidth={1.75} /> Partilhar
            </Button>
            <Button intent="secondary" onClick={() => setShowHistory((s) => !s)}>
              <History size={15} strokeWidth={1.75} /> Histórico de versões
              {showHistory ? (
                <ChevronUp size={14} strokeWidth={1.75} />
              ) : (
                <ChevronDown size={14} strokeWidth={1.75} />
              )}
            </Button>
            {showHistory && (
              <div className="space-y-2 rounded-card border border-border p-3">
                {!detail ? (
                  <p className="text-xs text-ink-faint">A carregar…</p>
                ) : detail.versions.length === 0 ? (
                  <p className="text-xs text-ink-faint">Sem histórico de versões.</p>
                ) : (
                  detail.versions.map((v) => (
                    <div key={v.id} className="text-xs border-b border-border last:border-0 pb-2">
                      <div className="flex justify-between font-medium text-ink">
                        <span>v{v.versionNumber}.0</span>
                        <span className="text-ink-faint">
                          {new Date(v.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      <p className="text-ink-muted mt-0.5">{v.changeDescription}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
