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
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { NewCostEntryModal } from './NewCostEntryModal';
import { fmt$, INITIATIVE_TYPE_LABELS, COST_CATEGORY_LABELS, COST_CATEGORY_INTENTS, COST_SUBCATEGORY_LABELS } from './utils';
import type { CostConsolidationData, CostEntryListData } from './types';

export function CostsTab() {
  const notify = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: consolidation, isLoading: loadingConsolidation } = useApiQuery<CostConsolidationData>(
    queryKeys.roiImpact.costsConsolidation(),
    '/roi-impact/costs/consolidation',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: entriesData, isLoading: loadingEntries } = useApiQuery<CostEntryListData>(
    queryKeys.roiImpact.costs(),
    '/roi-impact/costs',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation((id: number) => apiClient.delete(`/roi-impact/costs/${id}`), {
    invalidateKeys: [queryKeys.roiImpact.costs(), queryKeys.roiImpact.costsConsolidation()],
    onSuccess: () => notify({ title: 'Linha de custo removida', intent: 'success' }),
    onError: (e) => notify({ title: 'Erro ao remover', description: e.message, intent: 'danger' }),
  });

  if (loadingConsolidation || loadingEntries)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  const rows = consolidation?.rows ?? [];
  const entries = entriesData?.entries ?? [];
  const grandTotal = consolidation?.grandTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          Consolida o custo real de cada iniciativa (direto + indireto + oportunidade) sem duplicar
          Payroll/Trainings — apenas agrega.
        </p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Nova Linha de Custo
        </Button>
      </div>

      {grandTotal && (
        <div className="flex flex-wrap items-start gap-4">
          <Card className="shrink-0">
            <CardBody>
              <DonutChart
                size={140}
                centerLabel="Investimento total"
                valueFormat={fmt$}
                data={[
                  { label: 'Directo', value: grandTotal.direct },
                  { label: 'Indirecto', value: grandTotal.indirect },
                  { label: 'Oportunidade', value: grandTotal.opportunity },
                ]}
              />
            </CardBody>
          </Card>
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{fmt$(grandTotal.direct)}</p>
                <p className="font-body text-[10px] text-ink-faint">Custo direto total</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{fmt$(grandTotal.indirect)}</p>
                <p className="font-body text-[10px] text-ink-faint">Custo indireto total</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{fmt$(grandTotal.opportunity)}</p>
                <p className="font-body text-[10px] text-ink-faint">Custo de oportunidade total</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{fmt$(grandTotal.total)}</p>
                <p className="font-body text-[10px] text-ink-faint">Investimento total</p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <div className="border-b border-border px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-ink">Consolidação por iniciativa</h4>
        </div>
        <div className="p-5">
          <DataTable
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
                    <p className="text-xs text-ink-faint">{INITIATIVE_TYPE_LABELS[r.initiativeType] ?? r.initiativeType}</p>
                  </>
                ),
              },
              { key: 'participants', header: 'Participantes', sortable: true },
              { key: 'costDirect', header: 'Custo direto', sortable: true, render: (r) => fmt$(r.costDirect) },
              { key: 'costIndirect', header: 'Custo indirecto', sortable: true, render: (r) => fmt$(r.costIndirect) },
              { key: 'costOpportunity', header: 'Custo oportunidade', sortable: true, render: (r) => fmt$(r.costOpportunity) },
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
                render: (r) => (r.costPerParticipant != null ? fmt$(r.costPerParticipant) : '—'),
              },
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="border-b border-border px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-ink">Linhas de custo</h4>
        </div>
        <div className="p-5">
          <DataTable
            data={entries}
            rowKey={(e) => e.id}
            emptyLabel="As linhas de custo aparecem aqui à medida que forem registadas."
            columns={[
              {
                key: 'initiativeType',
                header: 'Iniciativa',
                render: (e) => INITIATIVE_TYPE_LABELS[e.initiativeType] ?? e.initiativeType,
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
                render: (e) => COST_SUBCATEGORY_LABELS[e.subCategory] ?? e.subCategory,
              },
              { key: 'description', header: 'Descrição', render: (e) => e.description ?? '—' },
              {
                key: 'amount',
                header: 'Valor',
                sortable: true,
                className: 'font-medium text-ink',
                render: (e) => fmt$(e.amount),
              },
              { key: 'source', header: 'Fonte', className: 'text-xs text-ink-faint', render: (e) => e.source ?? '—' },
              {
                key: 'actions',
                header: '',
                render: (e) => (
                  <Button size="sm" intent="secondary" loading={remove.isPending} onClick={() => remove.mutate(e.id)}>
                    <Trash2 size={14} strokeWidth={1.75} />
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {modalOpen && <NewCostEntryModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
