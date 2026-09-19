// components/trainings/plans/PlanDetailView.tsx
// Detalhe do Plano de Formação — dados + "acompanhar execução" (planeado vs.
// realizado, docs/trainings-detalhado.md pt.2) + formações associadas.

'use client';

import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatKz } from '@/lib/format';
import { PLAN_PERIOD_LABEL, PLAN_STATUS_CFG, PRIORITY_CFG, STATUS_CFG } from '../constants';
import type { Training, TrainingPlan, TrainingPlanExecution } from '../types';

interface PlanDetailViewProps {
  planId: number;
  onBack: () => void;
}

export function PlanDetailView({ planId, onBack }: PlanDetailViewProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [trainingIdInput, setTrainingIdInput] = useState('');

  const { data: plan, isLoading } = useApiQuery<TrainingPlan>(
    queryKeys.trainingPlans.detail(planId),
    `/training-plans/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: execution } = useApiQuery<TrainingPlanExecution>(
    queryKeys.trainingPlans.execution(planId),
    `/training-plans/${planId}/execution`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: manageResp } = useApiQuery<{ data: Training[] }>(
    queryKeys.trainings.manage({ limit: 200 }),
    '/trainings/manage',
    { params: { limit: 200 }, staleTime: STALE_TIME.DYNAMIC, enabled: showAddTraining },
  );

  const invalidateKeys = [queryKeys.trainingPlans.all];
  const toastError = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const addTraining = useApiMutation(
    (trainingId: number) => apiClient.post(`/training-plans/${planId}/trainings`, { trainingId }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Formação associada ao plano.', intent: 'success' });
        setShowAddTraining(false);
        setTrainingIdInput('');
      },
      onError: toastError,
    },
  );
  const removeTraining = useApiMutation(
    (trainingId: number) => apiClient.delete(`/training-plans/${planId}/trainings/${trainingId}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação desassociada.', intent: 'success' }),
      onError: toastError,
    },
  );

  async function onRemoveTraining(id: number, title: string) {
    const ok = await confirm({ title: `Desassociar "${title}" deste plano?`, confirmLabel: 'Desassociar' });
    if (ok) removeTraining.mutate(id);
  }

  if (isLoading || !plan) return <Skeleton rows={4} />;

  const statusCfg = PLAN_STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const trainings = plan.trainings ?? [];

  return (
    <div className="space-y-6">
      <Button intent="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar aos planos
      </Button>

      <Card className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{plan.name}</h2>
            <p className="text-xs text-ink-faint">
              {plan.code ? `${plan.code} · ` : ''}
              {plan.year} · {PLAN_PERIOD_LABEL[plan.period]}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${priorityCfg.cls}`}>
              {priorityCfg.label}
            </span>
            <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>
        {plan.description && <p className="mb-2 text-sm text-ink-muted">{plan.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-xs text-ink-faint sm:grid-cols-4">
          <div>
            <div className="text-ink-faint">Responsável</div>
            <div className="text-ink">{plan.responsible?.fullName ?? '—'}</div>
          </div>
          <div>
            <div className="text-ink-faint">Aprovador</div>
            <div className="text-ink">{plan.approver?.fullName ?? '—'}</div>
          </div>
          <div>
            <div className="text-ink-faint">Início</div>
            <div className="text-ink">{plan.startDate?.slice(0, 10) ?? '—'}</div>
          </div>
          <div>
            <div className="text-ink-faint">Fim</div>
            <div className="text-ink">{plan.endDate?.slice(0, 10) ?? '—'}</div>
          </div>
        </div>
        {plan.status === 'REJECTED' && plan.rejectionReason && (
          <p className="mt-3 rounded-card bg-danger-subtle p-2 text-xs text-danger-ink">
            Motivo da rejeição: {plan.rejectionReason}
          </p>
        )}
      </Card>

      {/* Execução: planeado vs. realizado */}
      {execution && (
        <Card className="p-5">
          <h3 className="mb-3 font-body text-sm font-medium text-ink">
            Execução — planeado vs. realizado
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ExecutionStat
              label="Participantes"
              planned={execution.planned.participants}
              realized={execution.realized.participants}
              rate={execution.executionRate.participants}
            />
            <ExecutionStat
              label="Horas"
              planned={execution.planned.hours}
              realized={execution.realized.hours}
              rate={execution.executionRate.hours}
            />
            <ExecutionStat
              label="Orçamento"
              planned={execution.planned.budget}
              realized={execution.realized.budget}
              rate={execution.executionRate.budget}
              money
            />
            <ExecutionStat
              label="Formações concluídas"
              planned={execution.planned.trainingsCount}
              realized={execution.realized.completedTrainings}
              rate={execution.executionRate.trainings}
            />
          </div>
        </Card>
      )}

      {/* Formações previstas */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Formações previstas
          </span>
          <div className="flex gap-2">
            <a
              href={`/api/training-plans/${plan.id}/export`}
              className={buttonVariants({ intent: 'ghost', size: 'sm' })}
            >
              Exportar
            </a>
            <Button size="sm" onClick={() => setShowAddTraining(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Adicionar formação
            </Button>
          </div>
        </div>
        {trainings.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Sem formações associadas"
            description="Associa formações já criadas na Gestão a este plano."
          />
        ) : (
          <div className="divide-y divide-border">
            {trainings.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{t.title}</div>
                  <div className="text-xs text-ink-faint">
                    {t._count.participants} participantes · {t.workloadHours ?? 0}h
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[t.status].cls}`}>
                  {STATUS_CFG[t.status].label}
                </span>
                <Button
                  intent="danger"
                  size="sm"
                  onClick={() => onRemoveTraining(t.id, t.title)}
                  disabled={removeTraining.isPending && removeTraining.variables === t.id}
                  loading={removeTraining.isPending && removeTraining.variables === t.id}
                >
                  Desassociar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAddTraining && (
        <Modal open onOpenChange={(open) => !open && setShowAddTraining(false)}>
          <ModalContent title="Adicionar formação ao plano">
            <div className="mt-4 space-y-4">
              <FormField label="Formação" htmlFor="add-training-id">
                <Combobox
                  items={(manageResp?.data ?? [])
                    .filter((t) => !trainings.some((pt) => pt.id === t.id))
                    .map((t) => ({ value: String(t.id), label: t.title }))}
                  value={trainingIdInput || undefined}
                  onValueChange={setTrainingIdInput}
                  placeholder="Selecionar formação"
                  className="w-full"
                />
              </FormField>
              <div className="flex gap-3">
                <Button intent="secondary" className="flex-1 justify-center" onClick={() => setShowAddTraining(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 justify-center"
                  loading={addTraining.isPending}
                  disabled={!trainingIdInput}
                  onClick={() => {
                    const id = Number(trainingIdInput);
                    if (Number.isFinite(id) && id > 0) addTraining.mutate(id);
                  }}
                >
                  Associar
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

function ExecutionStat({
  label,
  planned,
  realized,
  rate,
  money,
}: {
  label: string;
  planned: number;
  realized: number;
  rate: number | null;
  money?: boolean;
}) {
  const fmt = (v: number) => (money ? formatKz(v) : v.toLocaleString('pt-PT'));
  return (
    <div>
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="font-mono text-lg font-bold text-ink">
        {fmt(realized)}
        <span className="text-xs font-normal text-ink-faint"> / {fmt(planned)}</span>
      </div>
      {rate !== null && (
        <div className={`text-xs ${rate >= 100 ? 'text-success-ink' : 'text-ink-faint'}`}>{rate}% executado</div>
      )}
    </div>
  );
}
