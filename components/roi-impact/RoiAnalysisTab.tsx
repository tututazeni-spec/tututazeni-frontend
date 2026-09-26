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
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
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
        <div className="p-5">
          <DataTable
            data={analyses}
            rowKey={(a) => a.id}
            searchKeys={['name']}
            searchPlaceholder="Pesquisar iniciativa…"
            emptyLabel="Cria a primeira análise para começar a medir o retorno de uma iniciativa."
            columns={[
              {
                key: 'name',
                header: 'Iniciativa',
                sortable: true,
                render: (a) => (
                  <>
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink-faint">{a.initiative ?? '—'}</p>
                  </>
                ),
              },
              {
                key: 'initiativeType',
                header: 'Tipo',
                render: (a) => INITIATIVE_TYPE_LABELS[a.initiativeType] ?? a.initiativeType,
              },
              { key: 'participants', header: 'Participantes', sortable: true },
              { key: 'totalCost', header: 'Custo total', sortable: true, render: (a) => fmt$(a.totalCost) },
              {
                key: 'costPerParticipant',
                header: 'Custo/participante',
                sortable: true,
                render: (a) => (a.costPerParticipant != null ? fmt$(a.costPerParticipant) : '—'),
              },
              {
                key: 'realizedBenefit',
                header: 'Benefício realizado',
                sortable: true,
                render: (a) => (a.realizedBenefit != null ? fmt$(a.realizedBenefit) : '—'),
              },
              {
                key: 'roiPercent',
                header: 'ROI',
                sortable: true,
                render: (a) => (a.roiPercent != null ? `${a.roiPercent}%` : '—'),
              },
              {
                key: 'paybackMonths',
                header: 'Payback',
                sortable: true,
                render: (a) => (a.paybackMonths != null ? `${a.paybackMonths}m` : '—'),
              },
              {
                key: 'confidenceLevel',
                header: 'Confiança',
                render: (a) => (a.confidenceLevel ? (CONFIDENCE_LABELS[a.confidenceLevel] ?? a.confidenceLevel) : '—'),
              },
              {
                key: 'status',
                header: 'Estado',
                sortable: true,
                render: (a) => (
                  <Badge intent={ANALYSIS_STATUS_INTENTS[a.status] ?? 'neutral'}>
                    {ANALYSIS_STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (a) =>
                  a.status === 'CALCULADO' && (
                    <Button size="sm" intent="secondary" loading={approve.isPending} onClick={() => approve.mutate(a.id)}>
                      Validar
                    </Button>
                  ),
              },
            ]}
          />
        </div>
      </Card>

      {wizardOpen && <NewRoiAnalysisWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
