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
import { BenchmarkModal } from './BenchmarkModal';
import { BENCHMARK_TYPE_INTENTS, BENCHMARK_TYPE_LABELS, INITIATIVE_TYPE_LABELS } from './utils';
import type {
  BenchmarkInternalComparisonsData,
  BenchmarkListData,
  BenchmarkRow,
  BenchmarkSectorComparisonData,
} from './types';

export function BenchmarksTab() {
  const notify = useToast();
  const [modalBenchmark, setModalBenchmark] = useState<BenchmarkRow | 'new' | null>(null);

  const { data, isLoading: loading } = useApiQuery<BenchmarkListData>(
    queryKeys.roiImpact.benchmarks(),
    '/roi-impact/benchmarks',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const { data: internal, isLoading: loadingInternal } = useApiQuery<BenchmarkInternalComparisonsData>(
    queryKeys.roiImpact.benchmarkInternalComparisons(),
    '/roi-impact/benchmarks/internal-comparisons',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: sector } = useApiQuery<BenchmarkSectorComparisonData>(
    queryKeys.roiImpact.benchmarkSectorComparison(),
    '/roi-impact/benchmarks/sector-roi-comparison',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation((id: number) => apiClient.delete(`/roi-impact/benchmarks/${id}`), {
    invalidateKeys: [
      queryKeys.roiImpact.benchmarks(),
      queryKeys.roiImpact.benchmarkSectorComparison(),
    ],
    onSuccess: () => notify({ title: 'Benchmark removido', intent: 'success' }),
    onError: (e) => notify({ title: 'Erro ao remover', description: e.message, intent: 'danger' }),
  });

  const benchmarks = data?.benchmarks ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-ink">Internos</h3>
        {loadingInternal ? (
          <Skeleton rows={2} wrapperClassName="space-y-2 animate-pulse" itemClassName="h-14 rounded-card bg-surface-sunken" />
        ) : (internal?.totalAnalyses ?? 0) === 0 ? (
          <p className="font-body text-sm text-ink-faint">
            Sem análises de ROI calculadas ainda para comparar departamentos/unidades/ciclos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardBody>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  ROI médio por departamento
                </p>
                <ul className="space-y-1 text-sm text-ink">
                  {(internal?.byDepartment ?? []).map((d) => (
                    <li key={String(d.key)} className="flex justify-between">
                      <span className="text-ink-faint">{d.key}</span>
                      <span className="font-semibold">{d.avgRoi}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  ROI médio por unidade
                </p>
                <ul className="space-y-1 text-sm text-ink">
                  {(internal?.byUnit ?? []).map((d) => (
                    <li key={String(d.key)} className="flex justify-between">
                      <span className="text-ink-faint">{d.key}</span>
                      <span className="font-semibold">{d.avgRoi}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  ROI médio por ciclo/ano
                </p>
                <ul className="space-y-1 text-sm text-ink">
                  {(internal?.byCycle ?? []).map((d) => (
                    <li key={String(d.key)} className="flex justify-between">
                      <span className="text-ink-faint">{d.key}</span>
                      <span className="font-semibold">{d.avgRoi}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        )}

        {(internal?.bestWorstByType.length ?? 0) > 0 && (
          <Card>
            <CardBody>
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Melhor e pior desempenho por tipo de iniciativa
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Melhor</TableHeaderCell>
                      <TableHeaderCell>Pior</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {internal!.bestWorstByType.map((row) => (
                      <TableRow key={row.initiativeType}>
                        <TableCell>{INITIATIVE_TYPE_LABELS[row.initiativeType] ?? row.initiativeType}</TableCell>
                        <TableCell>
                          {row.best ? `${row.best.name} (${row.best.roiPercent}%)` : '—'}
                        </TableCell>
                        <TableCell>
                          {row.worst ? `${row.worst.name} (${row.worst.roiPercent}%)` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardBody>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-ink">Externos</h3>
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-ink-faint">ROI médio da Academia INNOVA</p>
                <p className="font-display text-xl font-bold text-ink">
                  {sector?.internalAvgRoi != null ? `${sector.internalAvgRoi}%` : '—'}
                </p>
                <p className="text-[11px] text-ink-faint">{sector?.sampleSize ?? 0} análise(s)</p>
              </div>
            </div>
            {sector?.note && (
              <p className="mt-3 rounded-card bg-warning-subtle p-3 text-xs text-warning-ink">{sector.note}</p>
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
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">Registos de benchmarks</h3>
          <Button size="sm" onClick={() => setModalBenchmark('new')}>
            <Plus size={14} strokeWidth={1.75} className="mr-1" />
            Novo benchmark
          </Button>
        </div>

        <Card>
          {loading ? (
            <Skeleton rows={3} wrapperClassName="space-y-2 p-4 animate-pulse" itemClassName="h-12 rounded-card bg-surface-sunken" />
          ) : benchmarks.length === 0 ? (
            <EmptyState
              title="Sem benchmarks registados ainda"
              description="Regista uma referência interna ou externa (com fonte) para contextualizar os resultados."
              className="border-none"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Fonte</TableHeaderCell>
                    <TableHeaderCell>Ano</TableHeaderCell>
                    <TableHeaderCell>Valor</TableHeaderCell>
                    <TableHeaderCell>Aplicável a</TableHeaderCell>
                    <TableHeaderCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {benchmarks.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => setModalBenchmark(b)}>
                      <TableCell className="text-ink">{b.name}</TableCell>
                      <TableCell>
                        <Badge intent={BENCHMARK_TYPE_INTENTS[b.type] ?? 'neutral'}>
                          {BENCHMARK_TYPE_LABELS[b.type] ?? b.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{b.source}</TableCell>
                      <TableCell>{b.referenceYear}</TableCell>
                      <TableCell>
                        {b.value}
                        {b.unit}
                      </TableCell>
                      <TableCell className="text-xs text-ink-faint">{b.indicatorName ?? '—'}</TableCell>
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
        </Card>
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
