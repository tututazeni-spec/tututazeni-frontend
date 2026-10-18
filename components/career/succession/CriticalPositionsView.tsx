// components/career/succession/CriticalPositionsView.tsx
// Lista + detalhe de cargos críticos — Módulo Career, secção 7.
// O detalhe é o "Pipeline de sucessão" (acrescento 4): Posição crítica →
// Sucessor 1 → Sucessor 2 → Sucessor 3, cada um com Prontidão → Match
// (desempenho+potencial+competências, ver calculateMatchScore no backend)
// → Gaps → acção "Gerar PDI" (acrescento 3: plano de preparação do
// sucessor, materializado como DevelopmentPlan origin=SUCCESSION).

'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Crown,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddSuccessorModal } from './AddSuccessorModal';
import { NewCriticalPositionModal } from './NewCriticalPositionModal';
import { SuccessionHistoryPanel } from './SuccessionHistoryPanel';
import {
  BUSINESS_IMPACT_LABEL,
  COVERAGE_LABEL,
  READINESS_LABEL,
  REPLACEMENT_TIME_LABEL,
  RISK_LABEL,
} from './constants';
import type { CriticalPositionEntry } from './types';

const DEV_PLAN_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Pendente de aprovação',
  ACTIVE: 'Em curso',
  PAUSED: 'Em pausa',
  AT_RISK: 'Em risco',
  COMPLETED: 'Concluído',
  PARTIALLY_COMPLETED: 'Parcialmente concluído',
  CANCELLED: 'Cancelado',
  OVERDUE: 'Atrasado',
};

function ScoreBar({
  label,
  value,
  color,
  tint,
}: {
  label: string;
  value: number | null;
  color: string;
  tint: string;
}) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: tint }}>
      <div className="mb-1 flex items-center justify-between font-body text-xs font-semibold text-[#0F1F3D]">
        <span>{label}</span>
        <span style={{ color }}>
          {value === null ? '—' : `${Math.round(value)}%`}
        </span>
      </div>
      <ProgressBar
        value={value ?? 0}
        color={color}
        className="h-1.5 bg-white"
      />
    </div>
  );
}

// Cores de estado do card ROI Total (verde / âmbar / vermelho).
const RISK_COLOR: Record<string, string> = {
  LOW: '#34D399',
  MEDIUM: '#FBBF24',
  HIGH: '#F87171',
  CRITICAL: '#F87171',
};

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
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [showAddSuccessor, setShowAddSuccessor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
    (successionPlanId: number) =>
      apiClient.post('/succession/pdi/generate', { successionPlanId }),
    {
      onSuccess: () => {
        notify({
          title: 'PDI de preparação gerado com sucesso',
          intent: 'success',
        });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const deletePosition = useApiMutation(
    (id: number) => apiClient.delete(`/succession/critical-positions/${id}`),
    {
      invalidateKeys: [
        queryKeys.succession.criticalPositions(),
        queryKeys.succession.dashboard(),
      ],
      onSuccess: () => {
        setSelectedId(null);
        setShowHistory(false);
        notify({ title: 'Posição crítica apagada', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleDelete = async (cp: CriticalPositionEntry) => {
    const n = cp.successionPlans?.length ?? cp._count?.successionPlans ?? 0;
    const extra =
      n === 0
        ? ''
        : n === 1
          ? ' O plano de sucessão associado também será apagado.'
          : ` Os ${n} planos de sucessão associados também serão apagados.`;
    const ok = await confirm({
      title: 'Apagar posição crítica',
      message: `Tem a certeza que quer remover "${cp.position.name}" das posições críticas?${extra}`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) deletePosition.mutate(cp.id);
  };

  const refresh = () => {
    refetchList();
    if (selectedId !== null) refetchDetail();
  };

  const handleGeneratePdi = async (successionPlanId: number) => {
    setGeneratingPdiFor(successionPlanId);
    try {
      await generatePdi.mutateAsync(successionPlanId);
      refetchDetail();
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
        <div className="grid grid-cols-[300px_1fr] gap-5">
          <div className="space-y-2">
            {positions.map((cp) => (
              <div
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
                  'cursor-pointer rounded-[18px] border p-4 shadow-[0_8px_24px_rgba(15,31,61,0.25)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50',
                  'border-transparent bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] text-white',
                  selectedId === cp.id && 'ring-2 ring-[#0D6EFD] ring-offset-2',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#075FE8]"
                  >
                    <Crown
                      size={18}
                      strokeWidth={1.75}
                      fill="#FFFFFF"
                      stroke="#0F1F3D"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="break-words font-body text-sm font-semibold leading-snug">
                      {cp.position.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 font-body text-xs opacity-70">
                      <span className="truncate">
                        {cp.position.users?.[0]?.fullName ?? 'Sem titular'}
                      </span>
                      <span className="shrink-0">
                        {cp._count.successionPlans} sucessor(es)
                      </span>
                    </div>
                  </div>
                  <span
                    className="flex shrink-0 items-center gap-1.5 font-display text-xs font-semibold"
                    style={{ color: RISK_COLOR[cp.exitRisk] }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: RISK_COLOR[cp.exitRisk] }}
                    />
                    {RISK_LABEL[cp.exitRisk]}
                  </span>
                </div>
                <div className="mt-2 rounded-card bg-white/10 px-3 py-1 font-body text-xs text-white/80">
                  {COVERAGE_LABEL[cp.coverageStatus]}
                </div>
                {cp.alert && (
                  <div className="mt-2 rounded-lg bg-warning-subtle px-2 py-1 font-body text-xs text-warning-ink">
                    {cp.alert}
                  </div>
                )}
              </div>
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
              <div className="overflow-hidden rounded-[18px] border border-[#D6E4F5] bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
                <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] px-6 py-4 text-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <Crown size={20} strokeWidth={1.75} />
                      <h3 className="break-words font-body text-sm font-semibold uppercase tracking-wider">
                        {detail.position.name}
                      </h3>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-xs text-white/85">
                      <span>
                        Titular:{' '}
                        {detail.position.users?.[0]?.fullName ?? 'Sem titular'}
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                        Risco {RISK_LABEL[detail.exitRisk]}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={deletePosition.isPending}
                    onClick={() => handleDelete(detail)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> Apagar
                  </button>
                </div>
                <div className="p-6">
                  <div className="mt-3 grid grid-cols-2 gap-3 font-body text-xs">
                    <div className="rounded-control bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-3 text-white">
                      <div className="text-white/80">Impacto no negócio</div>
                      <div className="font-semibold text-white">
                        {BUSINESS_IMPACT_LABEL[detail.businessImpact]}
                      </div>
                    </div>
                    <div className="rounded-control bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-3 text-white">
                      <div className="text-white/80">Tempo de substituição</div>
                      <div className="font-semibold text-white">
                        {REPLACEMENT_TIME_LABEL[detail.replacementTime]}
                      </div>
                    </div>
                  </div>

                  {detail.criticalReason && (
                    <p className="mt-3 font-body text-xs text-ink-muted">
                      {detail.criticalReason}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-2.5 rounded-t-[14px] bg-[#0F1F3D]/60 px-4 py-2.5 text-white">
                    <span className="font-body text-sm font-semibold uppercase tracking-wider">
                      Pipeline de Sucessão
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddSuccessor(true)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <Plus size={14} strokeWidth={1.75} /> Adicionar Sucessor
                    </button>
                  </div>

                  {detail.successionPlans.length === 0 ? (
                    <div className="rounded-b-[14px] border border-t-0 border-[#D6E4F5] p-4 text-center font-body text-xs text-ink-faint">
                      Sem sucessores identificados
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-b-[14px] border border-t-0 border-[#D6E4F5] bg-[#E8F0FE]/40 p-3">
                      {detail.successionPlans.map((sp) => (
                        <div
                          key={sp.id}
                          className="overflow-hidden rounded-[14px] border border-[#D6E4F5] bg-white"
                        >
                          <div className="flex items-center gap-3 bg-[#0F1F3D]/60 px-4 py-2.5 text-white">
                            <Avatar
                              name={sp.candidate.fullName}
                              url={sp.candidate.avatarUrl ?? undefined}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-body text-sm font-semibold">
                                {sp.candidate.fullName}
                              </div>
                              <div className="font-body text-xs text-white/80">
                                {sp.candidate.position?.name ?? '—'}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 font-body text-xs font-semibold">
                              {PRIORITY_LABEL[sp.priority] ?? sp.priority}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="min-w-0 flex-1">
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
                                  <span className="text-warning">
                                    Indisponível
                                  </span>
                                )}
                                {sp.geographicMobility && (
                                  <span className="text-ink-faint">
                                    Mobilidade geográfica
                                  </span>
                                )}
                                {sp.readinessByDate && (
                                  <span className="text-ink-faint">
                                    Prontidão prevista:{' '}
                                    {new Date(
                                      sp.readinessByDate,
                                    ).toLocaleDateString('pt-AO', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>

                              {/* Acrescento 4: Desempenho → Potencial → Competências → Gaps */}
                              {sp.matchDetails && (
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                  <ScoreBar
                                    label="Desempenho"
                                    value={sp.matchDetails.perfScore}
                                    color="#0D6EFD"
                                    tint="#E8F0FE"
                                  />
                                  <ScoreBar
                                    label="Potencial"
                                    value={sp.matchDetails.potentialScore}
                                    color="#7C3AED"
                                    tint="#F1EAFE"
                                  />
                                  <ScoreBar
                                    label="Competências"
                                    value={sp.matchDetails.compScore}
                                    color="#0E9F6E"
                                    tint="#E3F6EE"
                                  />
                                </div>
                              )}
                              {sp.matchDetails &&
                                sp.matchDetails.gaps.length > 0 && (
                                  <div className="mt-2 font-body text-xs text-warning-ink">
                                    {sp.matchDetails.gaps.length} lacuna(s) de
                                    competência face ao cargo
                                  </div>
                                )}

                              {/* Acrescento 3: plano de preparação do sucessor */}
                              <div className="mt-3">
                                {sp.developmentPlan ? (
                                  <div className="rounded-control bg-surface p-2">
                                    <div className="mb-1 flex items-center justify-between font-body text-xs">
                                      <span className="font-medium text-ink">
                                        Plano de preparação:{' '}
                                        {DEV_PLAN_STATUS_LABEL[
                                          sp.developmentPlan.status
                                        ] ?? sp.developmentPlan.status}
                                      </span>
                                      <span className="text-ink-faint">
                                        {sp.developmentPlan.overallProgress}%
                                      </span>
                                    </div>
                                    <ProgressBar
                                      value={sp.developmentPlan.overallProgress}
                                      className="h-1.5"
                                    />
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    intent="ghost"
                                    onClick={() => handleGeneratePdi(sp.id)}
                                    loading={generatingPdiFor === sp.id}
                                  >
                                    <Sparkles size={13} strokeWidth={1.75} />{' '}
                                    Gerar PDI de preparação
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 font-body text-xs text-ink-faint">
                    <ClipboardList size={13} strokeWidth={1.75} />
                    Mínimo de {detail.minSuccessorsRequired} sucessor(es)
                    requerido(s) para cobertura completa.
                  </div>

                  <div className="mt-4 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setShowHistory((v) => !v)}
                      className="flex items-center gap-1.5 font-body text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      {showHistory ? (
                        <ChevronUp size={14} strokeWidth={1.75} />
                      ) : (
                        <ChevronDown size={14} strokeWidth={1.75} />
                      )}
                      Histórico de sucessão
                    </button>
                    {showHistory && (
                      <div className="mt-3">
                        <SuccessionHistoryPanel
                          criticalPositionId={detail.id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
