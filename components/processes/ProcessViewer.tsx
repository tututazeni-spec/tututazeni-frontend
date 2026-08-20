// components/processes/ProcessViewer.tsx
// Separador de detalhe de um processo (fluxo/detalhes/versões) + acções de
// ciclo de vida (submeter para revisão, aprovar/rejeitar, iniciar
// instância, nova versão). Dados próprios (useApiQuery/useApiMutation) +
// apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx. Extraído de app/(platform)/processes/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Paperclip, Play, Plus, Send, X } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
  const notify = useToast();
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submitting = submitReview.isPending;
  const handleSubmitReview = () => submitReview.mutate(undefined);

  const approval = useApiMutation(
    (vars: { action: 'approve' | 'reject'; comment?: string }) =>
      apiClient.patch(`/processes/${processId}/approval`, vars),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
        <p className="mb-4 font-body text-sm text-danger">
          {error?.message ?? 'Processo não encontrado'}
        </p>
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
      </div>
    );

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à biblioteca
      </Button>

      {/* Header */}
      <Card className="mb-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-ink-faint">
                {process.code}
              </span>
              <span className="rounded-control bg-surface-sunken px-2 py-0.5 font-mono text-xs text-ink-muted">
                v{process.version}
              </span>
              <StatusBadge
                value={process.status}
                map={PROCESS_STATUS_MAP}
                variant="dot"
              />
              <StatusBadge value={process.riskLevel} map={RISK_LEVEL_MAP} />
            </div>
            <h2 className="font-display text-lg font-semibold text-ink">
              {process.title}
            </h2>
            {process.description && (
              <p className="mt-1 font-body text-sm text-ink-muted">
                {process.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 font-body text-xs text-ink-faint">
              <span>
                Responsável:{' '}
                <strong className="text-ink">{process.owner.fullName}</strong>
              </span>
              {process.department && (
                <span>
                  Depto:{' '}
                  <strong className="text-ink">
                    {process.department.name}
                  </strong>
                </span>
              )}
              {process.estimatedMinutes && (
                <span>
                  Duração est.:{' '}
                  <strong className="text-ink">
                    {fmtDuration(process.estimatedMinutes)}
                  </strong>
                </span>
              )}
              {process.defaultSlaHours && (
                <span>
                  SLA:{' '}
                  <strong className="text-ink">
                    {process.defaultSlaHours}h
                  </strong>
                </span>
              )}
              <span>
                Instâncias:{' '}
                <strong className="text-ink">{process._count.instances}</strong>
              </span>
            </div>
            {process.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {process.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-control bg-info-subtle px-2 py-0.5 font-body text-xs text-info-ink"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            {process.status === 'ACTIVE' && (
              <Button
                onClick={handleStartInstance}
                disabled={actionLoading}
                size="sm"
              >
                <Play size={14} strokeWidth={1.75} />
                Iniciar instância
              </Button>
            )}
            {process.status === 'DRAFT' && (
              <Button
                intent="warning"
                onClick={handleSubmitReview}
                disabled={submitting}
                size="sm"
              >
                <Send size={14} strokeWidth={1.75} />
                {submitting ? 'A submeter…' : 'Submeter para revisão'}
              </Button>
            )}
            {process.status === 'IN_REVIEW' && (
              <div className="flex gap-2">
                <Button
                  intent="success"
                  size="sm"
                  onClick={() => handleApproval('approve')}
                  disabled={actionLoading}
                >
                  <Check size={14} strokeWidth={1.75} />
                  Aprovar
                </Button>
                <Button
                  intent="danger"
                  size="sm"
                  onClick={() => handleApproval('reject')}
                  disabled={actionLoading}
                >
                  <X size={14} strokeWidth={1.75} />
                  Rejeitar
                </Button>
              </div>
            )}
            {process.status === 'ACTIVE' && (
              <Button
                intent="secondary"
                size="sm"
                onClick={handleNewVersion}
                disabled={actionLoading}
              >
                <Plus size={14} strokeWidth={1.75} />
                Nova versão
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="mb-5 w-fit">
          <TabsTrigger value="flow">Fluxo</TabsTrigger>
          <TabsTrigger value="info">Detalhes</TabsTrigger>
          <TabsTrigger value="history">Versões</TabsTrigger>
        </TabsList>

        {/* Flow tab */}
        <TabsContent value="flow">
          <div className="space-y-2">
            {process.steps.length === 0 && (
              <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
                Sem etapas definidas. Edite o processo para adicionar etapas.
              </div>
            )}
            {process.steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Connector */}
                <div className="flex flex-shrink-0 flex-col items-center pt-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 font-body text-xs font-semibold ${
                      step.type === 'START'
                        ? 'border-success bg-success-subtle text-success-ink'
                        : step.type === 'END'
                          ? 'border-border-strong bg-surface-sunken text-ink-muted'
                          : 'border-info bg-info-subtle text-info-ink'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < process.steps.length - 1 && (
                    <div className="mt-1 h-4 w-0.5 bg-border" />
                  )}
                </div>

                {/* Step card */}
                <div className="mb-2 flex-1 rounded-card border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <StatusBadge value={step.type} map={STEP_TYPE_MAP} />
                        <span className="font-body text-sm font-medium text-ink">
                          {step.title}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mb-2 font-body text-xs text-ink-muted">
                          {step.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 font-body text-xs text-ink-faint">
                        {step.responsible && (
                          <span>
                            Responsável:{' '}
                            <strong className="text-ink">
                              {step.responsible.fullName}
                            </strong>
                          </span>
                        )}
                        {step.responsibleRole && (
                          <span>
                            Role:{' '}
                            <strong className="text-ink">
                              {step.responsibleRole}
                            </strong>
                          </span>
                        )}
                        {step.slaHours && (
                          <span>
                            SLA:{' '}
                            <strong className="text-ink">
                              {step.slaHours}h
                            </strong>
                          </span>
                        )}
                        {step.estimatedMinutes && (
                          <span>
                            Tempo est.:{' '}
                            <strong className="text-ink">
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
                              className="flex items-center gap-2 font-body text-xs text-ink-muted"
                            >
                              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-control border border-border-strong" />
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {step.requiresUpload && (
                      <span className="flex flex-shrink-0 items-center gap-1 rounded-control bg-warning-subtle px-2 py-0.5 font-body text-xs text-warning-ink">
                        <Paperclip size={12} strokeWidth={1.75} />
                        Upload obrigatório
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info">
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Objetivo e âmbito
              </div>
              {process.objective && (
                <div className="mb-3">
                  <div className="mb-1 font-body text-xs text-ink-faint">
                    Objetivo
                  </div>
                  <p className="font-body text-sm text-ink">
                    {process.objective}
                  </p>
                </div>
              )}
              {process.scope && (
                <div>
                  <div className="mb-1 font-body text-xs text-ink-faint">
                    Âmbito
                  </div>
                  <p className="font-body text-sm text-ink">{process.scope}</p>
                </div>
              )}
            </Card>
            <Card className="p-5">
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                  className="flex justify-between border-b border-border py-1.5 last:border-0"
                >
                  <span className="font-body text-xs text-ink-muted">
                    {label}
                  </span>
                  <span className="font-body text-xs font-medium text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Histórico de versões
            </div>
            <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
              Versão actual:{' '}
              <strong className="text-ink">v{process.version}</strong>
              <br />
              <span className="mt-1 block text-xs">
                Versões anteriores guardadas no servidor. Use a API para
                comparar.
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
