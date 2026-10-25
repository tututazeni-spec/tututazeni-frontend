// components/roi-impact/KpisTab.tsx
// Tab "Indicadores & KPIs" (docs/roi-impact.md §6): biblioteca central de
// KPIs que o RH pode associar a qualquer iniciativa. Os exemplos do spec
// (Taxa de rotatividade voluntária, ...) são semeados em prisma/seed.ts —
// esta tab só lista/edita o que a API devolve.

'use client';

import { useState } from 'react';
import {
  Banknote,
  Gauge,
  HeartHandshake,
  Plus,
  ShieldCheck,
  Smile,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import { KpiDefinitionModal } from './KpiDefinitionModal';

const KPI_TONES: NavyStatTone[] = ['green', 'orange', 'red', 'blue'];
const KPI_CATEGORY_ICONS: Record<string, LucideIcon> = {
  PRODUTIVIDADE: TrendingUp,
  QUALIDADE: ShieldCheck,
  PESSOAS: Users,
  FINANCEIRO: Banknote,
  CLIENTE: Smile,
  SEGURANCA: ShieldCheck,
  COMPLIANCE: HeartHandshake,
};
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
      optimistic: {
        key: queryKeys.roiImpact.kpis(),
        update: (prev: KpiDefinitionListData | undefined, k) =>
          prev && {
            ...prev,
            kpis: prev.kpis.map((x) =>
              x.id === k.id
                ? {
                    ...x,
                    status:
                      k.status === 'ACTIVO'
                        ? ('INACTIVO' as const)
                        : ('ACTIVO' as const),
                  }
                : x,
            ),
          },
      },
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

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/kpis/${id}`),
    {
      invalidateKeys: [
        queryKeys.roiImpact.kpis(),
        queryKeys.roiImpact.kpisByCategory(),
      ],
      onSuccess: () => notify({ title: 'KPI apagado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao apagar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  const kpis = data?.kpis ?? [];

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 font-body text-sm text-ink-muted">
          {data?.total ?? 0} KPI(s) — biblioteca central que o RH pode associar
          a qualquer iniciativa
        </p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => setModalKpi('new')}
        >
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo KPI
        </Button>
      </div>

      {(byCategory?.length ?? 0) > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <Card className="flex shrink-0 flex-col justify-center justify-self-start lg:justify-self-stretch">
            <CardBody>
              <h3 className="mb-3 text-center font-display text-sm font-semibold text-ink">
                KPIs por categoria
              </h3>
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {byCategory!.map((c, i) => (
              <NavyStatCard
                key={c.category}
                icon={KPI_CATEGORY_ICONS[c.category] ?? Gauge}
                label={KPI_CATEGORY_LABELS[c.category] ?? c.category}
                value={c.count}
                tone={KPI_TONES[i % KPI_TONES.length]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand/65 via-brand-mid/65 to-brand-dark/65 pb-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Biblioteca de KPIs
          </h4>
        </div>
        <div className="mx-4 rounded-card bg-surface p-4 text-ink [&_table]:w-full [&_table]:table-fixed [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-micro">
          <DataTable
            headerClassName="bg-brand/60 text-white"
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
                className: 'w-[24%]',
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
                className: 'w-[12%] font-mono text-xs',
              },
              {
                key: 'category',
                header: 'Categoria',
                sortable: true,
                className: 'w-[12%]',
                render: (k) => KPI_CATEGORY_LABELS[k.category] ?? k.category,
              },
              { key: 'unit', header: 'Unidade', className: 'w-[9%]' },
              {
                key: 'frequency',
                header: 'Frequência',
                className: 'w-[11%]',
                render: (k) => KPI_FREQUENCY_LABELS[k.frequency] ?? k.frequency,
              },
              {
                key: 'targetValue',
                header: 'Meta',
                sortable: true,
                className: 'w-[8%]',
                render: (k) => (k.targetValue != null ? k.targetValue : '—'),
              },
              {
                key: 'status',
                header: 'Estado',
                sortable: true,
                className: 'w-[11%]',
                render: (k) => (
                  <Badge intent={KPI_STATUS_INTENTS[k.status] ?? 'neutral'}>
                    {KPI_STATUS_LABELS[k.status] ?? k.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'w-[13%]',
                render: (k) => (
                  <div className="flex flex-wrap gap-2">
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
                    <Button
                      size="sm"
                      intent="secondary"
                      aria-label={`Apagar KPI ${k.name}`}
                      title="Apagar KPI"
                      loading={remove.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Apagar o KPI "${k.name}"? Esta ação não pode ser desfeita.`,
                          )
                        )
                          remove.mutate(k.id);
                      }}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {modalKpi && (
        <KpiDefinitionModal
          kpi={modalKpi === 'new' ? undefined : modalKpi}
          onClose={() => setModalKpi(null)}
        />
      )}
    </div>
  );
}
