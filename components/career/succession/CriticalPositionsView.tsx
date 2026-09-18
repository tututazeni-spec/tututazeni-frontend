// components/career/succession/CriticalPositionsView.tsx
// Lista + detalhe de cargos críticos — Módulo Career, secção 7.
// O detalhe é o "Pipeline de sucessão" (acrescento 4): Posição crítica →
// Sucessor 1 → Sucessor 2 → Sucessor 3, cada um com Prontidão → Match
// (desempenho+potencial+competências, ver calculateMatchScore no backend)
// → Gaps → acção "Gerar PDI" (acrescento 3: plano de preparação do
// sucessor, materializado como DevelopmentPlan origin=SUCCESSION).

'use client';

import { useState } from 'react';
import { ClipboardList, Plus, Sparkles } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddSuccessorModal } from './AddSuccessorModal';
import { NewCriticalPositionModal } from './NewCriticalPositionModal';
import {
  BUSINESS_IMPACT_LABEL,
  COVERAGE_LABEL,
  READINESS_LABEL,
  REPLACEMENT_TIME_LABEL,
  RISK_INTENT,
  RISK_LABEL,
} from './constants';
import type { CriticalPositionEntry } from './types';

const PRIORITY_LABEL: Record<string, string> = {
  PRIMARY: '1º sucessor',
  SECONDARY: '2º sucessor',
  TERTIARY: '3º sucessor',
};

interface CriticalPositionListResponse {
  data: CriticalPositionEntry[];
  total: number;
}

export function CriticalPositionsView() {
  const notify = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [showAddSuccessor, setShowAddSuccessor] = useState(false);
  const [generatingPdiFor, setGeneratingPdiFor] = useState<number | null>(null);

  const {
    data: listResp,
    isLoading: listLoading,
    refetch: refetchList,
  } = useApiQuery<CriticalPositionListResponse>(
    queryKeys.succession.criticalPositions(),
    '/succession/critical-positions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const positions = listResp?.data ?? [];

  const {
    data: detail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = useApiQuery<CriticalPositionEntry>(
    queryKeys.succession.criticalPosition(selectedId ?? 0),
    `/succession/critical-positions/${selectedId}`,
    { enabled: selectedId !== null, staleTime: STALE_TIME.DYNAMIC },
  );

  const generatePdi = useApiMutation(
    (successionPlanId: number) => apiClient.post('/succession/pdi/generate', { successionPlanId }),
    {
      onSuccess: () => {
        notify({ title: 'PDI de preparação gerado com sucesso', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const refresh = () => {
    refetchList();
    if (selectedId !== null) refetchDetail();
  };

  const handleGeneratePdi = async (successionPlanId: number) => {
    setGeneratingPdiFor(successionPlanId);
    try {
      await generatePdi.mutateAsync(successionPlanId);
    } finally {
      setGeneratingPdiFor(null);
    }
  };

  if (listLoading) return <Skeleton rows={4} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setShowNewPosition(true)}>
          <Plus size={14} strokeWidth={1.75} /> Nova Posição Crítica
        </Button>
      </div>

      {positions.length === 0 ? (
        <EmptyState
          title="Sem cargos críticos"
          description="Classifica um cargo como crítico para começar a mapear a sucessão."
        />
      ) : (
        <div className="grid grid-cols-[340px_1fr] gap-5">
          <div className="space-y-2">
            {positions.map((cp) => (
              <Card
                key={cp.id}
                onClick={() => setSelectedId(cp.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(cp.id);
                  }
                }}
                className={cn(
                  'cursor-pointer p-4 transition-shadow duration-150 hover:shadow-hover',
                  selectedId === cp.id && 'border-primary bg-primary-subtle',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm font-semibold text-ink">
                      {cp.position.name}
                    </div>
                    <div className="mt-0.5 font-body text-xs text-ink-faint">
                      {cp.position.users?.[0]?.fullName ?? 'Sem titular'}
                    </div>
                  </div>
                  <Badge intent={RISK_INTENT[cp.exitRisk]}>{RISK_LABEL[cp.exitRisk]}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between font-body text-xs text-ink-faint">
                  <span>{COVERAGE_LABEL[cp.coverageStatus]}</span>
                  <span>{cp._count.successionPlans} sucessor(es)</span>
                </div>
                {cp.alert && (
                  <div className="mt-2 rounded-control bg-warning-subtle px-2 py-1 font-body text-xs text-warning-ink">
                    {cp.alert}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div>
            {selectedId === null ? (
              <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
                Selecciona um cargo crítico
              </div>
            ) : detailLoading || !detail ? (
              <Skeleton rows={4} />
            ) : (
              <Card className="p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-lg font-bold text-ink">
                      {detail.position.name}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      Titular: {detail.position.users?.[0]?.fullName ?? 'Sem titular'}
                    </div>
                  </div>
                  <Badge intent={RISK_INTENT[detail.exitRisk]}>
                    Risco {RISK_LABEL[detail.exitRisk]}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 font-body text-xs">
                  <div className="rounded-control bg-surface-sunken p-2">
                    <div className="text-ink-faint">Impacto no negócio</div>
                    <div className="font-semibold text-ink">
                      {BUSINESS_IMPACT_LABEL[detail.businessImpact]}
                    </div>
                  </div>
                  <div className="rounded-control bg-surface-sunken p-2">
                    <div className="text-ink-faint">Tempo de substituição</div>
                    <div className="font-semibold text-ink">
                      {REPLACEMENT_TIME_LABEL[detail.replacementTime]}
                    </div>
                  </div>
                </div>

                {detail.criticalReason && (
                  <p className="mt-3 font-body text-xs text-ink-muted">{detail.criticalReason}</p>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-body text-sm font-semibold text-ink">
                    Pipeline de Sucessão
                  </span>
                  <Button size="sm" intent="secondary" onClick={() => setShowAddSuccessor(true)}>
                    <Plus size={14} strokeWidth={1.75} /> Adicionar Sucessor
                  </Button>
                </div>

                {detail.successionPlans.length === 0 ? (
                  <div className="mt-3 rounded-card border border-dashed border-border-strong p-4 text-center font-body text-xs text-ink-faint">
                    Sem sucessores identificados
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {detail.successionPlans.map((sp) => (
                      <div key={sp.id} className="flex items-start gap-3 rounded-card bg-surface-sunken p-3">
                        <Avatar name={sp.candidate.fullName} url={sp.candidate.avatarUrl ?? undefined} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-body text-sm font-medium text-ink">
                              {sp.candidate.fullName}
                            </span>
                            <Badge intent="neutral">{PRIORITY_LABEL[sp.priority] ?? sp.priority}</Badge>
                          </div>
                          <div className="mt-0.5 font-body text-xs text-ink-faint">
                            {sp.candidate.position?.name ?? '—'}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 font-body text-xs">
                            <span className="text-ink-muted">
                              {READINESS_LABEL[sp.readinessLevel]}
                            </span>
                            {sp.matchScore !== null && (
                              <span className="font-semibold text-primary">
                                {sp.matchScore}% match
                              </span>
                            )}
                            {!sp.available && (
                              <span className="text-warning">Indisponível</span>
                            )}
                          </div>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              intent="ghost"
                              onClick={() => handleGeneratePdi(sp.id)}
                              loading={generatingPdiFor === sp.id}
                            >
                              <Sparkles size={13} strokeWidth={1.75} /> Gerar PDI de preparação
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 font-body text-xs text-ink-faint">
                  <ClipboardList size={13} strokeWidth={1.75} />
                  Mínimo de {detail.minSuccessorsRequired} sucessor(es) requerido(s) para cobertura
                  completa.
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {showNewPosition && (
        <NewCriticalPositionModal
          onClose={() => setShowNewPosition(false)}
          onSuccess={() => refresh()}
        />
      )}
      {showAddSuccessor && selectedId !== null && (
        <AddSuccessorModal
          criticalPositionId={selectedId}
          onClose={() => setShowAddSuccessor(false)}
          onSuccess={() => refresh()}
        />
      )}
    </div>
  );
}
