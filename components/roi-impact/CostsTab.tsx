// components/roi-impact/CostsTab.tsx
// Tab "Custos & Investimento" (docs/roi-impact.md §5): consolida o custo
// real de cada iniciativa sem duplicar Payroll/Trainings — a consolidação
// por iniciativa e as linhas individuais vêm sempre do que a API devolve,
// nunca recalculadas aqui.

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { WalletStat } from './WalletStat';
import { NewCostEntryModal } from './NewCostEntryModal';
import {
  fmt$,
  INITIATIVE_TYPE_LABELS,
  COST_CATEGORY_LABELS,
  COST_CATEGORY_INTENTS,
  COST_SUBCATEGORY_LABELS,
} from './utils';
import type {
  CostConsolidationData,
  CostConsolidationRow,
  CostEntryListData,
} from './types';

export function CostsTab() {
  const notify = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: consolidation, isLoading: loadingConsolidation } =
    useApiQuery<CostConsolidationData>(
      queryKeys.roiImpact.costsConsolidation(),
      '/roi-impact/costs/consolidation',
      { staleTime: STALE_TIME.DYNAMIC },
    );
  const { data: entriesData, isLoading: loadingEntries } =
    useApiQuery<CostEntryListData>(
      queryKeys.roiImpact.costs(),
      '/roi-impact/costs',
      { staleTime: STALE_TIME.DYNAMIC },
    );

  const [toDelete, setToDelete] = useState<CostConsolidationRow | null>(null);

  const removeInitiative = useApiMutation(
    async (row: CostConsolidationRow) => {
      const ids = (entriesData?.entries ?? [])
        .filter(
          (e) =>
            e.initiativeType === row.initiativeType &&
            e.initiativeId === row.initiativeId,
        )
        .map((e) => e.id);
      for (const id of ids) await apiClient.delete(`/roi-impact/costs/${id}`);
    },
    {
      invalidateKeys: [
        queryKeys.roiImpact.costs(),
        queryKeys.roiImpact.costsConsolidation(),
      ],
      onSuccess: () =>
        notify({
          title: 'Custos da iniciativa removidos',
          intent: 'success',
        }),
      onError: (e) =>
        notify({
          title: 'Erro ao remover',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/costs/${id}`),
    {
      invalidateKeys: [
        queryKeys.roiImpact.costs(),
        queryKeys.roiImpact.costsConsolidation(),
      ],
      onSuccess: () =>
        notify({ title: 'Linha de custo removida', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao remover',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (loadingConsolidation || loadingEntries)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  const rows = consolidation?.rows ?? [];
  const entries = entriesData?.entries ?? [];
  const grandTotal = consolidation?.grandTotal;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-end gap-3">
        <p className="self-start font-body text-sm text-ink-muted">
          Consolida o custo real de cada iniciativa (direto + indireto +
          oportunidade) sem duplicar Folha de Pagamento/Formações — apenas
          agrega.
        </p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Nova Linha de Custo
        </Button>
      </div>

      {grandTotal && (
        <div className="grid grid-cols-2 items-start gap-6 md:grid-cols-3 xl:grid-cols-5">
          <WalletStat
            zoom
            money="bills"
            label="Custo direto total"
            value={fmt$(grandTotal.direct)}
            tone="blue"
          />
          <WalletStat
            zoom
            money="coins"
            label="Custo indireto total"
            value={fmt$(grandTotal.indirect)}
            tone="orange"
          />
          <WalletStat
            zoom
            money="stack"
            label="Custo de oportunidade total"
            value={fmt$(grandTotal.opportunity)}
            tone="green"
          />
          <WalletStat
            zoom
            money="fan"
            label="Investimento total"
            value={fmt$(grandTotal.total)}
            tone="red"
          />
          <WalletStat
            zoom
            money="mixed"
            label="Iniciativas"
            value={rows.length}
            tone="blue"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="pointer-events-none cursor-default select-none bg-brand/60 px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Consolidação por iniciativa
          </h4>
        </div>
        <div className="p-5 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-micro">
          <DataTable
            headerClassName="bg-brand/60 text-white"
            data={rows}
            rowKey={(r) => `${r.initiativeType}:${r.initiativeId}`}
            emptyLabel="Regista a primeira linha de custo para começar a consolidar o investimento por iniciativa."
            columns={[
              {
                key: 'initiative',
                header: 'Iniciativa',
                sortable: true,
                accessor: (r) => r.initiative ?? '',
                render: (r) => (
                  <>
                    <p className="text-ink">{r.initiative ?? '—'}</p>
                    <p className="text-xs text-ink-faint">
                      {INITIATIVE_TYPE_LABELS[r.initiativeType] ??
                        r.initiativeType}
                    </p>
                  </>
                ),
              },
              { key: 'participants', header: 'Participantes', sortable: true },
              {
                key: 'costDirect',
                header: 'Custo direto',
                sortable: true,
                render: (r) => fmt$(r.costDirect),
              },
              {
                key: 'costIndirect',
                header: 'Custo indirecto',
                sortable: true,
                render: (r) => fmt$(r.costIndirect),
              },
              {
                key: 'costOpportunity',
                header: 'Custo oportunidade',
                sortable: true,
                render: (r) => fmt$(r.costOpportunity),
              },
              {
                key: 'costTotal',
                header: 'Custo total',
                sortable: true,
                className: 'font-medium text-ink',
                render: (r) => fmt$(r.costTotal),
              },
              {
                key: 'costPerParticipant',
                header: 'Custo/participante',
                sortable: true,
                render: (r) =>
                  r.costPerParticipant != null
                    ? fmt$(r.costPerParticipant)
                    : '—',
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <Button
                    size="sm"
                    intent="ghost"
                    className="border-0 px-[8.4px] py-[2.8px] leading-none shadow-none"
                    aria-label="Apagar custos da iniciativa"
                    loading={removeInitiative.isPending}
                    onClick={() => setToDelete(r)}
                  >
                    <Trash2 size={11} strokeWidth={1.75} />
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="pointer-events-none cursor-default select-none bg-brand/60 px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Linhas de custo
          </h4>
        </div>
        <div className="p-5 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-micro">
          <DataTable
            headerClassName="bg-brand/60 text-white"
            data={entries}
            rowKey={(e) => e.id}
            emptyLabel="As linhas de custo aparecem aqui à medida que forem registadas."
            columns={[
              {
                key: 'initiativeType',
                header: 'Iniciativa',
                render: (e) =>
                  INITIATIVE_TYPE_LABELS[e.initiativeType] ?? e.initiativeType,
              },
              {
                key: 'category',
                header: 'Categoria',
                sortable: true,
                render: (e) => (
                  <Badge intent={COST_CATEGORY_INTENTS[e.category] ?? 'info'}>
                    {COST_CATEGORY_LABELS[e.category] ?? e.category}
                  </Badge>
                ),
              },
              {
                key: 'subCategory',
                header: 'Subcategoria',
                render: (e) =>
                  COST_SUBCATEGORY_LABELS[e.subCategory] ?? e.subCategory,
              },
              {
                key: 'description',
                header: 'Descrição',
                render: (e) => e.description ?? '—',
              },
              {
                key: 'amount',
                header: 'Valor',
                sortable: true,
                className: 'font-medium text-ink',
                render: (e) => fmt$(e.amount),
              },
              {
                key: 'source',
                header: 'Fonte',
                className: 'text-xs text-ink-faint',
                render: (e) => e.source ?? '—',
              },
              {
                key: 'actions',
                header: '',
                render: (e) => (
                  <Button
                    size="sm"
                    intent="ghost"
                    className="border-0 px-[8.4px] py-[2.8px] leading-none shadow-none"
                    loading={remove.isPending}
                    onClick={() => remove.mutate(e.id)}
                  >
                    <Trash2 size={11} strokeWidth={1.75} />
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Apagar custos da iniciativa"
          message={`Apagar as ${toDelete.entryCount} linhas de custo de «${toDelete.initiative ?? 'sem iniciativa'}»? Esta ação não pode ser desfeita.`}
          confirmLabel="Apagar"
          destructive
          onConfirm={() => {
            removeInitiative.mutate(toDelete);
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        />
      )}

      {modalOpen && <NewCostEntryModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
