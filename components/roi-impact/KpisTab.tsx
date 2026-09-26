// components/roi-impact/KpisTab.tsx
// Tab "Indicadores & KPIs" (docs/roi-impact.md §6): biblioteca central de
// KPIs que o RH pode associar a qualquer iniciativa. Os exemplos do spec
// (Taxa de rotatividade voluntária, ...) são semeados em prisma/seed.ts —
// esta tab só lista/edita o que a API devolve.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { KpiDefinitionModal } from './KpiDefinitionModal';
import { KPI_CATEGORY_LABELS, KPI_FREQUENCY_LABELS, KPI_STATUS_INTENTS, KPI_STATUS_LABELS } from './utils';
import type { KpiCategorySummaryRow, KpiDefinitionListData, KpiDefinitionRow } from './types';

export function KpisTab() {
  const notify = useToast();
  const [modalKpi, setModalKpi] = useState<KpiDefinitionRow | 'new' | null>(null);

  const { data, isLoading: loading } = useApiQuery<KpiDefinitionListData>(
    queryKeys.roiImpact.kpis(),
    '/roi-impact/kpis',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: byCategory } = useApiQuery<KpiCategorySummaryRow[]>(
    queryKeys.roiImpact.kpisByCategory(),
    '/roi-impact/kpis/by-category',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const toggleStatus = useApiMutation(
    (k: KpiDefinitionRow) =>
      apiClient.patch(`/roi-impact/kpis/${k.id}`, {
        status: k.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
      }),
    {
      invalidateKeys: [queryKeys.roiImpact.kpis(), queryKeys.roiImpact.kpisByCategory()],
      onSuccess: () => notify({ title: 'Estado actualizado', intent: 'success' }),
      onError: (e) => notify({ title: 'Erro ao actualizar', description: e.message, intent: 'danger' }),
    },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  const kpis = data?.kpis ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {data?.total ?? 0} KPI(s) — biblioteca central que o RH pode associar a qualquer iniciativa
        </p>
        <Button size="sm" onClick={() => setModalKpi('new')}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo KPI
        </Button>
      </div>

      {(byCategory?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {byCategory!.map((c) => (
            <Card key={c.category}>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{c.count}</p>
                <p className="font-body text-[10px] text-ink-faint">
                  {KPI_CATEGORY_LABELS[c.category] ?? c.category}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        {kpis.length === 0 ? (
          <EmptyState
            title="Sem KPIs ainda"
            description="Cria o primeiro KPI para começar a biblioteca central de indicadores."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Unidade</TableHeaderCell>
                  <TableHeaderCell>Frequência</TableHeaderCell>
                  <TableHeaderCell>Meta</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {kpis.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <p className="font-medium text-ink">{k.name}</p>
                      {k.description && <p className="text-xs text-ink-faint">{k.description}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{k.code}</TableCell>
                    <TableCell>{KPI_CATEGORY_LABELS[k.category] ?? k.category}</TableCell>
                    <TableCell>{k.unit}</TableCell>
                    <TableCell>{KPI_FREQUENCY_LABELS[k.frequency] ?? k.frequency}</TableCell>
                    <TableCell>{k.targetValue != null ? k.targetValue : '—'}</TableCell>
                    <TableCell>
                      <Badge intent={KPI_STATUS_INTENTS[k.status] ?? 'neutral'}>
                        {KPI_STATUS_LABELS[k.status] ?? k.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" intent="secondary" onClick={() => setModalKpi(k)}>
                          Editar
                        </Button>
                        <Button size="sm" intent="secondary" onClick={() => toggleStatus.mutate(k)}>
                          {k.status === 'ACTIVO' ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {modalKpi && (
        <KpiDefinitionModal kpi={modalKpi === 'new' ? undefined : modalKpi} onClose={() => setModalKpi(null)} />
      )}
    </div>
  );
}
