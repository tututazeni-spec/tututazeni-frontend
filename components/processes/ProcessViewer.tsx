// components/processes/ProcessViewer.tsx
// Separador de detalhe de um processo (fluxo/detalhes/versões) + acções de
// ciclo de vida (submeter para revisão, aprovar/rejeitar, iniciar
// instância, nova versão). Dados próprios (useApiQuery/useApiMutation) +
// apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx. Extraído de app/(platform)/processes/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  fmtDuration,
  PROCESS_STATUS_MAP,
  RISK_LEVEL_MAP,
  STEP_TYPE_MAP,
} from './constants';
import { Skeleton } from './Skeleton';
import type { Process, ProcessInstance } from './types';

export interface ProcessViewerProps {
  processId: number;
  onBack: () => void;
  onStartInstance: (instanceId: number) => void;
}

export function ProcessViewer({
  processId,
  onBack,
  onStartInstance,
}: ProcessViewerProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'info' | 'history'>(
    'flow',
  );

  const {
    data: process,
    isLoading: loading,
    error,
  } = useApiQuery<Process>(
    queryKeys.processes.detail(processId),
    `/processes/${processId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // As 4 acções abaixo partilhavam dois booleans (`submitting`/`actionLoading`)
  // e cada uma fazia setLoading/try/catch/finally + refetch manual. Migradas
  // para useApiMutation, que já invalida a query certa (`invalidateKeys`) em
  // vez de um refetch() explícito.
  const submitReview = useApiMutation(
    () => apiClient.patch(`/processes/${processId}/submit-review`, {}),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => alert(e.message),
    },
  );
  const submitting = submitReview.isPending;
  const handleSubmitReview = () => submitReview.mutate(undefined);

  const approval = useApiMutation(
    (vars: { action: 'approve' | 'reject'; comment?: string }) =>
      apiClient.patch(`/processes/${processId}/approval`, vars),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => alert(e.message),
    },
  );
  const handleApproval = (action: 'approve' | 'reject') => {
    const comment =
      action === 'reject' ? prompt('Motivo da rejeição:') : undefined;
    if (action === 'reject' && !comment) return;
    approval.mutate({ action, comment: comment ?? undefined });
  };

  const startInstance = useApiMutation(
    (targetUserId: number) =>
      apiClient.post<ProcessInstance>(`/processes/${processId}/start`, {
        targetUserId,
      }),
    {
      onSuccess: (inst) => onStartInstance(inst.id),
      onError: (e) => alert(e.message),
    },
  );
  const handleStartInstance = () => {
    const targetUserIdStr = prompt('ID do colaborador alvo:');
    if (!targetUserIdStr) return;
    startInstance.mutate(parseInt(targetUserIdStr));
  };

  const confirm = useConfirm();
  const newVersion = useApiMutation(
    () => apiClient.post(`/processes/${processId}/new-version`, {}),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => alert(e.message),
    },
  );
  const handleNewVersion = async () => {
    if (
      !(await confirm({
        title: 'Criar nova versão?',
        message: 'O processo voltará a DRAFT.',
        confirmLabel: 'Criar versão',
      }))
    )
      return;
    newVersion.mutate(undefined);
  };

  const actionLoading =
    approval.isPending || startInstance.isPending || newVersion.isPending;

  if (loading)
    return (
      <div className="p-4">
        <Skeleton rows={6} />
      </div>
    );
  if (error || !process)
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-500 mb-4">
          {error?.message ?? 'Processo não encontrado'}
        </p>
        <button onClick={onBack} className="text-sm text-blue-600 underline">
          ← Voltar
        </button>
      </div>
    );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar à biblioteca
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-mono text-sm text-gray-400">
                {process.code}
              </span>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                v{process.version}
              </span>
              <StatusBadge
                value={process.status}
                map={PROCESS_STATUS_MAP}
                variant="dot"
              />
              <StatusBadge value={process.riskLevel} map={RISK_LEVEL_MAP} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {process.title}
            </h2>
            {process.description && (
              <p className="text-sm text-gray-500 mt-1">
                {process.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
              <span>
                Responsável:{' '}
                <strong className="text-gray-700">
                  {process.owner.fullName}
                </strong>
              </span>
              {process.department && (
                <span>
                  Depto:{' '}
                  <strong className="text-gray-700">
                    {process.department.name}
                  </strong>
                </span>
              )}
              {process.estimatedMinutes && (
                <span>
                  Duração est.:{' '}
                  <strong className="text-gray-700">
                    {fmtDuration(process.estimatedMinutes)}
                  </strong>
                </span>
              )}
              {process.defaultSlaHours && (
                <span>
                  SLA:{' '}
                  <strong className="text-gray-700">
                    {process.defaultSlaHours}h
                  </strong>
                </span>
              )}
              <span>
                Instâncias:{' '}
                <strong className="text-gray-700">
                  {process._count.instances}
                </strong>
              </span>
            </div>
            {process.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {process.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            {process.status === 'ACTIVE' && (
              <button
                onClick={handleStartInstance}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                ▶ Iniciar instância
              </button>
            )}
            {process.status === 'DRAFT' && (
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? 'A submeter…' : '→ Submeter para revisão'}
              </button>
            )}
            {process.status === 'IN_REVIEW' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval('approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  ✓ Aprovar
                </button>
                <button
                  onClick={() => handleApproval('reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  ✗ Rejeitar
                </button>
              </div>
            )}
            {process.status === 'ACTIVE' && (
              <button
                onClick={handleNewVersion}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                + Nova versão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['flow', 'info', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ flow: 'Fluxo', info: 'Detalhes', history: 'Versões' }[tab]}
          </button>
        ))}
      </div>

      {/* Flow tab */}
      {activeTab === 'flow' && (
        <div className="space-y-2">
          {process.steps.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem etapas definidas. Edite o processo para adicionar etapas.
            </div>
          )}
          {process.steps.map((step, idx) => (
            <div key={step.id} className="flex gap-3 items-start">
              {/* Connector */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                    step.type === 'START'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : step.type === 'END'
                        ? 'bg-gray-100 border-gray-400 text-gray-600'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < process.steps.length - 1 && (
                  <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                )}
              </div>

              {/* Step card */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge value={step.type} map={STEP_TYPE_MAP} />
                      <span className="text-sm font-medium text-gray-900">
                        {step.title}
                      </span>
                    </div>
                    {step.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {step.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {step.responsible && (
                        <span>
                          Responsável:{' '}
                          <strong className="text-gray-700">
                            {step.responsible.fullName}
                          </strong>
                        </span>
                      )}
                      {step.responsibleRole && (
                        <span>
                          Role:{' '}
                          <strong className="text-gray-700">
                            {step.responsibleRole}
                          </strong>
                        </span>
                      )}
                      {step.slaHours && (
                        <span>
                          SLA:{' '}
                          <strong className="text-gray-700">
                            {step.slaHours}h
                          </strong>
                        </span>
                      )}
                      {step.estimatedMinutes && (
                        <span>
                          Tempo est.:{' '}
                          <strong className="text-gray-700">
                            {fmtDuration(step.estimatedMinutes)}
                          </strong>
                        </span>
                      )}
                    </div>
                    {step.checklist.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {step.checklist.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-gray-500"
                          >
                            <div className="w-3.5 h-3.5 border border-gray-300 rounded flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {step.requiresUpload && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded flex-shrink-0">
                      📎 Upload obrigatório
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Objetivo e âmbito
            </div>
            {process.objective && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Objetivo</div>
                <p className="text-sm text-gray-700">{process.objective}</p>
              </div>
            )}
            {process.scope && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Âmbito</div>
                <p className="text-sm text-gray-700">{process.scope}</p>
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Datas e SLA
            </div>
            {[
              ['Criado em', fmtDate(process.createdAt)],
              ['Actualizado', fmtDate(process.updatedAt)],
              ['Publicado', fmtDate(process.publishedAt)],
              ['Próxima revisão', fmtDate(process.nextReviewDate)],
              [
                'SLA padrão',
                process.defaultSlaHours ? `${process.defaultSlaHours}h` : '—',
              ],
              ['Duração estimada', fmtDuration(process.estimatedMinutes)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-medium text-gray-900">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Histórico de versões
          </div>
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Versão actual: <strong>v{process.version}</strong>
            <br />
            <span className="text-xs mt-1 block">
              Versões anteriores guardadas no servidor. Use a API para comparar.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
