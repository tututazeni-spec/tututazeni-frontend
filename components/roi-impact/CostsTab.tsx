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
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
      )}

      <Card>
        <div className="border-b border-border px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-ink">Consolidação por iniciativa</h4>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="Sem custos registados ainda"
            description="Regista a primeira linha de custo para começar a consolidar o investimento por iniciativa."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Participantes</TableHeaderCell>
                  <TableHeaderCell>Custo direto</TableHeaderCell>
                  <TableHeaderCell>Custo indireto</TableHeaderCell>
                  <TableHeaderCell>Custo oportunidade</TableHeaderCell>
                  <TableHeaderCell>Custo total</TableHeaderCell>
                  <TableHeaderCell>Custo/participante</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.initiativeType}:${r.initiativeId}`}>
                    <TableCell>
                      <p className="text-ink">{r.initiative ?? '—'}</p>
                      <p className="text-xs text-ink-faint">
                        {INITIATIVE_TYPE_LABELS[r.initiativeType] ?? r.initiativeType}
                      </p>
                    </TableCell>
                    <TableCell>{r.participants}</TableCell>
                    <TableCell>{fmt$(r.costDirect)}</TableCell>
                    <TableCell>{fmt$(r.costIndirect)}</TableCell>
                    <TableCell>{fmt$(r.costOpportunity)}</TableCell>
                    <TableCell className="font-medium text-ink">{fmt$(r.costTotal)}</TableCell>
                    <TableCell>{r.costPerParticipant != null ? fmt$(r.costPerParticipant) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card>
        <div className="border-b border-border px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-ink">Linhas de custo</h4>
        </div>
        {entries.length === 0 ? (
          <EmptyState
            title="Sem linhas de custo ainda"
            description="As linhas de custo aparecem aqui à medida que forem registadas."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Subcategoria</TableHeaderCell>
                  <TableHeaderCell>Descrição</TableHeaderCell>
                  <TableHeaderCell>Valor</TableHeaderCell>
                  <TableHeaderCell>Fonte</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{INITIATIVE_TYPE_LABELS[e.initiativeType] ?? e.initiativeType}</TableCell>
                    <TableCell>
                      <Badge intent={COST_CATEGORY_INTENTS[e.category] ?? 'info'}>
                        {COST_CATEGORY_LABELS[e.category] ?? e.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{COST_SUBCATEGORY_LABELS[e.subCategory] ?? e.subCategory}</TableCell>
                    <TableCell>{e.description ?? '—'}</TableCell>
                    <TableCell className="font-medium text-ink">{fmt$(e.amount)}</TableCell>
                    <TableCell className="text-xs text-ink-faint">{e.source ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        intent="secondary"
                        loading={remove.isPending}
                        onClick={() => remove.mutate(e.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {modalOpen && <NewCostEntryModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
