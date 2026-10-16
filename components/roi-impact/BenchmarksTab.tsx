// components/roi-impact/BenchmarksTab.tsx
// Tab "Benchmarks" (docs/roi-impact.md §9): referências internas (metas
// explícitas registadas pelo RH) e externas (mercado/sector, sempre com
// fonte) para contextualizar ROI/KPIs. As comparações "internas" (entre
// departamentos/unidades/ciclos, melhor/pior por tipo de iniciativa) são
// sempre computadas a partir de RoiAnalysis — nunca guardadas — por isso
// aparecem como um bloco de leitura separado da tabela de registos manuais.

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { BenchmarkModal } from './BenchmarkModal';
import { BenchmarkRoiCard } from './BenchmarkRoiCard';
import {
  RoiByCycleCard,
  RoiByDepartmentCard,
  RoiByUnitCard,
} from './RoiBreakdownCards';
import {
  BENCHMARK_TYPE_INTENTS,
  BENCHMARK_TYPE_LABELS,
  INITIATIVE_TYPE_LABELS,
} from './utils';
import type {
  BenchmarkInternalComparisonsData,
  BenchmarkListData,
  BenchmarkRow,
  BenchmarkSectorComparisonData,
} from './types';

export function BenchmarksTab() {
  const notify = useToast();
  const [modalBenchmark, setModalBenchmark] = useState<
    BenchmarkRow | 'new' | null
  >(null);

  const { data, isLoading: loading } = useApiQuery<BenchmarkListData>(
    queryKeys.roiImpact.benchmarks(),
    '/roi-impact/benchmarks',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const { data: internal, isLoading: loadingInternal } =
    useApiQuery<BenchmarkInternalComparisonsData>(
      queryKeys.roiImpact.benchmarkInternalComparisons(),
      '/roi-impact/benchmarks/internal-comparisons',
      { staleTime: STALE_TIME.DYNAMIC },
    );

  const { data: sector } = useApiQuery<BenchmarkSectorComparisonData>(
    queryKeys.roiImpact.benchmarkSectorComparison(),
    '/roi-impact/benchmarks/sector-roi-comparison',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/benchmarks/${id}`),
    {
      invalidateKeys: [
        queryKeys.roiImpact.benchmarks(),
        queryKeys.roiImpact.benchmarkSectorComparison(),
      ],
      onSuccess: () =>
        notify({ title: 'Benchmark removido', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao remover',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const benchmarks = data?.benchmarks ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-ink">
          Internos
        </h3>
        {loadingInternal ? (
          <Skeleton
            rows={2}
            wrapperClassName="space-y-2 animate-pulse"
            itemClassName="h-14 rounded-card bg-surface-sunken"
          />
        ) : (internal?.totalAnalyses ?? 0) === 0 ? (
          <p className="font-body text-sm text-ink-faint">
            Sem análises de ROI calculadas ainda para comparar
            departamentos/unidades/ciclos.
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <RoiByDepartmentCard rows={internal?.byDepartment ?? []} />
            <RoiByUnitCard rows={internal?.byUnit ?? []} />
            <RoiByCycleCard rows={internal?.byCycle ?? []} />
          </div>
        )}

        {(internal?.bestWorstByType.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D]/65 via-[#0B3A75]/65 to-[#0A2A57]/65 pb-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
            <div className="px-5 py-3">
              <h4 className="font-display text-sm font-semibold text-white">
                Melhor e pior desempenho por tipo de iniciativa
              </h4>
            </div>
            <div className="mx-4 rounded-card bg-surface p-4 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-[11px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHead className="bg-[#0F1F3D]/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHeaderCell className="text-white">
                        Tipo
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Melhor
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Pior
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {internal!.bestWorstByType.map((row) => (
                      <TableRow key={row.initiativeType}>
                        <TableCell>
                          {INITIATIVE_TYPE_LABELS[row.initiativeType] ??
                            row.initiativeType}
                        </TableCell>
                        <TableCell>
                          {row.best
                            ? `${row.best.name} (${row.best.roiPercent}%)`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {row.worst
                            ? `${row.worst.name} (${row.worst.roiPercent}%)`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-ink">
          Externos
        </h3>
        <Card>
          <CardBody>
            <BenchmarkRoiCard
              avgRoi={sector?.internalAvgRoi ?? null}
              sampleSize={sector?.sampleSize ?? 0}
            />
            {sector?.note && (
              <AlertCard
                variant="warning"
                className="mt-3"
                title="Sem benchmarks externos de ROI registados"
                message="Regista um benchmark externo com fonte para contextualizar a comparação."
              />
            )}
            {(sector?.externalBenchmarks.length ?? 0) > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-ink">
                {sector!.externalBenchmarks.map((b) => (
                  <li key={b.id} className="flex justify-between">
                    <span className="text-ink-faint">
                      {b.name} ({b.referenceYear}) — {b.source}
                    </span>
                    <span className="font-semibold">
                      {b.value}
                      {b.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => setModalBenchmark('new')}>
            <Plus size={14} strokeWidth={1.75} className="mr-1" />
            Novo benchmark
          </Button>
        </div>

        <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D]/65 via-[#0B3A75]/65 to-[#0A2A57]/65 pb-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
          <div className="px-5 py-3">
            <h4 className="font-display text-sm font-semibold text-white">
              Registos de benchmarks
            </h4>
          </div>
          <div className="mx-4 rounded-card bg-surface p-4 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-[11px]">
            {loading ? (
              <Skeleton
                rows={3}
                wrapperClassName="space-y-2 p-4 animate-pulse"
                itemClassName="h-12 rounded-card bg-surface-sunken"
              />
            ) : benchmarks.length === 0 ? (
              <EmptyState
                title="Sem benchmarks registados ainda"
                description="Regista uma referência interna ou externa (com fonte) para contextualizar os resultados."
                className="border-none"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead className="bg-[#0F1F3D]/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHeaderCell className="text-white">
                        Nome
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Tipo
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Fonte
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Ano
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Valor
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white">
                        Aplicável a
                      </TableHeaderCell>
                      <TableHeaderCell className="text-white" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {benchmarks.map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer"
                        onClick={() => setModalBenchmark(b)}
                      >
                        <TableCell className="text-ink">{b.name}</TableCell>
                        <TableCell>
                          <Badge
                            intent={BENCHMARK_TYPE_INTENTS[b.type] ?? 'neutral'}
                          >
                            {BENCHMARK_TYPE_LABELS[b.type] ?? b.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{b.source}</TableCell>
                        <TableCell>{b.referenceYear}</TableCell>
                        <TableCell>
                          {b.value}
                          {b.unit}
                        </TableCell>
                        <TableCell className="text-xs text-ink-faint">
                          {b.indicatorName ?? '—'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            intent="secondary"
                            loading={remove.isPending}
                            onClick={() => remove.mutate(b.id)}
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
          </div>
        </div>
      </section>

      {modalBenchmark && (
        <BenchmarkModal
          benchmark={modalBenchmark === 'new' ? undefined : modalBenchmark}
          onClose={() => setModalBenchmark(null)}
        />
      )}
    </div>
  );
}
