// components/evaluation/FormalEvaluationsTab.tsx
// Separador "Avaliações Formais" do módulo evaluation — não confundir com
// os separadores Ciclos/Resultados/Análises/Calibração (backend
// src/evaluation, 360°): este fala com src/assessments (type=EXAM).
//
// ADMIN, RH, GESTOR, INSTRUCTOR, DIRECTOR, LIDER (EVAL_CREATOR_ROLES): criam,
// publicam/arquivam/duplicam/eliminam e vêem os resultados totais.
// COLABORADOR, AUDITOR: só vêem e participam (FormalEvaluationsParticipantView).

'use client';

import { useState } from 'react';
import { BarChart3, ClipboardList, Copy, Plus, Timer, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/assessments/Skeleton';
import { CreateFormalEvaluationModal } from './CreateFormalEvaluationModal';
import { FormalEvaluationResultsPanel } from './FormalEvaluationResultsPanel';
import { FormalEvaluationsParticipantView } from './FormalEvaluationsParticipantView';
import type { FormalEvaluation } from './formalEvaluationTypes';

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

function ManagementView() {
  const notify = useToast();
  const confirm = useConfirm();
  const [showCreate, setShowCreate] = useState(false);
  const [resultsId, setResultsId] = useState<number | null>(null);

  const { data, isLoading } = useApiQuery<FormalEvaluation[]>(
    queryKeys.formalEvaluations.list(),
    '/assessments',
    { params: { type: 'EXAM' } },
  );
  const evaluations = data ?? [];

  const invalidate = [queryKeys.formalEvaluations.list()];
  const publish = useApiMutation(
    (id: number) => apiClient.patch(`/assessments/${id}/publish`),
    { invalidateKeys: invalidate, onSuccess: () => notify({ title: 'Avaliação publicada', intent: 'success' }) },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/assessments/${id}/archive`),
    { invalidateKeys: invalidate, onSuccess: () => notify({ title: 'Avaliação arquivada', intent: 'success' }) },
  );
  const duplicate = useApiMutation(
    (id: number) => apiClient.post(`/assessments/${id}/duplicate`),
    { invalidateKeys: invalidate, onSuccess: () => notify({ title: 'Avaliação duplicada', intent: 'success' }) },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/assessments/${id}`),
    { invalidateKeys: invalidate, onSuccess: () => notify({ title: 'Avaliação eliminada', intent: 'success' }) },
  );

  const handleRemove = async (evaluation: FormalEvaluation) => {
    const ok = await confirm({
      title: 'Eliminar avaliação',
      message: `Tens a certeza que queres eliminar "${evaluation.title}"?`,
      destructive: true,
    });
    if (ok) remove.mutate(evaluation.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Nova Avaliação
        </Button>
      </div>

      {isLoading && <Skeleton />}

      {!isLoading && evaluations.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Sem avaliações formais"
          description="Cria a primeira avaliação para um departamento específico ou para todos."
          action={{ label: 'Nova Avaliação', onClick: () => setShowCreate(true) }}
        />
      )}

      <div className="space-y-3">
        {evaluations.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-4 rounded-card border border-border bg-surface p-5"
          >
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2 text-sm font-semibold text-ink">
                {e.title}
                <Badge intent={STATUS_INTENT[e.status]}>{e.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                <span>{e._count.questions} perguntas</span>
                <span>{e._count.attempts} tentativas</span>
                <span>
                  {e.targetDepartmentIds.length === 0
                    ? 'Todos os departamentos'
                    : `${e.targetDepartmentIds.length} departamento(s)`}
                </span>
                {e.availableUntil && (
                  <span className="inline-flex items-center gap-1">
                    <Timer size={12} strokeWidth={1.75} />
                    Até {new Date(e.availableUntil).toLocaleString('pt-PT')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {e.status !== 'DRAFT' && (
                <Button intent="secondary" size="sm" onClick={() => setResultsId(e.id)}>
                  <BarChart3 size={14} strokeWidth={1.75} />
                  Resultados
                </Button>
              )}
              {e.status === 'DRAFT' && (
                <Button size="sm" onClick={() => publish.mutate(e.id)} loading={publish.isPending}>
                  Publicar
                </Button>
              )}
              {e.status === 'PUBLISHED' && (
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => archive.mutate(e.id)}
                  loading={archive.isPending}
                >
                  Arquivar
                </Button>
              )}
              <button
                type="button"
                onClick={() => duplicate.mutate(e.id)}
                aria-label="Duplicar"
                className="text-ink-faint hover:text-ink"
              >
                <Copy size={16} strokeWidth={1.75} />
              </button>
              {e.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleRemove(e)}
                  aria-label="Eliminar"
                  className="text-ink-faint hover:text-danger"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateFormalEvaluationModal onClose={() => setShowCreate(false)} />}
      {resultsId !== null && (
        <FormalEvaluationResultsPanel assessmentId={resultsId} onClose={() => setResultsId(null)} />
      )}
    </div>
  );
}

export function FormalEvaluationsTab() {
  const role = useCurrentRole();
  const isCreator = !!role && EVAL_CREATOR_ROLES.includes(role);

  return isCreator ? <ManagementView /> : <FormalEvaluationsParticipantView />;
}
