// components/roi-impact/RoiAnalysisTab.tsx
// Tab "ROI da Formação" (docs/roi-impact.md §2): tabela de análises +
// "Nova Análise de ROI". Participantes/custo/benefício vêm resolvidos pelo
// backend a partir da iniciativa de origem — esta tab nunca duplica esses
// valores, só apresenta o que a API devolve.

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
import { NewRoiAnalysisWizard } from './NewRoiAnalysisWizard';
import {
  fmt$,
  INITIATIVE_TYPE_LABELS,
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_INTENTS,
  CONFIDENCE_LABELS,
} from './utils';
import type { RoiAnalysisListData } from './types';

export function RoiAnalysisTab() {
  const notify = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data, isLoading: loading } = useApiQuery<RoiAnalysisListData>(
    queryKeys.roiImpact.analyses(),
    '/roi-impact/analyses',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const approve = useApiMutation(
    (id: number) => apiClient.post(`/roi-impact/analyses/${id}/approve`, { status: 'VALIDADO' }),
    {
      invalidateKeys: [queryKeys.roiImpact.analyses(), queryKeys.roiImpact.executive()],
      onSuccess: () => notify({ title: 'Análise validada', intent: 'success' }),
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

  const analyses = data?.analyses ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {data?.total ?? 0} análise(s) — Quanto custou? O que mudou? Valeu a pena?
        </p>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Nova Análise de ROI
        </Button>
      </div>

      <Card>
        {analyses.length === 0 ? (
          <EmptyState
            title="Sem análises de ROI ainda"
            description="Cria a primeira análise para começar a medir o retorno de uma iniciativa."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Participantes</TableHeaderCell>
                  <TableHeaderCell>Custo total</TableHeaderCell>
                  <TableHeaderCell>Custo/participante</TableHeaderCell>
                  <TableHeaderCell>Benefício realizado</TableHeaderCell>
                  <TableHeaderCell>ROI</TableHeaderCell>
                  <TableHeaderCell>Payback</TableHeaderCell>
                  <TableHeaderCell>Confiança</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-faint">{a.initiative ?? '—'}</p>
                    </TableCell>
                    <TableCell>{INITIATIVE_TYPE_LABELS[a.initiativeType] ?? a.initiativeType}</TableCell>
                    <TableCell>{a.participants}</TableCell>
                    <TableCell>{fmt$(a.totalCost)}</TableCell>
                    <TableCell>{a.costPerParticipant != null ? fmt$(a.costPerParticipant) : '—'}</TableCell>
                    <TableCell>{a.realizedBenefit != null ? fmt$(a.realizedBenefit) : '—'}</TableCell>
                    <TableCell>{a.roiPercent != null ? `${a.roiPercent}%` : '—'}</TableCell>
                    <TableCell>{a.paybackMonths != null ? `${a.paybackMonths}m` : '—'}</TableCell>
                    <TableCell>
                      {a.confidenceLevel ? (CONFIDENCE_LABELS[a.confidenceLevel] ?? a.confidenceLevel) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge intent={ANALYSIS_STATUS_INTENTS[a.status] ?? 'neutral'}>
                        {ANALYSIS_STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.status === 'CALCULADO' && (
                        <Button
                          size="sm"
                          intent="secondary"
                          loading={approve.isPending}
                          onClick={() => approve.mutate(a.id)}
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

      {wizardOpen && <NewRoiAnalysisWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
