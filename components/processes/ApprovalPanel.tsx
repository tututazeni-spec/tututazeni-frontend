// components/processes/ApprovalPanel.tsx
// Detalhe e decisão de um pedido de aprovação (docs/Modulo_Processes.md §7):
// todos os campos do pedido, os dados e a versão analisados, o grupo de
// aprovadores, comentários e histórico, e as decisões — aprovar, rejeitar,
// devolver para correcção, pedir informação, delegar e escalar. O backend
// valida a autorização e a segregação de funções; `permissions` só decide
// que botões se mostram.

'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { APPROVAL_STATUS_MAP, PRIORITY_MAP } from './constants';
import { Skeleton } from './Skeleton';
import { UserPicker } from './UserPicker';
import type { ApprovalDecision, ApprovalDetail } from './approval-types';

export interface ApprovalPanelProps {
  id: number;
  onClose: () => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
    <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
    {children}
  </h4>
);

const MODE_LABEL: Record<string, string> = {
  SEQUENTIAL: 'Sequencial',
  PARALLEL: 'Em paralelo',
  ANY: 'Qualquer aprovador',
};

const DECISION_LABEL: Record<string, string> = {
  APPROVE: 'Aprovada',
  REJECT: 'Rejeitada',
  RETURN: 'Devolvida para correcção',
};

const HISTORY_LABEL: Record<string, string> = {
  APPROVAL_REQUESTED: 'Aprovação solicitada',
  APPROVAL_APPROVED: 'Aprovada',
  APPROVAL_REJECTED: 'Rejeitada',
  APPROVAL_RETURNED: 'Devolvida para correcção',
  APPROVAL_INFO_REQUESTED: 'Informação adicional pedida',
  APPROVAL_INFO_PROVIDED: 'Informação adicional fornecida',
  APPROVAL_DELEGATED: 'Delegada',
  APPROVAL_ESCALATED: 'Escalada',
  APPROVAL_AUTO_ESCALATED: 'Escalada automaticamente (sem decisão no prazo)',
  APPROVAL_STEP_COMPLETED: 'Etapa de aprovação concluída',
};

interface DialogConfig {
  title: string;
  description?: string;
  justificationLabel: string;
  justificationRequired: boolean;
  confirm: string;
  destructive?: boolean;
  picker?: { label: string; required: boolean };
}

const DIALOGS: Record<Exclude<ApprovalDecision, never>, DialogConfig> = {
  APPROVE: {
    title: 'Aprovar pedido',
    description: 'A aprovação desbloqueia as etapas seguintes; a execução continua com o responsável.',
    justificationLabel: 'Comentário (opcional)',
    justificationRequired: false,
    confirm: 'Aprovar',
  },
  REJECT: {
    title: 'Rejeitar pedido',
    description: 'A rejeição segue a regra definida no modelo do processo.',
    justificationLabel: 'Justificação',
    justificationRequired: true,
    confirm: 'Rejeitar',
    destructive: true,
  },
  RETURN: {
    title: 'Devolver para correcção',
    description: 'As etapas anteriores são reabertas para o solicitante corrigir.',
    justificationLabel: 'O que tem de ser corrigido',
    justificationRequired: true,
    confirm: 'Devolver',
  },
  REQUEST_INFO: {
    title: 'Solicitar informação adicional',
    justificationLabel: 'Pergunta ao solicitante',
    justificationRequired: true,
    confirm: 'Enviar pedido',
  },
  DELEGATE: {
    title: 'Delegar aprovação',
    description: 'O novo aprovador não pode ser quem submeteu o pedido nem o colaborador-alvo.',
    justificationLabel: 'Motivo (opcional)',
    justificationRequired: false,
    confirm: 'Delegar',
    picker: { label: 'Novo aprovador *', required: true },
  },
  ESCALATE: {
    title: 'Escalar para um nível superior',
    description: 'Sem destino, sobe ao gestor do aprovador.',
    justificationLabel: 'Motivo da escalada',
    justificationRequired: true,
    confirm: 'Escalar',
    picker: { label: 'Aprovador de destino (opcional)', required: false },
  },
};

export function ApprovalPanel({ id, onClose }: ApprovalPanelProps) {
  const notify = useToast();
  const [dialog, setDialog] = useState<ApprovalDecision | null>(null);
  const [justification, setJustification] = useState('');
  const [userId, setUserId] = useState('');
  const [reply, setReply] = useState('');

  const { data: a, isLoading, error } = useApiQuery<ApprovalDetail>(
    queryKeys.processes.approval(id),
    `/processes/approvals/${id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const decide = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post(`/processes/approvals/${id}/decide`, body),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Decisão registada', intent: 'success' });
        closeDialog();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const respond = useApiMutation(
    (message: string) => apiClient.post(`/processes/approvals/${id}/respond`, { message }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Resposta enviada', intent: 'success' });
        setReply('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const closeDialog = () => {
    setDialog(null);
    setJustification('');
    setUserId('');
  };

  if (isLoading || !a) {
    return (
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent title="Pedido de aprovação" className="max-w-3xl">
          {error ? (
            <p className="font-body text-sm text-danger">{error.message}</p>
          ) : (
            <Skeleton rows={5} />
          )}
        </ModalContent>
      </Modal>
    );
  }

  const { canDecide, canDelegate, canEscalate, canRespond, segregated } = a.permissions;
  const cfg = dialog ? DIALOGS[dialog] : null;
  const dialogReady =
    !!cfg &&
    (!cfg.justificationRequired || justification.trim().length > 0) &&
    (!cfg.picker?.required || userId !== '');

  const submitDialog = () => {
    if (!dialog || !dialogReady) return;
    decide.mutate({
      decision: dialog,
      ...(justification.trim() ? { justification: justification.trim() } : {}),
      ...(dialog === 'DELEGATE' && userId ? { delegateToId: Number(userId) } : {}),
      ...(dialog === 'ESCALATE' && userId ? { escalateToId: Number(userId) } : {}),
    });
  };

  return (
    <>
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent
          title={`${a.code} — ${a.step.title}`}
          description={`${a.instance.title} · ${a.process.title}`}
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
        >
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={a.status} map={APPROVAL_STATUS_MAP} variant="dot" />
            <StatusBadge value={a.instance.priority} map={PRIORITY_MAP} />
            {a.isOverdue && (
              <span className="rounded-control bg-danger-subtle px-2 py-0.5 font-body text-xs text-danger-ink">
                Prazo ultrapassado
              </span>
            )}
            <span className="font-body text-xs text-ink-faint">
              {MODE_LABEL[a.mode] ?? a.mode} · {a.sequence}º aprovador · ronda {a.round}
            </span>
          </div>

          {segregated && !a.decision && (
            <div className="mt-3 flex items-center gap-2 rounded-card bg-warning-subtle p-3 font-body text-sm text-warning-ink">
              <ShieldAlert size={16} strokeWidth={1.75} />
              Segregação de funções: não pode decidir um pedido que submeteu ou que lhe diz respeito.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Processo">{a.instance.code ?? `#${a.instance.id}`}</Field>
            <Field label="Etapa">
              {a.step.order}. {a.step.title}
            </Field>
            <Field label="Módulo de origem">{a.sourceModule ?? '—'}</Field>
            <Field label="Entidade">
              {a.entity.type ? `${a.entity.type} ${a.entity.id ?? ''}` : '—'}
            </Field>
            <Field label="Colaborador">{a.entity.target.fullName}</Field>
            <Field label="Solicitante">{a.requester.fullName}</Field>
            <Field label="Aprovador designado">
              {a.approver?.fullName ?? (a.approverRole ? `Função ${a.approverRole}` : 'Por atribuir')}
            </Field>
            <Field label="Função e nível">
              {a.level ?? '—'}
              {a.escalationLevel > 0 ? ` · nível ${a.escalationLevel + 1}` : ''}
            </Field>
            <Field label="Submetido em">{formatDateTime(a.submittedAt)}</Field>
            <Field label="Prazo para decisão">{formatDate(a.dueAt)}</Field>
            <Field label="Documentos analisados">
              {a.documentIds.length ? a.documentIds.join(', ') : '—'}
            </Field>
            <Field label="Versão dos dados">
              <span className="font-mono text-xs">{a.dataVersion ?? '—'}</span>
              {a.decidedVersion && a.decidedVersion !== a.dataVersion && (
                <span className="ml-1 text-xs text-warning-ink">(alterados desde a submissão)</span>
              )}
            </Field>
            <Field label="Próximas etapas">{a.nextSteps.length ? a.nextSteps.join(', ') : '—'}</Field>
          </div>

          {a.requesterComment && (
            <div className="mt-4">
              <SectionTitle>Comentários do solicitante</SectionTitle>
              <p className="font-body text-sm text-ink-muted">{a.requesterComment}</p>
            </div>
          )}

          {a.decision && (
            <div className="mt-4 rounded-card border border-border bg-surface-sunken p-3">
              <SectionTitle>Decisão</SectionTitle>
              <p className="font-body text-sm text-ink">
                {DECISION_LABEL[a.decision] ?? a.decision}
                {a.decidedAt ? ` em ${formatDateTime(a.decidedAt)}` : ''}
              </p>
              {a.justification && (
                <p className="mt-1 font-body text-sm text-ink-muted">“{a.justification}”</p>
              )}
              {a.decidedVersion && (
                <p className="mt-1 font-body text-xs text-ink-faint">
                  Versão dos dados analisados:{' '}
                  <span className="font-mono">{a.decidedVersion}</span>
                </p>
              )}
            </div>
          )}

          {a.group.length > 1 && (
            <div className="mt-5">
              <SectionTitle>Aprovadores desta ronda</SectionTitle>
              <ul className="space-y-1">
                {a.group.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 font-body text-sm text-ink-muted">
                    <span className="w-5 text-ink-faint">{g.sequence}.</span>
                    {g.approver?.fullName ?? 'Por atribuir'}
                    <StatusBadge value={g.status} map={APPROVAL_STATUS_MAP} />
                    {g.id === a.id && <span className="text-xs text-ink-faint">(este pedido)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.snapshot && a.snapshot.steps.length > 0 && (
            <div className="mt-5">
              <SectionTitle>Dados analisados (etapas anteriores)</SectionTitle>
              <ul className="space-y-2">
                {a.snapshot.steps.map((s) => (
                  <li key={s.order} className="rounded-card border border-border p-2.5">
                    <div className="flex items-center justify-between font-body text-sm text-ink">
                      <span>
                        {s.order}. {s.title}
                      </span>
                      <span className="font-body text-xs text-ink-faint">
                        {s.status}
                        {s.result ? ` · ${s.result}` : ''}
                      </span>
                    </div>
                    {s.notes && <p className="mt-1 font-body text-xs text-ink-muted">{s.notes}</p>}
                    {s.formData != null && (
                      <pre className="mt-1 overflow-x-auto rounded bg-surface-sunken p-2 font-mono text-xs text-ink-muted">
                        {JSON.stringify(s.formData, null, 2)}
                      </pre>
                    )}
                    {s.evidenceIds.length > 0 && (
                      <p className="mt-1 font-body text-xs text-ink-faint">
                        Documentos: {s.evidenceIds.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canRespond && (
            <div className="mt-5 rounded-card border border-border bg-surface-sunken p-3">
              <h4 className="mb-2 font-body text-sm font-medium text-ink">
                Responder ao pedido de informação
              </h4>
              <Textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={() => respond.mutate(reply.trim())}
                  loading={respond.isPending}
                  disabled={reply.trim().length === 0}
                >
                  Enviar resposta
                </Button>
              </div>
            </div>
          )}

          {(canDecide || canDelegate || canEscalate) && (
            <div className="mt-5 rounded-card border border-border bg-surface-sunken p-3">
              <h4 className="mb-3 font-body text-sm font-medium text-ink">Decisão</h4>
              <div className="flex flex-wrap gap-2">
                {canDecide && (
                  <>
                    <Button intent="success" onClick={() => setDialog('APPROVE')}>
                      Aprovar
                    </Button>
                    <Button intent="danger" onClick={() => setDialog('REJECT')}>
                      Rejeitar
                    </Button>
                    <Button intent="secondary" onClick={() => setDialog('RETURN')}>
                      Devolver para correcção
                    </Button>
                    <Button intent="secondary" onClick={() => setDialog('REQUEST_INFO')}>
                      Pedir informação
                    </Button>
                  </>
                )}
                {canDelegate && (
                  <Button intent="ghost" onClick={() => setDialog('DELEGATE')}>
                    Delegar
                  </Button>
                )}
                {canEscalate && (
                  <Button intent="ghost" onClick={() => setDialog('ESCALATE')}>
                    Escalar
                  </Button>
                )}
              </div>
            </div>
          )}

          {a.comments.length > 0 && (
            <div className="mt-5">
              <SectionTitle>Comentários da etapa</SectionTitle>
              <ul className="space-y-2">
                {a.comments.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-card p-2.5 font-body text-sm ${
                      c.kind === 'SYSTEM'
                        ? 'bg-surface-sunken text-ink-faint'
                        : c.kind === 'CLARIFICATION'
                          ? 'bg-warning-subtle text-warning-ink'
                          : 'border border-border text-ink'
                    }`}
                  >
                    <div className="text-xs text-ink-faint">
                      {c.author.fullName} · {formatDateTime(c.createdAt)}
                    </div>
                    {c.body}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.history.length > 0 && (
            <div className="mt-5">
              <SectionTitle>Histórico da decisão</SectionTitle>
              <ul className="space-y-1">
                {a.history.map((h) => (
                  <li key={h.id} className="font-body text-xs text-ink-muted">
                    <span className="text-ink-faint">{formatDateTime(h.createdAt)}</span> —{' '}
                    {HISTORY_LABEL[h.action] ?? h.action} · {h.user.fullName}
                    {typeof h.meta?.justification === 'string' && h.meta.justification
                      ? ` — “${h.meta.justification}”`
                      : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button intent="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </ModalContent>
      </Modal>

      {cfg && dialog && (
        <Modal open onOpenChange={(o) => !o && closeDialog()}>
          <ModalContent title={cfg.title} description={cfg.description} className="max-w-md">
            <div className="mt-4 space-y-4">
              {cfg.picker && (
                <FormField label={cfg.picker.label} htmlFor="ap-user">
                  <UserPicker value={userId} onChange={setUserId} className="w-full" />
                </FormField>
              )}
              <FormField
                label={cfg.justificationRequired ? `${cfg.justificationLabel} *` : cfg.justificationLabel}
                htmlFor="ap-just"
              >
                <Textarea
                  id="ap-just"
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button intent="ghost" onClick={closeDialog} disabled={decide.isPending}>
                Cancelar
              </Button>
              <Button
                intent={cfg.destructive ? 'danger' : 'primary'}
                disabled={!dialogReady}
                loading={decide.isPending}
                onClick={submitDialog}
              >
                {cfg.confirm}
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
