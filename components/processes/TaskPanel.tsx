// components/processes/TaskPanel.tsx
// Detalhe e execução de uma tarefa (docs/Modulo_Processes.md §6): dados da
// tarefa, dependências, checklist, comentários e as acções — iniciar,
// concluir (com requisitos obrigatórios), bloquear/desbloquear, pedir
// esclarecimento, devolver para correcção, reabrir, reatribuir, lembrar e
// escalar. As permissões vêm do backend (`permissions`) e são reforçadas lá.

'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
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
import { PRIORITY_MAP, STEP_TYPE_MAP, TASK_STATE_MAP } from './constants';
import { ReasonDialog } from './ReasonDialog';
import { Skeleton } from './Skeleton';
import { UserPicker } from './UserPicker';
import type { TaskDetail } from './types';

export interface TaskPanelProps {
  instanceId: number;
  stepId: number;
  onClose: () => void;
}

type Sub =
  | 'block'
  | 'return'
  | 'reopen'
  | 'escalate'
  | 'reassign'
  | 'clarify'
  | null;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
    <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
  </div>
);

export function TaskPanel({ instanceId, stepId, onClose }: TaskPanelProps) {
  const notify = useToast();
  const [sub, setSub] = useState<Sub>(null);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [evidence, setEvidence] = useState('');
  const [comment, setComment] = useState('');
  const [mention, setMention] = useState('');
  const [reassignTo, setReassignTo] = useState('');

  const base = `/processes/instances/${instanceId}/steps/${stepId}`;
  const key = queryKeys.processes.task(instanceId, stepId);

  const { data: t, isLoading, error } = useApiQuery<TaskDetail>(
    key,
    `/processes/tasks/${instanceId}/${stepId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const run = useApiMutation(
    (v: {
      path: string;
      method?: 'post' | 'patch';
      body?: Record<string, unknown>;
      ok?: string;
    }) => apiClient[v.method ?? 'post'](`${base}/${v.path}`, v.body ?? {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (_d, v) => {
        if (v.ok) notify({ title: v.ok, intent: 'success' });
        setSub(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const act = (
    path: string,
    ok: string,
    body?: Record<string, unknown>,
    method?: 'post' | 'patch',
  ) => run.mutate({ path, ok, body, method });

  if (isLoading || !t) {
    return (
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent title="Tarefa" className="max-w-3xl">
          {error ? (
            <p className="font-body text-sm text-danger">{error.message}</p>
          ) : (
            <Skeleton rows={5} />
          )}
        </ModalContent>
      </Modal>
    );
  }

  const { canAct, canReview, canManage } = t.permissions;
  const active = ['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(t.status);
  const doneItems = new Set(t.checklist.done);
  const checklistComplete = t.checklist.items.every((i) => doneItems.has(i));

  const toggleItem = (item: string) => {
    const next = doneItems.has(item)
      ? t.checklist.done.filter((i) => i !== item)
      : [...t.checklist.done, item];
    act('checklist', 'Checklist actualizada', { done: next }, 'patch');
  };

  const complete = () => {
    const ids = evidence
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    act('complete', 'Tarefa concluída', {
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(result.trim() ? { result: result.trim() } : {}),
      ...(ids.length ? { evidenceIds: ids } : {}),
      checklistDone: t.checklist.done,
    });
  };

  const reasonDialogs: Record<
    'block' | 'return' | 'reopen' | 'escalate' | 'clarify',
    {
      title: string;
      label?: string;
      required?: boolean;
      confirm: string;
      destructive?: boolean;
      run: (reason: string) => void;
    }
  > = {
    block: {
      title: 'Bloquear tarefa',
      label: 'Falta de informação / motivo',
      confirm: 'Bloquear',
      run: (reason) => act('block', 'Tarefa bloqueada', { reason }),
    },
    return: {
      title: 'Devolver para correcção',
      label: 'O que tem de ser corrigido',
      confirm: 'Devolver',
      run: (reason) => act('return', 'Tarefa devolvida', { reason }),
    },
    reopen: {
      title: 'Reabrir tarefa',
      confirm: 'Reabrir',
      run: (reason) => act('reopen', 'Tarefa reaberta', { reason }),
    },
    escalate: {
      title: 'Escalar tarefa',
      label: 'Motivo',
      required: false,
      confirm: 'Escalar',
      run: (reason) => act('escalate', 'Tarefa escalada', reason ? { reason } : {}),
    },
    clarify: {
      title: 'Pedir esclarecimento',
      label: 'Pergunta',
      confirm: 'Enviar pedido',
      run: (message) => act('clarification', 'Pedido enviado', { message }),
    },
  };

  return (
    <>
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent
          title={`${t.code} — ${t.name}`}
          description={`${t.process.instanceTitle} · etapa ${t.stage}`}
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
        >
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={t.status} map={TASK_STATE_MAP} variant="dot" />
            <StatusBadge value={t.type} map={STEP_TYPE_MAP} />
            <StatusBadge value={t.process.priority} map={PRIORITY_MAP} />
            {t.isOverdue && (
              <span className="rounded-control bg-danger-subtle px-2 py-0.5 font-body text-xs text-danger-ink">
                Prazo ultrapassado
              </span>
            )}
            {t.returnCount > 0 && (
              <span className="font-body text-xs text-ink-faint">
                devolvida {t.returnCount}×
              </span>
            )}
          </div>

          {t.blockedReason && t.status === 'BLOCKED' && (
            <div className="mt-3 rounded-card bg-warning-subtle p-3 font-body text-sm text-warning-ink">
              Bloqueada: {t.blockedReason}
            </div>
          )}
          {t.returnReason && t.status !== 'COMPLETED' && (
            <div className="mt-3 rounded-card bg-warning-subtle p-3 font-body text-sm text-warning-ink">
              Devolvida para correcção: {t.returnReason}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Processo">{t.process.instanceCode ?? t.process.code}</Field>
            <Field label="Colaborador">{t.process.target.fullName}</Field>
            <Field label="Responsável">{t.assignee?.fullName ?? 'Por atribuir'}</Field>
            <Field label="Revisor">{t.reviewer?.fullName ?? '—'}</Field>
            <Field label="Atribuída em">{formatDate(t.assignedAt)}</Field>
            <Field label="Iniciada em">{formatDate(t.startedAt)}</Field>
            <Field label="Prazo">{formatDate(t.dueAt)}</Field>
            <Field label="Concluída em">
              {t.completedAt ? `${formatDate(t.completedAt)}${t.completedBy ? ` · ${t.completedBy.fullName}` : ''}` : '—'}
            </Field>
            <Field label="Evidências">{t.evidenceIds.length ? t.evidenceIds.join(', ') : t.requiresUpload ? 'Obrigatória' : '—'}</Field>
          </div>

          {t.description && (
            <p className="mt-4 font-body text-sm text-ink-muted">{t.description}</p>
          )}
          {t.result && (
            <div className="mt-3">
              <Field label="Resultado">{t.result}</Field>
            </div>
          )}

          {/* Dependências */}
          {t.dependencies.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Depende de
              </h4>
              <ul className="space-y-1">
                {t.dependencies.map((d) => (
                  <li key={d.order} className="flex items-center gap-2 font-body text-sm text-ink-muted">
                    {d.done ? (
                      <CheckCircle2 size={14} className="text-success" />
                    ) : (
                      <Circle size={14} className="text-ink-faint" />
                    )}
                    Etapa {d.order} — {d.title}
                    <StatusBadge value={d.status} map={TASK_STATE_MAP} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist / subtarefas */}
          {t.checklist.items.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Lista de verificação ({t.checklist.done.length}/{t.checklist.items.length})
              </h4>
              <ul className="space-y-1.5">
                {t.checklist.items.map((item) => (
                  <li key={item}>
                    <label className="flex items-center gap-2 font-body text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={doneItems.has(item)}
                        disabled={!(canAct || canReview) || run.isPending || !active}
                        onChange={() => toggleItem(item)}
                      />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concluir */}
          {canAct && active && (
            <div className="mt-5 rounded-card border border-border bg-surface-sunken p-3">
              <h4 className="mb-3 font-body text-sm font-medium text-ink">Concluir tarefa</h4>
              <div className="space-y-3">
                <FormField label="Resultado" htmlFor="tp-result">
                  <Textarea id="tp-result" rows={2} value={result} onChange={(e) => setResult(e.target.value)} className="w-full" />
                </FormField>
                <FormField label="Notas" htmlFor="tp-notes">
                  <Input id="tp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </FormField>
                {t.requiresUpload && (
                  <FormField
                    label="IDs das evidências *"
                    htmlFor="tp-evidence"
                    hint="Documentos do repositório, separados por vírgula."
                  >
                    <Input id="tp-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
                  </FormField>
                )}
                <Button
                  onClick={complete}
                  loading={run.isPending}
                  disabled={
                    !checklistComplete ||
                    (t.requiresUpload && t.evidenceIds.length === 0 && evidence.trim() === '')
                  }
                >
                  Concluir
                </Button>
                {!checklistComplete && (
                  <p className="font-body text-xs text-ink-faint">
                    Complete a lista de verificação para concluir.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comentários */}
          <div className="mt-5">
            <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Comentários
            </h4>
            <ul className="space-y-2">
              {t.comments.length === 0 && (
                <li className="font-body text-sm text-ink-faint">Sem comentários.</li>
              )}
              {t.comments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-card border border-border p-2.5 font-body text-sm ${
                    c.kind === 'SYSTEM' ? 'bg-surface-sunken text-ink-muted' : 'bg-surface text-ink'
                  }`}
                >
                  <div className="mb-0.5 flex items-center gap-2 text-xs text-ink-faint">
                    {c.author.fullName} · {formatDateTime(c.createdAt)}
                    {c.kind === 'CLARIFICATION' && (
                      <span className="rounded-control bg-info-subtle px-1.5 text-info-ink">Esclarecimento</span>
                    )}
                  </div>
                  {c.body}
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-2">
              <Textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário…"
                className="w-full"
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-56">
                  <UserPicker value={mention} onChange={setMention} placeholder="Mencionar (@)" />
                </div>
                <Button
                  size="sm"
                  disabled={!comment.trim()}
                  loading={run.isPending}
                  onClick={() => {
                    act('comments', '', {
                      body: comment.trim(),
                      ...(mention ? { mentionIds: [Number(mention)] } : {}),
                    });
                    setComment('');
                    setMention('');
                  }}
                >
                  Comentar
                </Button>
                <Button intent="ghost" size="sm" onClick={() => setSub('clarify')}>
                  Pedir esclarecimento
                </Button>
              </div>
            </div>
          </div>

          {/* Acções */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {canAct && ['PENDING', 'ESCALATED'].includes(t.status) && (
              <Button intent="secondary" size="sm" onClick={() => act('start', 'Tarefa iniciada')}>
                Iniciar
              </Button>
            )}
            {canAct && active && (
              <Button intent="ghost" size="sm" onClick={() => setSub('block')}>
                Bloquear
              </Button>
            )}
            {canAct && t.status === 'BLOCKED' && (
              <Button intent="secondary" size="sm" onClick={() => act('unblock', 'Tarefa desbloqueada')}>
                Desbloquear
              </Button>
            )}
            {canAct && ['PENDING', 'IN_PROGRESS', 'BLOCKED'].includes(t.status) && (
              <Button intent="ghost" size="sm" onClick={() => setSub('escalate')}>
                Escalar
              </Button>
            )}
            {(canManage || t.assignee) && !['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(t.status) && canAct && (
              <Button intent="ghost" size="sm" onClick={() => setSub('reassign')}>
                Reatribuir
              </Button>
            )}
            {canReview && !['WAITING', 'CANCELLED', 'SKIPPED'].includes(t.status) && (
              <Button intent="ghost" size="sm" onClick={() => setSub('return')}>
                Devolver para correcção
              </Button>
            )}
            {canManage && ['COMPLETED', 'REJECTED', 'SKIPPED'].includes(t.status) && (
              <Button intent="ghost" size="sm" onClick={() => setSub('reopen')}>
                Reabrir
              </Button>
            )}
            {canManage && t.assignee && ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'ESCALATED'].includes(t.status) && (
              <Button intent="ghost" size="sm" onClick={() => act('remind', 'Lembrete enviado')}>
                Enviar lembrete
              </Button>
            )}
            <Button intent="ghost" size="sm" className="ml-auto" onClick={onClose}>
              Fechar
            </Button>
          </div>

          {/* Eventos */}
          {t.events.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-body text-xs text-ink-faint">
                Eventos da tarefa ({t.events.length})
              </summary>
              <ul className="mt-2 space-y-1 font-body text-xs text-ink-muted">
                {t.events.map((e) => (
                  <li key={e.id}>
                    {formatDateTime(e.createdAt)} — {e.user.fullName}: {e.action}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </ModalContent>
      </Modal>

      {sub && sub !== 'reassign' && (
        <ReasonDialog
          title={reasonDialogs[sub].title}
          label={reasonDialogs[sub].label}
          required={reasonDialogs[sub].required}
          confirmLabel={reasonDialogs[sub].confirm}
          loading={run.isPending}
          onClose={() => setSub(null)}
          onConfirm={reasonDialogs[sub].run}
        />
      )}
      {sub === 'reassign' && (
        <Modal open onOpenChange={(o) => !o && setSub(null)}>
          <ModalContent title="Reatribuir tarefa" className="max-w-md">
            <div className="mt-4">
              <FormField label="Novo responsável *" htmlFor="tp-reassign">
                <UserPicker value={reassignTo} onChange={setReassignTo} />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button intent="ghost" onClick={() => setSub(null)}>
                Cancelar
              </Button>
              <Button
                disabled={!reassignTo}
                loading={run.isPending}
                onClick={() =>
                  act('reassign', 'Tarefa reatribuída', { assigneeId: Number(reassignTo) }, 'patch')
                }
              >
                Reatribuir
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
