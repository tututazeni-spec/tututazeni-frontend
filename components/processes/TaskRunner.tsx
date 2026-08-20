// components/processes/TaskRunner.tsx
// Separador de execução de uma instância de processo (timeline de etapas +
// etapa activa: checklist, upload, notas, concluir/rejeitar). Dados
// próprios (useApiQuery/useApiMutation) + apresentação, mesmo padrão
// auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Paperclip, X } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  isOverdue,
  INSTANCE_STATUS_MAP,
  RISK_LEVEL_MAP,
  STEP_TYPE_MAP,
} from './constants';
import { Skeleton } from './Skeleton';
import type { ProcessInstance, StepProgress } from './types';

export interface TaskRunnerProps {
  instanceId: number;
  onBack: () => void;
}

export function TaskRunner({ instanceId, onBack }: TaskRunnerProps) {
  const notify = useToast();
  const [activeStep, setActiveStep] = useState<StepProgress | null>(null);
  const [notes, setNotes] = useState('');

  const {
    data: instance,
    isLoading: loading,
    error,
  } = useApiQuery<ProcessInstance>(
    queryKeys.processes.instance(instanceId),
    `/processes/instances/${instanceId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  // Auto-selecciona a próxima etapa pendente sempre que a instância é (re)carregada.
  useEffect(() => {
    if (instance) {
      const nextPending = instance.stepProgress.find(
        (sp) => sp.status === 'PENDING',
      );
      if (nextPending) setActiveStep(nextPending);
    }
  }, [instance]);

  const completeStepMutation = useApiMutation(
    () =>
      apiClient.post(
        `/processes/instances/${instanceId}/steps/${activeStep!.stepId}/complete`,
        { notes },
      ),
    {
      invalidateKeys: [queryKeys.processes.instance(instanceId)],
      onSuccess: () => setNotes(''),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const completing = completeStepMutation.isPending;
  const completeStep = () => {
    if (activeStep) completeStepMutation.mutate(undefined);
  };

  const rejectStepMutation = useApiMutation(
    (reason: string) =>
      apiClient.post(
        `/processes/instances/${instanceId}/steps/${activeStep!.stepId}/reject`,
        { reason },
      ),
    {
      invalidateKeys: [queryKeys.processes.instance(instanceId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const rejectStep = () => {
    if (!activeStep) return;
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    rejectStepMutation.mutate(reason);
  };

  if (loading)
    return (
      <div className="p-4">
        <Skeleton rows={4} />
      </div>
    );
  if (error || !instance)
    return (
      <div className="py-12 text-center">
        <p className="mb-4 font-body text-sm text-danger">
          {error?.message ?? 'Instância não encontrada'}
        </p>
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
      </div>
    );

  const completedCount = instance.stepProgress.filter(
    (s) => s.status === 'COMPLETED',
  ).length;
  const totalCount = instance.stepProgress.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Instance header */}
      <Card className="mb-5 p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-sm text-ink-faint">
                {instance.process.code}
              </span>
              <StatusBadge
                value={instance.status}
                map={INSTANCE_STATUS_MAP}
                variant="pill"
              />
              <StatusBadge
                value={instance.process.riskLevel}
                map={RISK_LEVEL_MAP}
              />
            </div>
            <div className="font-display text-base font-semibold text-ink">
              {instance.process.title}
            </div>
            <div className="mt-1 font-body text-xs text-ink-faint">
              Colaborador:{' '}
              <strong className="text-ink">
                {instance.targetUser.fullName}
              </strong>
              &nbsp;·&nbsp; Iniciado por:{' '}
              <strong className="text-ink">
                {instance.initiatedBy.fullName}
              </strong>
              &nbsp;·&nbsp; {fmtDate(instance.startedAt)}
            </div>
          </div>
          {instance.slaDeadline && (
            <div
              className={`rounded-control px-3 py-1 font-body text-xs font-medium ${isOverdue(instance.slaDeadline) ? 'bg-danger-subtle text-danger-ink' : 'bg-warning-subtle text-warning-ink'}`}
            >
              {isOverdue(instance.slaDeadline)
                ? '⚠ SLA expirado'
                : `SLA: ${fmtDate(instance.slaDeadline)}`}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <ProgressBar value={progressPct} className="flex-1" />
          <span className="font-mono text-xs text-ink-muted">
            {completedCount}/{totalCount} etapas
          </span>
          <span className="font-body text-xs font-medium text-ink">
            {progressPct}%
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Timeline */}
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Etapas
          </div>
          {instance.stepProgress.map((sp, idx) => {
            const isActive = activeStep?.id === sp.id;
            const isDone = sp.status === 'COMPLETED';
            const isRejected = sp.status === 'REJECTED';

            return (
              <div
                key={sp.id}
                className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 ${
                  isActive ? 'bg-primary-subtle' : 'hover:bg-surface-sunken'
                }`}
                onClick={() => {
                  if (!isDone) setActiveStep(sp);
                }}
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-body text-xs font-semibold ${
                    isDone
                      ? 'bg-success-subtle text-success-ink'
                      : isRejected
                        ? 'bg-danger-subtle text-danger-ink'
                        : isActive
                          ? 'bg-primary text-canvas'
                          : 'bg-surface-sunken text-ink-faint'
                  }`}
                >
                  {isDone ? (
                    <Check size={12} strokeWidth={1.75} />
                  ) : isRejected ? (
                    <X size={12} strokeWidth={1.75} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate font-body text-xs font-medium ${isActive ? 'text-primary' : 'text-ink-muted'}`}
                  >
                    {sp.step.title}
                  </div>
                  {sp.completedAt && (
                    <div className="font-body text-xs text-ink-faint">
                      {fmtDate(sp.completedAt)}
                    </div>
                  )}
                  {sp.slaDeadline &&
                    sp.status === 'PENDING' &&
                    isOverdue(sp.slaDeadline) && (
                      <div className="font-body text-xs text-danger">
                        ⚠ SLA expirado
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Executar etapa activa */}
        <div>
          {activeStep && activeStep.status === 'PENDING' ? (
            <Card className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <StatusBadge value={activeStep.step.type} map={STEP_TYPE_MAP} />
                <span className="font-display text-base font-semibold text-ink">
                  {activeStep.step.title}
                </span>
              </div>
              {activeStep.step.description && (
                <p className="mb-4 font-body text-sm text-ink-muted">
                  {activeStep.step.description}
                </p>
              )}

              {/* SLA */}
              {activeStep.slaDeadline && (
                <div
                  className={`mb-4 rounded-control px-3 py-2 font-body text-xs ${isOverdue(activeStep.slaDeadline) ? 'bg-danger-subtle text-danger-ink' : 'bg-warning-subtle text-warning-ink'}`}
                >
                  SLA: {fmtDate(activeStep.slaDeadline)}
                  {isOverdue(activeStep.slaDeadline) && ' — EXPIRADO'}
                </div>
              )}

              {/* Checklist */}
              {activeStep.step.checklist.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Checklist
                  </div>
                  <div className="space-y-2">
                    {activeStep.step.checklist.map((item, i) => (
                      <label
                        key={i}
                        className="group flex cursor-pointer items-start gap-2"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-border-strong accent-primary"
                        />
                        <span className="font-body text-sm text-ink-muted group-has-[:checked]:text-ink-faint group-has-[:checked]:line-through">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload obrigatório */}
              {activeStep.step.requiresUpload && (
                <div className="mb-4 rounded-card border-2 border-dashed border-border-strong p-6 text-center">
                  <Paperclip
                    size={24}
                    strokeWidth={1.75}
                    className="mx-auto mb-2 text-ink-faint"
                  />
                  <div className="mb-1 font-body text-sm font-medium text-ink-muted">
                    Upload de evidência obrigatório
                  </div>
                  <Button intent="ghost" size="sm">
                    Seleccionar ficheiro
                  </Button>
                </div>
              )}

              {/* Notas */}
              <div className="mb-4">
                <label className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Notas / Observações
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                  placeholder="Adicione observações sobre a execução desta etapa…"
                />
              </div>

              {/* Acções */}
              <div className="flex gap-3">
                <Button
                  onClick={completeStep}
                  loading={completing}
                  className="flex-1"
                >
                  <Check size={14} strokeWidth={1.75} />
                  Marcar como concluída
                </Button>
                <Button intent="danger" onClick={rejectStep}>
                  <X size={14} strokeWidth={1.75} />
                  Rejeitar
                </Button>
              </div>
            </Card>
          ) : instance.status === 'COMPLETED' ? (
            <div className="rounded-card border border-success/30 bg-success-subtle p-8 text-center">
              <CheckCircle2
                size={32}
                strokeWidth={1.75}
                className="mx-auto mb-3 text-success"
              />
              <div className="font-display text-base font-semibold text-success-ink">
                Processo concluído!
              </div>
              <div className="mt-1 font-body text-sm text-success-ink">
                Todas as etapas foram executadas com sucesso.
              </div>
              {instance.completedAt && (
                <div className="mt-2 font-body text-xs text-success-ink">
                  Concluído em {fmtDate(instance.completedAt)}
                </div>
              )}
            </div>
          ) : activeStep ? (
            <div className="rounded-card border border-border bg-surface-sunken p-8 text-center font-body text-sm text-ink-faint">
              Seleccione uma etapa pendente para executar
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
