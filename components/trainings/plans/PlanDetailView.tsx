// components/trainings/plans/PlanDetailView.tsx
// Detalhe do Plano de Formação — dados + "acompanhar execução" (planeado vs.
// realizado, docs/trainings-detalhado.md pt.2) + formações associadas.

'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  Download,
  Plus,
  UserCheck,
} from 'lucide-react';
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
import {
  PLAN_PERIOD_LABEL,
  PLAN_STATUS_CFG,
  PRIORITY_CFG,
  STATUS_CFG,
} from '../constants';
import type { Training, TrainingPlan, TrainingPlanExecution } from '../types';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { EventBadge } from '@/components/events/EventBadges';
import { Metric } from '@/components/events/EventListCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { NavyPanel } from './NavyPanel';
import { PLAN_TONE, PRIORITY_TONE } from './planTones';
import { TONE_COLOR } from '../trainingTones';
import { parsePickValue } from './MultiPickField';

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
    {
      params: { limit: 200 },
      staleTime: STALE_TIME.DYNAMIC,
      enabled: showAddTraining,
    },
  );

  const invalidateKeys = [queryKeys.trainingPlans.all];
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const addTraining = useApiMutation(
    (trainingId: number) =>
      apiClient.post(`/training-plans/${planId}/trainings`, { trainingId }),
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
    (trainingId: number) =>
      apiClient.delete(`/training-plans/${planId}/trainings/${trainingId}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação desassociada.', intent: 'success' }),
      onError: toastError,
    },
  );

  async function onRemoveTraining(id: number, title: string) {
    const ok = await confirm({
      title: `Desassociar "${title}" deste plano?`,
      confirmLabel: 'Desassociar',
    });
    if (ok) removeTraining.mutate(id);
  }

  if (isLoading || !plan) return <Skeleton rows={4} />;

  const palette = PALETTE[Math.abs(plan.id) % PALETTE.length];
  const statusCfg = PLAN_STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const trainings = plan.trainings ?? [];

  const rates = execution
    ? Object.values(execution.executionRate).filter(
        (r): r is number => typeof r === 'number',
      )
    : [];
  const overallRate = rates.length
    ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
    : null;

  const detailBlocks = [
    { label: 'Objetivos', items: parsePickValue(plan.objectives ?? '') },
    {
      label: 'Necessidades de formação identificadas',
      items: parsePickValue(plan.identifiedNeeds ?? ''),
    },
    {
      label: 'Prioridades estratégicas',
      items: parsePickValue(plan.strategicPriorities ?? ''),
    },
    { label: 'Público-alvo', items: parsePickValue(plan.targetAudience ?? '') },
  ].filter((b) => b.items.length > 0);

  return (
    <div className="space-y-6">
      <Button intent="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar aos planos
      </Button>

      {/* Cabeçalho — desenho de "workshop de inovação.jpeg": cartão claro com
          etiquetas, ícone + título, dados, responsável e acção; a imagem do
          plano num recorte inclinado no canto superior direito. */}
      <div className="relative overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div
          aria-hidden
          className="absolute right-0 top-0 hidden h-[58%] w-[34%] items-center justify-center text-white/70 sm:flex"
          style={{
            clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
            background: plan.imageUrl
              ? undefined
              : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
          }}
        >
          {plan.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              decoding="async"
              src={plan.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ClipboardList size={48} strokeWidth={1.25} />
          )}
        </div>

        <div className="relative space-y-5 p-6 sm:pr-[36%]">
          <div className="flex flex-wrap items-center gap-2">
            <EventBadge color={TONE_COLOR[PLAN_TONE[plan.status]]}>
              {statusCfg.label}
            </EventBadge>
            <EventBadge color={TONE_COLOR[PRIORITY_TONE[plan.priority]]}>
              {priorityCfg.label}
            </EventBadge>
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: palette[3] }}
            >
              <ClipboardList size={28} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-brand">
                {plan.name}
              </h1>
              <p className="mt-0.5 break-words text-base text-brand-muted">
                {plan.code ?? `Plano ${plan.year}`}
              </p>
            </div>
          </div>

          {plan.description && (
            <p className="font-body text-sm leading-relaxed text-ink-muted">
              {plan.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
            <Metric icon={CalendarDays}>
              {plan.year} · {PLAN_PERIOD_LABEL[plan.period] ?? plan.period}
            </Metric>
            <Metric icon={Clock}>
              {plan.startDate?.slice(0, 10) ?? '—'} →{' '}
              {plan.endDate?.slice(0, 10) ?? '—'}
            </Metric>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Metric icon={UserCheck}>
              {plan.responsible?.fullName ?? '—'}{' '}
              <span className="text-brand-muted">· Responsável</span>
            </Metric>
            <Metric icon={BadgeCheck}>
              {plan.approver?.fullName ?? '—'}{' '}
              <span className="text-brand-muted">· Aprovador</span>
            </Metric>
          </div>

          <div className="border-t border-brand-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {overallRate != null ? (
                <div className="min-w-[200px] flex-1">
                  <div className="mb-1 flex justify-between text-xs text-brand-muted">
                    <span>Execução do plano</span>
                    <span className="font-data font-semibold text-brand">
                      {overallRate}%
                    </span>
                  </div>
                  <ProgressBar value={overallRate} color={palette[0]} />
                </div>
              ) : (
                <span />
              )}
              <a
                href={`/api/training-plans/${plan.id}/export`}
                className={buttonVariants({ intent: 'secondary', size: 'sm' })}
                aria-label="Exportar plano"
                title="Exportar"
              >
                <Download size={15} strokeWidth={1.75} />
                Exportar
              </a>
            </div>
          </div>
        </div>
      </div>
      {plan.status === 'REJECTED' && plan.rejectionReason && (
        <p className="rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
          Motivo da rejeição: {plan.rejectionReason}
        </p>
      )}

      {/* Detalhes do plano */}
      {detailBlocks.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {detailBlocks.map((b) => (
            <NavyPanel key={b.label} seed={plan.id} title={b.label}>
              <ul className="space-y-1.5 font-body text-[15px] font-medium text-brand">
                {b.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: palette[0] }}
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </NavyPanel>
          ))}
        </div>
      )}

      {/* Execução: planeado vs. realizado */}
      {execution && (
        <NavyPanel seed={plan.id} title="Execução — planeado vs. realizado">
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
        </NavyPanel>
      )}

      {/* Formações previstas */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between bg-brand/60 px-4 py-3">
          <span className="font-body text-xs font-medium uppercase tracking-wide text-white">
            Formações previstas
          </span>
          <div className="flex gap-2">
            <a
              href={`/api/training-plans/${plan.id}/export`}
              className={`${buttonVariants({ intent: 'ghost', size: 'sm' })} !text-white`}
            >
              Exportar
            </a>
            <Button
              size="sm"
              className="border border-white/40 hover:!bg-white hover:!text-brand"
              onClick={() => setShowAddTraining(true)}
            >
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
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {t.title}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {t._count.participants} participantes ·{' '}
                    {t.workloadHours ?? 0}h
                  </div>
                </div>
                <span
                  className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[t.status].cls}`}
                >
                  {STATUS_CFG[t.status].label}
                </span>
                <Button
                  intent="danger"
                  size="sm"
                  onClick={() => onRemoveTraining(t.id, t.title)}
                  disabled={
                    removeTraining.isPending &&
                    removeTraining.variables === t.id
                  }
                  loading={
                    removeTraining.isPending &&
                    removeTraining.variables === t.id
                  }
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
                <Button
                  intent="secondary"
                  className="flex-1 justify-center"
                  onClick={() => setShowAddTraining(false)}
                >
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

interface ExecutionStatProps {
  label: string;
  planned: number;
  realized: number;
  rate: number | null;
  money?: boolean;
}

function ExecutionStat({
  label,
  planned,
  realized,
  rate,
  money,
}: ExecutionStatProps) {
  const fmt = (v: number) => (money ? formatKz(v) : v.toLocaleString('pt-PT'));
  return (
    <div>
      <div className="font-body text-[15px] font-medium text-brand-muted">
        {label}
      </div>
      <div className="font-body text-lg font-bold text-brand">
        {fmt(realized)}
        <span className="text-[15px] font-medium text-brand-muted">
          {' '}
          / {fmt(planned)}
        </span>
      </div>
      {rate !== null && (
        <div
          className={`text-xs ${rate >= 100 ? 'text-success-ink' : 'text-brand-muted'}`}
        >
          {rate}% executado
        </div>
      )}
    </div>
  );
}
