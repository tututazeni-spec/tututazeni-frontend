// components/automation/ApprovalsTab.tsx
// Aprovações e Tarefas (docs/modulo_automation.md §8): etapas que dependem de
// validação humana. Uma automação pede; só uma pessoa decide. ADMIN/RH vêem
// todas, os restantes só as suas (o backend aplica o filtro).

'use client';

import { useDeferredValue, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Filter,
  Flag,
  MapPin,
  MessageSquare,
  UserRoundCog,
  XCircle,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { UserPicker } from '@/components/processes/UserPicker';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/cn';
import { downloadCsv } from './downloadCsv';
import type {
  AutomationTask,
  AutomationTaskDetail,
  CsvExport,
  Paginated,
  TaskHistoryEntry,
  TaskKind,
  TaskPriority,
  TaskStatus,
  TaskSummary,
} from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatDateTimeNumeric } from '@/lib/format';

const ALL = '__all__';

const STATUS_META: Record<
  TaskStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  PENDING: { label: 'Pendente', intent: 'warning' },
  APPROVED: { label: 'Aprovada', intent: 'success' },
  REJECTED: { label: 'Recusada', intent: 'danger' },
  COMPLETED: { label: 'Concluída', intent: 'success' },
  CANCELLED: { label: 'Cancelada', intent: 'neutral' },
  EXPIRED: { label: 'Expirada', intent: 'danger' },
};
const PRIORITY_META: Record<
  TaskPriority,
  { label: string; intent: BadgeProps['intent'] }
> = {
  LOW: { label: 'Baixa', intent: 'neutral' },
  MEDIUM: { label: 'Média', intent: 'info' },
  HIGH: { label: 'Alta', intent: 'warning' },
  URGENT: { label: 'Urgente', intent: 'danger' },
};
const KIND_LABEL: Record<TaskKind, string> = {
  APPROVAL: 'Aprovação',
  TASK: 'Tarefa',
};
const HISTORY_LABEL: Record<string, string> = {
  APPROVED: 'Aprovou',
  REJECTED: 'Recusou',
  COMPLETED: 'Concluiu',
  CANCELLED: 'Cancelou',
  EXPIRED: 'Expirou sem decisão',
  ESCALATED: 'Escalada automaticamente',
  REASSIGNED: 'Reatribuiu',
  COMMENTED: 'Comentou',
  CREATED: 'Criada',
};

const fmt = (iso?: string | null) =>
  iso ? formatDateTimeNumeric(iso) : '–';

export function ApprovalsTab() {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState('PENDING');
  const [kind, setKind] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const params = {
    search: deferredSearch.trim() || undefined,
    status: status === ALL ? undefined : status,
    kind: kind === ALL ? undefined : kind,
    priority: priority === ALL ? undefined : priority,
    mine: onlyMine || undefined,
    overdue: onlyOverdue || undefined,
    limit: 50,
  };
  const { data, isLoading } = useApiQuery<Paginated<AutomationTask>>(
    queryKeys.automation.tasks(params),
    '/automation/tasks',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: summary } = useApiQuery<TaskSummary>(
    queryKeys.automation.taskSummary(),
    '/automation/tasks/summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const rows = data?.data ?? [];

  const exportCsv = async () => {
    setExporting(true);
    try {
      downloadCsv(
        await apiClient.get<CsvExport>('/automation/tasks/export', { params }),
      );
    } catch (e) {
      reportError(e, { source: 'ApprovalsTab.exportCsv' });
      notify({
        title: 'Não foi possível exportar as aprovações',
        intent: 'danger',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <NavyStatCard
          icon={ClipboardCheck}
          tone="orange"
          iconTone="yellow"
          label="Pendentes"
          value={summary?.pending ?? '…'}
          sub="À espera de decisão"
        />
        <NavyStatCard
          icon={AlertTriangle}
          tone="red"
          label="Em atraso"
          value={summary?.overdue ?? '…'}
          sub="Prazo ultrapassado"
        />
        <NavyStatCard
          icon={CheckCircle2}
          tone="green"
          label="Decididas (30 dias)"
          value={summary?.decidedLast30Days ?? '…'}
          sub="Aprovadas, recusadas, concluídas ou expiradas"
        />
        <NavyStatCard
          icon={Clock}
          tone="green"
          label="Dentro do prazo"
          value={
            summary?.deadline.onTimeRate != null
              ? `${summary.deadline.onTimeRate}%`
              : summary
                ? '–'
                : '…'
          }
          sub={
            summary
              ? `${summary.deadline.onTime} a tempo · ${summary.deadline.late} fora do prazo`
              : undefined
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          variant="underline"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título, descrição ou registo"
          aria-label="Pesquisar aprovações"
          className="max-w-[300px]"
        />
        <Select
          variant="underline"
          icon={MapPin}
          items={[
            { value: ALL, label: 'Todos os estados' },
            ...Object.entries(STATUS_META).map(([value, m]) => ({
              value,
              label: m.label,
            })),
          ]}
          value={status}
          onValueChange={setStatus}
          className="min-w-[170px]"
        />
        <Select
          variant="underline"
          icon={Filter}
          items={[
            { value: ALL, label: 'Todos os tipos' },
            { value: 'APPROVAL', label: 'Aprovações' },
            { value: 'TASK', label: 'Tarefas' },
          ]}
          value={kind}
          onValueChange={setKind}
          className="min-w-[160px]"
        />
        <Select
          variant="underline"
          icon={Flag}
          items={[
            { value: ALL, label: 'Todas as prioridades' },
            ...Object.entries(PRIORITY_META).map(([value, m]) => ({
              value,
              label: m.label,
            })),
          ]}
          value={priority}
          onValueChange={setPriority}
          className="min-w-[190px]"
        />
        <label className="flex items-center gap-1.5 font-body text-sm text-ink">
          <Checkbox
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
          />
          Só as minhas
        </label>
        <label className="flex items-center gap-1.5 font-body text-sm text-ink">
          <Checkbox
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
          />
          Só em atraso
        </label>
        <Button
          className="ml-auto"
          size="sm"
          intent="secondary"
          onClick={exportCsv}
          disabled={exporting}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar
        </Button>
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Sem aprovações ou tarefas"
          description="Quando uma automação precisar de validação humana, o pedido aparece aqui até ser decidido."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((t) => {
            const st = STATUS_META[t.status];
            const pr = PRIORITY_META[t.priority];
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border bg-surface px-4 py-3 text-left shadow-resting transition-shadow hover:shadow-hover"
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="truncate font-display text-sm font-bold text-brand">
                      {t.title}
                    </p>
                    <p className="truncate font-body text-xs text-ink-muted">
                      {KIND_LABEL[t.kind]}
                      {t.automation?.name ? ` · ${t.automation.name}` : ''}
                      {t.module ? ` · ${t.module}` : ''}
                    </p>
                  </div>
                  <div className="w-40 font-body text-xs text-ink-muted">
                    <span className="block text-micro">Aprovador</span>
                    <span className="text-brand">
                      {t.approver.name ?? `#${t.approver.id}`}
                    </span>
                  </div>
                  <div className="w-36 font-body text-xs text-ink-muted">
                    <span className="block text-micro">Prazo</span>
                    <span
                      className={cn(
                        'text-brand',
                        t.overdue && 'font-semibold text-danger-ink',
                      )}
                    >
                      {fmt(t.dueAt)}
                      {t.overdue ? ' · em atraso' : ''}
                    </span>
                  </div>
                  <Badge intent={pr.intent}>{pr.label}</Badge>
                  <Badge intent={st.intent}>{st.label}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {openId && <TaskModal taskId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function describeEntry(h: TaskHistoryEntry) {
  const base = HISTORY_LABEL[h.action] ?? h.action;
  if (h.action === 'REASSIGNED' && h.from && h.to) {
    return `${base} de #${h.from} para #${h.to}`;
  }
  return base;
}

function TaskModal({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const notify = useToast();
  const [comment, setComment] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [error, setError] = useState('');

  const { data: task, isLoading } = useApiQuery<AutomationTaskDetail>(
    queryKeys.automation.taskDetail(taskId),
    `/automation/tasks/${taskId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.automation.tasks(),
    queryKeys.automation.taskSummary(),
    queryKeys.automation.taskDetail(taskId),
  ];
  const mutate = (
    fn: () => Promise<unknown>,
    successTitle: string,
    afterSuccess?: () => void,
  ) => ({
    fn,
    successTitle,
    afterSuccess,
  });

  const run = useApiMutation((op: ReturnType<typeof mutate>) => op.fn(), {
    invalidateKeys,
    onSuccess: (_d, op) => {
      setError('');
      notify({ title: op.successTitle, intent: 'success' });
      op.afterSuccess?.();
    },
    onError: (e: Error) => setError(e.message || 'Erro ao executar a acção.'),
  });

  const decide = (decision: 'APPROVE' | 'REJECT' | 'COMPLETE') => {
    if (decision === 'REJECT' && !comment.trim()) {
      setError('Indique a justificação ao recusar.');
      return;
    }
    run.mutate(
      mutate(
        () =>
          apiClient.post(`/automation/tasks/${taskId}/decide`, {
            decision,
            ...(comment.trim() ? { comment: comment.trim() } : {}),
          }),
        decision === 'APPROVE'
          ? 'Pedido aprovado'
          : decision === 'REJECT'
            ? 'Pedido recusado'
            : 'Tarefa concluída',
        onClose,
      ),
    );
  };

  const st = task ? STATUS_META[task.status] : null;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={task?.title ?? 'Aprovação'}
        description={
          task
            ? `${KIND_LABEL[task.kind]}${task.automation?.name ? ` · ${task.automation.name}` : ''}`
            : undefined
        }
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {isLoading || !task ? (
          <Skeleton rows={4} />
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink"
              >
                <AlertCircle size={16} strokeWidth={1.75} />
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {st && <Badge intent={st.intent}>{st.label}</Badge>}
              <Badge intent={PRIORITY_META[task.priority].intent}>
                Prioridade {PRIORITY_META[task.priority].label.toLowerCase()}
              </Badge>
              {task.overdue && <Badge intent="danger">Em atraso</Badge>}
            </div>

            {task.description && (
              <p className="whitespace-pre-line font-body text-sm text-ink">
                {task.description}
              </p>
            )}

            <dl className="grid grid-cols-1 gap-3 rounded-card border border-border p-3 font-body text-xs sm:grid-cols-2">
              <Info label="Aprovador">
                {task.approver.name ?? `#${task.approver.id}`}
              </Info>
              <Info label="Substituto">
                {task.substitute
                  ? (task.substitute.name ?? `#${task.substitute.id}`)
                  : '–'}
              </Info>
              <Info label="Criada em">{fmt(task.createdAt)}</Info>
              <Info label="Prazo">{fmt(task.dueAt)}</Info>
              <Info label="Módulo">{task.module ?? '–'}</Info>
              <Info label="Registo relacionado">
                {task.record ? `${task.record.type} · ${task.record.id}` : '–'}
              </Info>
              <Info label="Escalonamento">
                {task.escalation
                  ? `Para ${task.escalation.toName ?? `#${task.escalation.toId}`} após ${task.escalation.afterHours ?? '?'} h${task.escalation.escalatedAt ? ` (escalada em ${fmt(task.escalation.escalatedAt)})` : ''}`
                  : 'Sem regra de escalonamento'}
              </Info>
              <Info label="Execução">
                {task.execution
                  ? `${task.execution.status} · ${fmt(task.execution.startedAt)}`
                  : '–'}
              </Info>
              {task.decidedAt && (
                <Info label="Decisão">
                  {fmt(task.decidedAt)}
                  {task.decidedBy
                    ? ` por ${task.decidedBy.name ?? `#${task.decidedBy.id}`}`
                    : ''}
                </Info>
              )}
              {task.decisionComment && (
                <Info label="Justificação">{task.decisionComment}</Info>
              )}
            </dl>

            {task.status === 'PENDING' && (
              <div className="flex flex-col gap-3 rounded-card border border-border p-3">
                {task.canDecide && (
                  <>
                    <FormField
                      label="Justificação"
                      htmlFor="tk-comment"
                      hint="Obrigatória ao recusar."
                    >
                      <Textarea
                        id="tk-comment"
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </FormField>
                    <div className="flex flex-wrap gap-2">
                      {task.kind === 'APPROVAL' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => decide('APPROVE')}
                            loading={run.isPending}
                          >
                            <CheckCircle2 size={14} strokeWidth={1.75} />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            intent="danger"
                            onClick={() => decide('REJECT')}
                            loading={run.isPending}
                          >
                            <XCircle size={14} strokeWidth={1.75} />
                            Recusar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => decide('COMPLETE')}
                          loading={run.isPending}
                        >
                          <CheckCircle2 size={14} strokeWidth={1.75} />
                          Marcar como concluída
                        </Button>
                      )}
                      <Button
                        size="sm"
                        intent="secondary"
                        onClick={() =>
                          run.mutate(
                            mutate(
                              () =>
                                apiClient.post(
                                  `/automation/tasks/${taskId}/cancel`,
                                  comment.trim()
                                    ? { reason: comment.trim() }
                                    : {},
                                ),
                              'Tarefa cancelada',
                              onClose,
                            ),
                          )
                        }
                        loading={run.isPending}
                      >
                        Cancelar pedido
                      </Button>
                    </div>
                  </>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <FormField label="Reatribuir a" htmlFor="tk-reassign">
                    <UserPicker
                      value={reassignTo}
                      onChange={setReassignTo}
                      className="min-w-[220px]"
                    />
                  </FormField>
                  <Button
                    size="sm"
                    intent="secondary"
                    disabled={!reassignTo}
                    loading={run.isPending}
                    onClick={() =>
                      run.mutate(
                        mutate(
                          () =>
                            apiClient.patch(
                              `/automation/tasks/${taskId}/reassign`,
                              { approverId: Number(reassignTo) },
                            ),
                          'Aprovador substituído',
                          () => setReassignTo(''),
                        ),
                      )
                    }
                  >
                    <UserRoundCog size={14} strokeWidth={1.75} />
                    Reatribuir
                  </Button>
                </div>
              </div>
            )}

            <section>
              <h4 className="mb-2 font-display text-sm font-bold text-brand">
                Histórico de alterações
              </h4>
              {task.history.length === 0 ? (
                <EmptyState variant="inline" title="Sem registos" />
              ) : (
                <ol className="flex flex-col gap-2">
                  {task.history.map((h, i) => (
                    <li
                      key={`${h.at}-${i}`}
                      className="rounded-card bg-surface-sunken px-3 py-2 font-body text-xs"
                    >
                      <p className="text-brand">
                        <span className="font-semibold">
                          {describeEntry(h)}
                        </span>
                        {h.by !== null && h.by !== undefined
                          ? ` · utilizador #${h.by}`
                          : ' · sistema'}
                        <span className="text-ink-muted"> · {fmt(h.at)}</span>
                      </p>
                      {h.comment && (
                        <p className="mt-0.5 whitespace-pre-line text-ink-muted">
                          {h.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-3 flex items-end gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Acrescentar um comentário"
                  aria-label="Comentário"
                />
                <Button
                  size="sm"
                  intent="secondary"
                  disabled={!newComment.trim()}
                  loading={run.isPending}
                  onClick={() =>
                    run.mutate(
                      mutate(
                        () =>
                          apiClient.post(
                            `/automation/tasks/${taskId}/comments`,
                            { comment: newComment.trim() },
                          ),
                        'Comentário adicionado',
                        () => setNewComment(''),
                      ),
                    )
                  }
                >
                  <MessageSquare size={14} strokeWidth={1.75} />
                  Comentar
                </Button>
              </div>
            </section>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-brand">{children}</dd>
    </div>
  );
}
