// components/roi-impact/CorrelationsTab.tsx
// Tab "Correlações" (docs/roi-impact.md §7): as 7 análises predefinidas no
// spec, cada uma calculada a partir de dados reais de outros módulos (nunca
// inventados). Aba analítica e de apoio à decisão — nunca alimenta
// automações sem validação humana.

'use client';

import { useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
import { NewCorrelationModal } from './NewCorrelationModal';
import { CorrelationDetailModal } from './CorrelationDetailModal';
import { CorrelationAnalysisCard } from './CorrelationAnalysisCard';
import { correlationStrengthLabel } from './utils';
import type {
  CorrelationDefinition,
  CorrelationListData,
  CorrelationRow,
  CorrelationType,
} from './types';

function fmtDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('pt-PT') : '—';
}

export function CorrelationsTab() {
  const notify = useToast();
  const [modalType, setModalType] = useState<CorrelationType | 'new' | null>(
    null,
  );
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: definitions, isLoading: loadingDefs } = useApiQuery<
    CorrelationDefinition[]
  >(
    queryKeys.roiImpact.correlationDefinitions(),
    '/roi-impact/correlations/definitions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data, isLoading: loadingHistory } = useApiQuery<CorrelationListData>(
    queryKeys.roiImpact.correlations(),
    '/roi-impact/correlations',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/correlations/${id}`),
    {
      invalidateKeys: [queryKeys.roiImpact.correlations()],
      onSuccess: () =>
        notify({ title: 'Correlação removida', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao remover',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const correlations = data?.correlations ?? [];
  const latestByType = new Map<CorrelationType, CorrelationRow>();
  for (const c of correlations) {
    const prev = latestByType.get(c.type);
    if (!prev || c.createdAt > prev.createdAt) latestByType.set(c.type, c);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-body text-sm text-ink-muted">
          Explora relações estatísticas entre investimento em desenvolvimento e
          resultados de negócio, sem inventar causalidade onde não existe.
        </p>
        <Button size="sm" onClick={() => setModalType('new')}>
          Nova Análise
        </Button>
      </div>

      <AlertCard
        variant="warning"
        title="Correlação não implica causalidade"
        message="Leitura interpretativa, nunca automática. Esta aba não deve alimentar automações (módulo Automations) sem validação humana."
      />

      <Card>
        <div className="rounded-t-panel bg-brand/60 px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Análises disponíveis
          </h4>
        </div>
        {loadingDefs ? (
          <Skeleton
            rows={3}
            wrapperClassName="space-y-3 p-4"
            itemClassName="h-12 rounded-card bg-surface-sunken"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {(definitions ?? []).map((d) => (
              <CorrelationAnalysisCard
                key={d.type}
                definition={d}
                latest={latestByType.get(d.type)}
                onRun={() => setModalType(d.type)}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand/65 via-brand-mid/65 to-brand-dark/65 pb-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Histórico de análises
          </h4>
        </div>
        <div className="mx-4 rounded-card bg-surface p-4 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_th]:px-2 [&_th]:text-micro">
          {loadingHistory ? (
            <Skeleton
              rows={4}
              wrapperClassName="space-y-3 p-4"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          ) : correlations.length === 0 ? (
            <EmptyState
              title="Sem análises executadas ainda"
              description="Executa a primeira análise de correlação para começar o histórico."
              className="border-none"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead className="bg-brand/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHeaderCell className="text-white">
                      Análise
                    </TableHeaderCell>
                    <TableHeaderCell className="text-white">
                      Período
                    </TableHeaderCell>
                    <TableHeaderCell className="text-white">
                      Amostra
                    </TableHeaderCell>
                    <TableHeaderCell className="text-white">
                      Coeficiente
                    </TableHeaderCell>
                    <TableHeaderCell className="text-white">
                      Significância
                    </TableHeaderCell>
                    <TableHeaderCell className="text-white" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {correlations.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(c.id)}
                    >
                      <TableCell>
                        <p className="text-ink">{c.label}</p>
                        <p className="text-xs text-ink-faint">
                          {fmtDate(c.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        {fmtDate(c.periodStart)} — {fmtDate(c.periodEnd)}
                      </TableCell>
                      <TableCell>{c.sampleSize}</TableCell>
                      <TableCell>
                        {c.coefficient != null ? (
                          <span>
                            {c.coefficient}{' '}
                            <span className="text-xs text-ink-faint">
                              ({correlationStrengthLabel(c.coefficient)})
                            </span>
                          </span>
                        ) : (
                          <Badge intent="warning">Dados insuficientes</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.pValue != null ? (
                          <Badge intent={c.significant ? 'success' : 'neutral'}>
                            p = {c.pValue}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            intent="secondary"
                            onClick={() => setDetailId(c.id)}
                          >
                            <ChevronRight size={14} strokeWidth={1.75} />
                          </Button>
                          <Button
                            size="sm"
                            intent="secondary"
                            loading={remove.isPending}
                            onClick={() => remove.mutate(c.id)}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {modalType && (
        <NewCorrelationModal
          initialType={modalType === 'new' ? undefined : modalType}
          onClose={() => setModalType(null)}
        />
      )}
      {detailId != null && (
        <CorrelationDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
