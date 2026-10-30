// components/evaluation/FormalEvaluationsTab.tsx
// Separador "Avaliações Formais" do módulo evaluation — não confundir com
// os separadores Ciclos/Resultados/Análises/Calibração (backend
// src/evaluation, 360°): este fala com src/assessments (type=EXAM).
//
// ADMIN, GESTOR, RH, DIRECTOR, LIDER (EVAL_CREATOR_ROLES): criam,
// publicam/arquivam/duplicam/eliminam e vêem os resultados totais.
// COLABORADOR, AUDITOR, INSTRUCTOR: só vêem e participam (FormalEvaluationsParticipantView).

'use client';

import { useState } from 'react';
import { BarChart3, ClipboardList, Copy, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useHasRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/assessments/Skeleton';
import { CreateFormalEvaluationModal } from './CreateFormalEvaluationModal';
import { FormalEvaluationCard } from './FormalEvaluationCard';
import { FormalEvaluationResultsPanel } from './FormalEvaluationResultsPanel';
import { FormalEvaluationsParticipantView } from './FormalEvaluationsParticipantView';
import type { FormalEvaluation } from './formalEvaluationTypes';

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
    {
      invalidateKeys: invalidate,
      onSuccess: () =>
        notify({ title: 'Avaliação publicada', intent: 'success' }),
    },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/assessments/${id}/archive`),
    {
      invalidateKeys: invalidate,
      onSuccess: () =>
        notify({ title: 'Avaliação arquivada', intent: 'success' }),
    },
  );
  const duplicate = useApiMutation(
    (id: number) => apiClient.post(`/assessments/${id}/duplicate`),
    {
      invalidateKeys: invalidate,
      onSuccess: () =>
        notify({ title: 'Avaliação duplicada', intent: 'success' }),
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/assessments/${id}`),
    {
      invalidateKeys: invalidate,
      onSuccess: () =>
        notify({ title: 'Avaliação eliminada', intent: 'success' }),
    },
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
          action={{
            label: 'Nova Avaliação',
            onClick: () => setShowCreate(true),
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {evaluations.map((e) => (
          <FormalEvaluationCard
            key={e.id}
            evaluation={e}
            onSelect={
              e.status !== 'DRAFT' ? () => setResultsId(e.id) : undefined
            }
            actions={
              <>
                <Button
                  type="button"
                  intent="onDarkGhost"
                  size="icon"
                  aria-label="Duplicar"
                  title="Duplicar"
                  onClick={() => duplicate.mutate(e.id)}
                >
                  <Copy size={15} strokeWidth={1.75} />
                </Button>
                {e.status !== 'PUBLISHED' && (
                  <Button
                    type="button"
                    intent="onDarkGhost"
                    size="icon"
                    aria-label="Eliminar"
                    title="Eliminar"
                    onClick={() => handleRemove(e)}
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </Button>
                )}
              </>
            }
            footer={
              <>
                {e.status !== 'DRAFT' && (
                  <Button
                    intent="onDark"
                    size="sm"
                    onClick={() => setResultsId(e.id)}
                  >
                    <BarChart3 size={14} strokeWidth={1.75} />
                    Resultados
                  </Button>
                )}
                {e.status === 'DRAFT' && (
                  <Button
                    intent="onDark"
                    size="sm"
                    onClick={() => publish.mutate(e.id)}
                    loading={publish.isPending}
                  >
                    Publicar
                  </Button>
                )}
                {e.status === 'PUBLISHED' && (
                  <Button
                    intent="onDarkGhost"
                    size="sm"
                    onClick={() => archive.mutate(e.id)}
                    loading={archive.isPending}
                  >
                    Arquivar
                  </Button>
                )}
              </>
            }
          />
        ))}
      </div>

      {showCreate && (
        <CreateFormalEvaluationModal onClose={() => setShowCreate(false)} />
      )}
      {resultsId !== null && (
        <FormalEvaluationResultsPanel
          assessmentId={resultsId}
          onClose={() => setResultsId(null)}
        />
      )}
    </div>
  );
}

export function FormalEvaluationsTab() {
  const isCreator = useHasRole(EVAL_CREATOR_ROLES);

  return isCreator ? <ManagementView /> : <FormalEvaluationsParticipantView />;
}
