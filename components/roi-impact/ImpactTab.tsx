// components/roi-impact/ImpactTab.tsx
// Tab "Impacto no Negócio" (docs/roi-impact.md §3): categorias de impacto +
// tabela + "Novo Registo de Impacto". Participantes/iniciativa vêm
// resolvidos pelo backend a partir da origem — esta tab nunca duplica esses
// valores, só apresenta o que a API devolve.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
import { NewImpactRecordModal } from './NewImpactRecordModal';
import { INITIATIVE_TYPE_LABELS, IMPACT_CATEGORY_LABELS, IMPACT_SUBJECT_TYPE_LABELS } from './utils';
import type { ImpactCategorySummaryRow, ImpactRecordListData } from './types';

export function ImpactTab() {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading: loading } = useApiQuery<ImpactRecordListData>(
    queryKeys.roiImpact.impactRecords(),
    '/roi-impact/impact-records',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: byCategory } = useApiQuery<ImpactCategorySummaryRow[]>(
    queryKeys.roiImpact.impactByCategory(),
    '/roi-impact/impact-records/by-category',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const validate = useApiMutation(
    (id: number) =>
      apiClient.post(`/roi-impact/impact-records/${id}/validate`, { validatedById: me?.id }),
    {
      invalidateKeys: [queryKeys.roiImpact.impactRecords(), queryKeys.roiImpact.impactByCategory()],
      onSuccess: () => notify({ title: 'Registo validado', intent: 'success' }),
      onError: (e) => notify({ title: 'Erro ao validar', description: e.message, intent: 'danger' }),
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

  const records = data?.records ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {data?.total ?? 0} registo(s) — liga iniciativas de RH/Academia a indicadores de negócio reais
        </p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo Registo de Impacto
        </Button>
      </div>

      {(byCategory?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {byCategory!.map((c) => (
            <Card key={c.category}>
              <CardBody>
                <p className="font-display text-xl font-bold text-ink">{c.count}</p>
                <p className="font-body text-[10px] text-ink-faint">
                  {IMPACT_CATEGORY_LABELS[c.category] ?? c.category}
                </p>
                <p className="mt-1 font-body text-[10px] text-ink-faint">
                  {c.avgAttributionPercent != null ? `${c.avgAttributionPercent}% atribuição média` : '—'}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        {records.length === 0 ? (
          <EmptyState
            title="Sem registos de impacto ainda"
            description="Cria o primeiro registo para ligar uma iniciativa a um indicador de negócio real."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Sujeito</TableHeaderCell>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Indicador</TableHeaderCell>
                  <TableHeaderCell>Antes</TableHeaderCell>
                  <TableHeaderCell>Depois</TableHeaderCell>
                  <TableHeaderCell>Variação</TableHeaderCell>
                  <TableHeaderCell>Atribuição</TableHeaderCell>
                  <TableHeaderCell>Impacto atribuído</TableHeaderCell>
                  <TableHeaderCell>Validado</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-ink">{r.subjectLabel ?? '—'}</p>
                      <p className="text-xs text-ink-faint">
                        {IMPACT_SUBJECT_TYPE_LABELS[r.subjectType] ?? r.subjectType}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-ink">{r.initiative ?? '—'}</p>
                      <p className="text-xs text-ink-faint">
                        {INITIATIVE_TYPE_LABELS[r.initiativeType] ?? r.initiativeType}
                      </p>
                    </TableCell>
                    <TableCell>{IMPACT_CATEGORY_LABELS[r.category] ?? r.category}</TableCell>
                    <TableCell>{r.indicatorName}</TableCell>
                    <TableCell>{r.valueBefore ?? '—'}</TableCell>
                    <TableCell>{r.valueAfter ?? '—'}</TableCell>
                    <TableCell>{r.variation != null ? r.variation : '—'}</TableCell>
                    <TableCell>{r.attributionPercent != null ? `${r.attributionPercent}%` : '—'}</TableCell>
                    <TableCell>{r.attributedImpact != null ? r.attributedImpact : '—'}</TableCell>
                    <TableCell>
                      <Badge intent={r.validatedById ? 'success' : 'neutral'}>
                        {r.validatedById ? 'Validado' : 'Por validar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!r.validatedById && (
                        <Button
                          size="sm"
                          intent="secondary"
                          loading={validate.isPending}
                          onClick={() => validate.mutate(r.id)}
                        >
                          Validar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {modalOpen && <NewImpactRecordModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
