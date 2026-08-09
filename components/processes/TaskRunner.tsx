// components/processes/TaskRunner.tsx
// Separador de execução de uma instância de processo (timeline de etapas +
// etapa activa: checklist, upload, notas, concluir/rejeitar). Dados
// próprios (useApiQuery/useApiMutation) + apresentação, mesmo padrão
// auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
      onError: (e) => alert(e.message),
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
      onError: (e) => alert(e.message),
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
        <p className="text-sm text-red-500 mb-4">
          {error?.message ?? 'Instância não encontrada'}
        </p>
        <button onClick={onBack} className="text-sm text-blue-600 underline">
          ← Voltar
        </button>
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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar
      </button>

      {/* Instance header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-400">
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
            <div className="text-base font-semibold text-gray-900">
              {instance.process.title}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Colaborador: <strong>{instance.targetUser.fullName}</strong>
              &nbsp;·&nbsp; Iniciado por:{' '}
              <strong>{instance.initiatedBy.fullName}</strong>
              &nbsp;·&nbsp; {fmtDate(instance.startedAt)}
            </div>
          </div>
          {instance.slaDeadline && (
            <div
              className={`text-xs px-3 py-1 rounded-lg font-medium ${isOverdue(instance.slaDeadline) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
            >
              {isOverdue(instance.slaDeadline)
                ? '⚠ SLA expirado'
                : `SLA: ${fmtDate(instance.slaDeadline)}`}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500">
            {completedCount}/{totalCount} etapas
          </span>
          <span className="text-xs font-medium text-gray-700">
            {progressPct}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Etapas
          </div>
          {instance.stepProgress.map((sp, idx) => {
            const isActive = activeStep?.id === sp.id;
            const isDone = sp.status === 'COMPLETED';
            const isRejected = sp.status === 'REJECTED';

            return (
              <div
                key={sp.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (!isDone) setActiveStep(sp);
                }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                        ? 'bg-red-100 text-red-700'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : isRejected ? '✗' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-medium truncate ${isActive ? 'text-blue-800' : 'text-gray-700'}`}
                  >
                    {sp.step.title}
                  </div>
                  {sp.completedAt && (
                    <div className="text-xs text-gray-400">
                      {fmtDate(sp.completedAt)}
                    </div>
                  )}
                  {sp.slaDeadline &&
                    sp.status === 'PENDING' &&
                    isOverdue(sp.slaDeadline) && (
                      <div className="text-xs text-red-500">⚠ SLA expirado</div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Executar etapa activa */}
        <div>
          {activeStep && activeStep.status === 'PENDING' ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge value={activeStep.step.type} map={STEP_TYPE_MAP} />
                <span className="text-base font-semibold text-gray-900">
                  {activeStep.step.title}
                </span>
              </div>
              {activeStep.step.description && (
                <p className="text-sm text-gray-500 mb-4">
                  {activeStep.step.description}
                </p>
              )}

              {/* SLA */}
              {activeStep.slaDeadline && (
                <div
                  className={`mb-4 px-3 py-2 rounded-lg text-xs ${isOverdue(activeStep.slaDeadline) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                >
                  SLA: {fmtDate(activeStep.slaDeadline)}
                  {isOverdue(activeStep.slaDeadline) && ' — EXPIRADO'}
                </div>
              )}

              {/* Checklist */}
              {activeStep.step.checklist.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Checklist
                  </div>
                  <div className="space-y-2">
                    {activeStep.step.checklist.map((item, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 group-has-[:checked]:line-through group-has-[:checked]:text-gray-400">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload obrigatório */}
              {activeStep.step.requiresUpload && (
                <div className="mb-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <div className="text-2xl mb-2">📎</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Upload de evidência obrigatório
                  </div>
                  <button className="text-xs text-blue-600 underline">
                    Seleccionar ficheiro
                  </button>
                </div>
              )}

              {/* Notas */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Notas / Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Adicione observações sobre a execução desta etapa…"
                />
              </div>

              {/* Acções */}
              <div className="flex gap-3">
                <button
                  onClick={completeStep}
                  disabled={completing}
                  className="flex-1 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {completing ? 'A concluir…' : '✓ Marcar como concluída'}
                </button>
                <button
                  onClick={rejectStep}
                  className="px-4 py-2.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50"
                >
                  ✗ Rejeitar
                </button>
              </div>
            </div>
          ) : instance.status === 'COMPLETED' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">✅</div>
              <div className="text-base font-semibold text-emerald-800">
                Processo concluído!
              </div>
              <div className="text-sm text-emerald-600 mt-1">
                Todas as etapas foram executadas com sucesso.
              </div>
              {instance.completedAt && (
                <div className="text-xs text-emerald-500 mt-2">
                  Concluído em {fmtDate(instance.completedAt)}
                </div>
              )}
            </div>
          ) : activeStep ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
              Seleccione uma etapa pendente para executar
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
