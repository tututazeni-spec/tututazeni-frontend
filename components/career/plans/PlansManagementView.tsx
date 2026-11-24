// components/career/plans/PlansManagementView.tsx
// Separador "Planos de Carreira" (RH/Gestor/Admin) — Módulo Career,
// secção 4. Lista todos os planos (GET /career-plans) e abre
// NewCareerPlanModal para criar um novo.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ClipboardList, Compass, Layers, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { NewCareerPlanModal } from '../NewCareerPlanModal';
import type { CareerPlan } from './types';

function PlanAvatar({
  name,
  url,
  initials,
}: {
  name: string;
  url?: string | null;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-[52px] w-[52px] shrink-0 rounded-full object-cover ring-2 ring-white/80"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5BD86B] to-[#27A33C] font-body text-lg font-bold text-white"
    >
      {initials}
    </span>
  );
}

export function PlansManagementView() {
  const [showNew, setShowNew] = useState(false);
  const [department, setDepartment] = useState('');
  const params = { department: department || undefined };
  const notify = useToast();
  const confirm = useConfirm();
  const {
    data: resp,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: CareerPlan[] }>(
    queryKeys.careerPlans.list(params),
    '/career-plans',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  const plans = resp?.data ?? [];

  const deptParams = { limit: 200 };
  const { data: deptResp } = useApiQuery<{
    data: { id: number; name: string }[];
  }>(queryKeys.departments.list(deptParams), '/departments', {
    params: deptParams,
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const departmentItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...(deptResp?.data ?? []).map((d) => ({ value: d.name, label: d.name })),
  ];

  const deletePlan = useApiMutation(
    (id: number) => apiClient.delete(`/career-plans/${id}`),
    {
      onSuccess: () => {
        refetch();
        notify({ title: 'Plano de carreira apagado', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleDelete = async (plan: CareerPlan) => {
    const ok = await confirm({
      title: 'Apagar plano de carreira',
      message: `Tem a certeza que quer apagar "${plan.title}"? O plano deixa de aparecer na lista.`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) deletePlan.mutate(plan.id);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-body text-sm text-ink-faint">
          {plans.length} planos
        </span>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} strokeWidth={1.75} /> Novo Plano de Carreira
        </Button>
      </div>

      <div className="mb-6 w-full sm:w-72">
        <Select
          variant="underline"
          icon={Layers}
          items={departmentItems}
          value={department || 'ALL'}
          onValueChange={(v) => setDepartment(v === 'ALL' ? '' : v)}
        />
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="Sem planos de carreira"
          description={
            department
              ? 'Nenhum plano encontrado para este departamento.'
              : 'Cria o primeiro plano de carreira para um colaborador.'
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            {plans.map((plan) => {
              const name = plan.user?.fullName ?? `Colaborador #${plan.userId}`;
              const score = plan.readiness?.score;
              const initials = name
                .split(' ')
                .filter(Boolean)
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const statusTone =
                plan.status === 'CANCELLED'
                  ? 'bg-danger'
                  : plan.status === 'INACTIVE'
                    ? 'bg-warning'
                    : 'bg-[#34C04B]';
              const diagonal =
                'polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%)';
              return (
                <div
                  key={plan.id}
                  className="relative grid h-[100px] grid-cols-[46%_1fr] overflow-hidden rounded-[18px] border border-brand-line bg-white shadow-[0_6px_24px_rgba(11,61,145,0.10)]"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[calc(46%+7px)] bg-[#34C04B]"
                    style={{ clipPath: diagonal }}
                  />
                  <div
                    className="relative flex items-center gap-4 bg-gradient-to-r from-[#0A1B3F] via-[#0B2A66] to-[#0B3A9A] pl-6 pr-10 text-white"
                    style={{ clipPath: diagonal }}
                  >
                    <PlanAvatar
                      name={name}
                      url={plan.user?.avatarUrl}
                      initials={initials}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body text-lg font-bold leading-tight">
                        {name}
                      </div>
                      <div className="mt-0.5 truncate font-body text-sm text-white/85">
                        {plan.title}
                      </div>
                    </div>
                    <span
                      aria-hidden="true"
                      className="h-[46px] w-px shrink-0 bg-white/80"
                    />
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-5 py-1.5 font-body text-sm font-bold text-white',
                        statusTone,
                      )}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col justify-center gap-1.5 py-2.5 pl-3 pr-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ClipboardList
                          size={26}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0 text-brand"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-body text-[15px] font-bold uppercase leading-tight tracking-wide text-brand">
                            {plan.title}
                          </div>
                          <div className="truncate font-body text-xs text-brand-muted">
                            {plan.currentRole?.name ?? '—'} →{' '}
                            {plan.targetRole?.name ?? '—'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={deletePlan.isPending}
                        onClick={() => handleDelete(plan)}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[11px] bg-brand px-4 font-body text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={15} strokeWidth={1.75} /> Apagar
                      </button>
                    </div>

                    <div
                      role="progressbar"
                      aria-valuenow={score ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="relative flex h-[22px] items-center justify-between overflow-hidden rounded-full border border-[#1E7A35] bg-[#14532D]/15 px-3 font-body text-xs font-bold uppercase text-white"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, score ?? 0))}%`,
                          backgroundImage:
                            'linear-gradient(90deg, #14532D 0%, #3CCB5A 50%, #1E7A35 100%)',
                        }}
                      />
                      <span className="relative">Prontidão</span>
                      <span className="relative tabular-nums">
                        {score != null ? `${score}%` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-body text-xs text-brand-muted">
                      <Compass size={13} strokeWidth={1.75} />
                      <span className="truncate">
                        {plan.careerPath?.name ??
                          'Nenhuma trilha de carreira associada'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showNew && (
        <NewCareerPlanModal
          onClose={() => setShowNew(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
