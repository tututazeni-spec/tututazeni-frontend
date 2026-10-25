// components/evaluation/EvaluationsTab.tsx
// Separador "Avaliações" (docs/modulo_evaluation.md ponto 2) — lista
// agregada de avaliações por colaborador (GET /evaluations/requests),
// com filtros e as acções da tabela do doc. Dados próprios (useApiQuery)
// + apresentação, mesmo padrão dos restantes separadores deste módulo.

'use client';

import { useMemo, useState } from 'react';
import {
  AlarmClock,
  Bell,
  CheckCircle2,
  Eye,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { MGMT_ROLES } from '@/lib/roles';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUnits } from '@/components/departments/departmentFormData';
import { EVAL_CARD_ACTION, EvaluationCard } from './EvaluationCard';
import { EvaluationDetailModal } from './EvaluationDetailModal';
import { NewEvaluationWizard } from './NewEvaluationWizard';
import { SubmitEvaluationModal } from './SubmitEvaluationModal';
import { PURPOSE_LABEL, REQUEST_STATUS_MAP } from './constants';
import type { Cycle, EvaluationRequestRow } from './types';
import { saveBlob } from '@/lib/download';

const ALL = 'ALL';
const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(REQUEST_STATUS_MAP).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];
const PURPOSE_ITEMS = [
  { value: ALL, label: 'Todos os tipos' },
  ...Object.entries(PURPOSE_LABEL).map(([value, label]) => ({ value, label })),
];

function useDepartmentOptions() {
  const { data } = useApiQuery<
    { id: number; name: string; children?: unknown[] }[]
  >(queryKeys.departments.tree(), '/departments/tree', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  return useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (
      nodes: { id: number; name: string; children?: unknown[] }[] | undefined,
    ) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name });
        walk(n.children as typeof nodes);
      }
    };
    walk(data);
    return flat;
  }, [data]);
}

export function EvaluationsTab() {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const canManage = useHasRole(MGMT_ROLES);

  const [cycleId, setCycleId] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [purpose, setPurpose] = useState(ALL);
  const [page, setPage] = useState(1);
  const [showWizard, setShowWizard] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [submittingRow, setSubmittingRow] =
    useState<EvaluationRequestRow | null>(null);

  const departments = useDepartmentOptions();
  const { units } = useUnits(canManage);
  const { data: cyclesData } = useApiQuery<{ data: Cycle[] }>(
    queryKeys.evaluation.cycles(),
    '/evaluations/cycles',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: canManage },
  );

  const filters = {
    ...(cycleId !== ALL ? { cycleId: Number(cycleId) } : {}),
    ...(departmentId !== ALL ? { departmentId: Number(departmentId) } : {}),
    ...(unitId !== ALL ? { unitId: Number(unitId) } : {}),
    ...(status !== ALL ? { status } : {}),
    ...(purpose !== ALL ? { purpose } : {}),
    page,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: EvaluationRequestRow[];
    meta: { total: number; totalPages: number };
  }>(queryKeys.evaluation.requests(filters), '/evaluations/requests', {
    params: filters,
    staleTime: STALE_TIME.DYNAMIC,
    enabled: canManage,
  });

  const remind = useApiMutation(
    (id: number) => apiClient.post(`/evaluations/requests/${id}/remind`, {}),
    {
      onSuccess: () => notify({ title: 'Lembrete enviado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: e instanceof Error ? e.message : 'Erro',
          intent: 'danger',
        }),
    },
  );
  const finish = useApiMutation(
    (id: number) => apiClient.patch(`/evaluations/requests/${id}/finish`, {}),
    {
      invalidateKeys: [queryKeys.evaluation.requests(filters)],
      onSuccess: () =>
        notify({ title: 'Avaliação finalizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: e instanceof Error ? e.message : 'Erro',
          intent: 'danger',
        }),
    },
  );
  const reopen = useApiMutation(
    (id: number) => apiClient.patch(`/evaluations/requests/${id}/reopen`, {}),
    {
      invalidateKeys: [queryKeys.evaluation.requests(filters)],
      onSuccess: () =>
        notify({ title: 'Avaliação reaberta', intent: 'success' }),
      onError: (e) =>
        notify({
          title: e instanceof Error ? e.message : 'Erro',
          intent: 'danger',
        }),
    },
  );

  const exportCsv = () => {
    const rows = data?.data ?? [];
    const header = [
      'Colaborador',
      'Nº colaborador',
      'Departamento',
      'Cargo',
      'Avaliador',
      'Tipo',
      'Ciclo',
      'Estado',
      'Prazo',
      'Resultado',
      'Data de conclusão',
    ];
    const lines = rows.map((r) =>
      [
        r.evaluated.fullName,
        r.evaluated.employeeNumber ?? '',
        r.evaluated.department?.name ?? '',
        r.evaluated.position?.name ?? '',
        r.evaluator?.fullName ?? '',
        r.purpose ? PURPOSE_LABEL[r.purpose] : '',
        r.cycle?.name ?? '',
        REQUEST_STATUS_MAP[r.status]?.label ?? r.status,
        r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt') : '',
        r.result != null ? r.result.toFixed(1) : '',
        r.completedAt ? new Date(r.completedAt).toLocaleDateString('pt') : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = `﻿${[header.join(','), ...lines].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveBlob(blob, 'avaliacoes.csv');
  };

  if (!canManage) {
    return (
      <EmptyState
        title="Sem acesso"
        description="Este separador é apenas para gestão (ADMIN/RH/LIDER/GESTOR)."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display font-semibold text-ink">Avaliações</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" intent="secondary" onClick={exportCsv}>
            Exportar
          </Button>
          <Button size="sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} strokeWidth={1.75} className="mr-1" />
            Nova Avaliação
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          items={[
            { value: ALL, label: 'Todos os ciclos' },
            ...(cyclesData?.data ?? []).map((c) => ({
              value: String(c.id),
              label: c.name,
            })),
          ]}
          value={cycleId}
          onValueChange={(v) => {
            setCycleId(v);
            setPage(1);
          }}
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os departamentos' },
            ...departments.map((d) => ({ value: String(d.id), label: d.name })),
          ]}
          value={departmentId}
          onValueChange={(v) => {
            setDepartmentId(v);
            setPage(1);
          }}
        />
        <Select
          items={[
            { value: ALL, label: 'Todas as unidades' },
            ...units.map((u) => ({ value: String(u.id), label: u.name })),
          ]}
          value={unitId}
          onValueChange={(v) => {
            setUnitId(v);
            setPage(1);
          }}
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <Select
          items={PURPOSE_ITEMS}
          value={purpose}
          onValueChange={(v) => {
            setPurpose(v);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2"
          itemClassName="skeleton-shimmer h-12 rounded-card"
        />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="Sem avaliações"
          description="Nenhuma avaliação corresponde aos filtros seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data?.data.map((r) => {
            const isOverdue =
              !!r.dueDate &&
              r.status !== 'COMPLETED' &&
              new Date(r.dueDate) < new Date();
            const canContinue =
              r.status !== 'COMPLETED' && r.evaluator?.id === me?.id;
            return (
              <EvaluationCard
                key={r.key}
                row={r}
                overdue={isOverdue}
                onSelect={() => setViewingId(r.id)}
                actions={
                  <>
                    <button
                      type="button"
                      className={EVAL_CARD_ACTION}
                      aria-label="Ver"
                      title="Ver"
                      onClick={() => setViewingId(r.id)}
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </button>
                    {canContinue && (
                      <button
                        type="button"
                        className={EVAL_CARD_ACTION}
                        aria-label="Continuar avaliação"
                        title="Continuar avaliação"
                        onClick={() => setSubmittingRow(r)}
                      >
                        <Sparkles size={15} strokeWidth={1.75} />
                      </button>
                    )}
                    {r.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className={EVAL_CARD_ACTION}
                        aria-label="Enviar lembrete"
                        title="Enviar lembrete"
                        onClick={() => remind.mutate(r.id)}
                      >
                        <Bell size={15} strokeWidth={1.75} />
                      </button>
                    )}
                    {r.status !== 'COMPLETED' ? (
                      <button
                        type="button"
                        className={EVAL_CARD_ACTION}
                        aria-label="Finalizar"
                        title="Finalizar"
                        onClick={() => finish.mutate(r.id)}
                      >
                        <CheckCircle2 size={15} strokeWidth={1.75} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={EVAL_CARD_ACTION}
                        aria-label="Reabrir"
                        title="Reabrir"
                        onClick={() => reopen.mutate(r.id)}
                      >
                        <RotateCcw size={15} strokeWidth={1.75} />
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            intent="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-ink-faint">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            size="sm"
            intent="secondary"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}

      {viewingId != null && (
        <EvaluationDetailModal
          requestId={viewingId}
          editable={canManage}
          onClose={() => setViewingId(null)}
        />
      )}
      {submittingRow && (
        <SubmitEvaluationModal
          requestId={submittingRow.id}
          cycleId={submittingRow.cycle?.id}
          evaluatedName={submittingRow.evaluated.fullName}
          onClose={() => setSubmittingRow(null)}
        />
      )}
      {showWizard && (
        <NewEvaluationWizard onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
