// components/roi-impact/ScenariosTab.tsx
// Tab "Cenários & Simulações" (docs/roi-impact.md §8): simula o impacto
// financeiro de decisões futuras de investimento em desenvolvimento — cada
// cenário guarda a sua própria projecção Otimista/Realista/Pessimista, e
// dois ou mais podem ser comparados lado a lado (mesmo formato do exemplo
// do spec: "Cenário A" vs. "Cenário B").

'use client';

import { useState } from 'react';
import { ChevronRight, GitCompareArrows, Trash2 } from 'lucide-react';
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
import { NewScenarioModal } from './NewScenarioModal';
import { ScenarioDetailModal } from './ScenarioDetailModal';
import { ScenarioCompareModal } from './ScenarioCompareModal';
import { fmt$, INITIATIVE_TYPE_LABELS } from './utils';
import type { ScenarioListData } from './types';

export function ScenariosTab() {
  const notify = useToast();
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);

  const { data, isLoading } = useApiQuery<ScenarioListData>(
    queryKeys.roiImpact.scenarios(),
    '/roi-impact/scenarios',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation((id: number) => apiClient.delete(`/roi-impact/scenarios/${id}`), {
    invalidateKeys: [queryKeys.roiImpact.scenarios()],
    onSuccess: () => notify({ title: 'Cenário removido', intent: 'success' }),
    onError: (e) => notify({ title: 'Erro ao remover', description: e.message, intent: 'danger' }),
  });

  const scenarios = data?.scenarios ?? [];

  const toggleSelected = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-body text-sm text-ink-muted">
          Simula o impacto financeiro de decisões futuras de investimento em desenvolvimento —
          cada cenário projecta os casos Otimista, Realista e Pessimista.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            intent="secondary"
            disabled={selected.length < 2}
            onClick={() => setComparing(true)}
          >
            <GitCompareArrows size={14} strokeWidth={1.75} className="mr-1" />
            Comparar ({selected.length})
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)}>
            Novo Cenário
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton rows={4} wrapperClassName="space-y-3 p-4 animate-pulse" itemClassName="h-12 rounded-card bg-surface-sunken" />
        ) : scenarios.length === 0 ? (
          <EmptyState
            title="Sem cenários simulados ainda"
            description="Cria o primeiro cenário para projectar o ROI de uma iniciativa futura."
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-8" />
                  <TableHeaderCell>Cenário</TableHeaderCell>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Público-alvo</TableHeaderCell>
                  <TableHeaderCell>Custo estimado</TableHeaderCell>
                  <TableHeaderCell>ROI projectado</TableHeaderCell>
                  <TableHeaderCell>Payback</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {scenarios.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetailId(s.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleSelected(s.id)}
                        aria-label={`Selecionar ${s.name} para comparação`}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-ink">{s.name}</p>
                      {s.targetAudienceCount != null && (
                        <p className="text-xs text-ink-faint">{s.targetAudienceCount} colaboradores</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {INITIATIVE_TYPE_LABELS[s.initiativeType] ?? s.initiativeType}
                    </TableCell>
                    <TableCell>{s.targetAudienceCount ?? '—'}</TableCell>
                    <TableCell>{fmt$(s.estimatedCost)}</TableCell>
                    <TableCell>
                      {s.roiPercent != null ? (
                        <span className="font-semibold text-ink">{s.roiPercent}%</span>
                      ) : (
                        <Badge intent="warning">Sem projecção</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.paybackMonths != null ? `${s.paybackMonths} meses` : '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button size="sm" intent="secondary" onClick={() => setDetailId(s.id)}>
                          <ChevronRight size={14} strokeWidth={1.75} />
                        </Button>
                        <Button
                          size="sm"
                          intent="secondary"
                          loading={remove.isPending}
                          onClick={() => remove.mutate(s.id)}
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
      </Card>

      {showNew && <NewScenarioModal onClose={() => setShowNew(false)} />}
      {detailId != null && <ScenarioDetailModal id={detailId} onClose={() => setDetailId(null)} />}
      {comparing && (
        <ScenarioCompareModal ids={selected} onClose={() => setComparing(false)} />
      )}
    </div>
  );
}
