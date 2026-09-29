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
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { KpiDefinitionModal } from './KpiDefinitionModal';
import {
  KPI_CATEGORY_LABELS,
  KPI_FREQUENCY_LABELS,
  KPI_STATUS_INTENTS,
  KPI_STATUS_LABELS,
} from './utils';
import type {
  KpiCategorySummaryRow,
  KpiDefinitionListData,
  KpiDefinitionRow,
} from './types';

export function KpisTab() {
  const notify = useToast();
  const [modalKpi, setModalKpi] = useState<KpiDefinitionRow | 'new' | null>(
    null,
  );

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
      invalidateKeys: [
        queryKeys.roiImpact.kpis(),
        queryKeys.roiImpact.kpisByCategory(),
      ],
      onSuccess: () =>
        notify({ title: 'Estado actualizado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao actualizar',
          description: e.message,
          intent: 'danger',
        }),
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
          {data?.total ?? 0} KPI(s) — biblioteca central que o RH pode associar
          a qualquer iniciativa
        </p>
        <Button size="sm" onClick={() => setModalKpi('new')}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo KPI
        </Button>
      </div>

      {(byCategory?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-start gap-4">
          <Card className="shrink-0">
            <CardBody>
              <DonutChart
                size={140}
                centerLabel="KPIs"
                data={byCategory!.map((c) => ({
                  label: KPI_CATEGORY_LABELS[c.category] ?? c.category,
                  value: c.count,
                }))}
              />
            </CardBody>
          </Card>
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            {byCategory!.map((c) => (
              <Card key={c.category}>
                <CardBody>
                  <p className="font-display text-xl font-bold text-ink">
                    {c.count}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {KPI_CATEGORY_LABELS[c.category] ?? c.category}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <div className="p-5">
          <DataTable
            data={kpis}
            rowKey={(k) => k.id}
            searchKeys={['name', 'code']}
            searchPlaceholder="Pesquisar KPI…"
            emptyLabel="Cria o primeiro KPI para começar a biblioteca central de indicadores."
            columns={[
              {
                key: 'name',
                header: 'Nome',
                sortable: true,
                render: (k) => (
                  <>
                    <p className="font-medium text-ink">{k.name}</p>
                    {k.description && (
                      <p className="text-xs text-ink-faint">{k.description}</p>
                    )}
                  </>
                ),
              },
              {
                key: 'code',
                header: 'Código',
                sortable: true,
                className: 'font-mono text-xs',
              },
              {
                key: 'category',
                header: 'Categoria',
                sortable: true,
                render: (k) => KPI_CATEGORY_LABELS[k.category] ?? k.category,
              },
              { key: 'unit', header: 'Unidade' },
              {
                key: 'frequency',
                header: 'Frequência',
                render: (k) => KPI_FREQUENCY_LABELS[k.frequency] ?? k.frequency,
              },
              {
                key: 'targetValue',
                header: 'Meta',
                sortable: true,
                render: (k) => (k.targetValue != null ? k.targetValue : '—'),
              },
              {
                key: 'status',
                header: 'Estado',
                sortable: true,
                render: (k) => (
                  <Badge intent={KPI_STATUS_INTENTS[k.status] ?? 'neutral'}>
                    {KPI_STATUS_LABELS[k.status] ?? k.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (k) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => setModalKpi(k)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => toggleStatus.mutate(k)}
                    >
                      {k.status === 'ACTIVO' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {modalKpi && (
        <KpiDefinitionModal
          kpi={modalKpi === 'new' ? undefined : modalKpi}
          onClose={() => setModalKpi(null)}
        />
      )}
    </div>
  );
}
