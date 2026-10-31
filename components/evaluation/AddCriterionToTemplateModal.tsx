// components/evaluation/AddCriterionToTemplateModal.tsx
// "Adicionar critério" no cartão de um modelo: lista os critérios já criados
// na aba Critérios (que ainda não estão no modelo) para escolher, ou cria um
// critério novo e liga-o logo ao modelo.

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { CriteriaFormModal } from './CriteriaFormModal';
import type { EvalCriteria, EvalTemplate } from './types';

export interface AddCriterionToTemplateModalProps {
  template: Pick<EvalTemplate, 'id' | 'name' | 'scaleId'>;
  onClose: () => void;
}

export function AddCriterionToTemplateModal({
  template,
  onClose,
}: AddCriterionToTemplateModalProps) {
  const notify = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const { data: detail } = useApiQuery<EvalTemplate>(
    queryKeys.evaluation.templateDetail(template.id),
    `/evaluations/templates/${template.id}`,
  );
  const { data: all, isLoading } = useApiQuery<EvalCriteria[]>(
    queryKeys.evaluation.criteria(),
    '/evaluations/criteria',
  );

  const linkedIds = new Set((detail?.criteria ?? []).map((c) => c.criteriaId));
  const available = (all ?? []).filter(
    (c) => c.isActive && !linkedIds.has(c.id),
  );

  // Lê o modelo actual no momento de gravar, para não perder critérios ligados
  // entretanto, e acrescenta o novo.
  const link = async (criterion: EvalCriteria) => {
    const current = await apiClient.get<EvalTemplate>(
      `/evaluations/templates/${template.id}`,
    );
    const kept = (current.criteria ?? []).map((c) => ({
      criteriaId: c.criteriaId,
      weight: Number(c.weight ?? 1),
    }));
    if (kept.some((c) => c.criteriaId === criterion.id)) return;
    await apiClient.patch(`/evaluations/templates/${template.id}`, {
      criteria: [
        ...kept,
        { criteriaId: criterion.id, weight: Number(criterion.weight ?? 1) },
      ],
    });
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.evaluation.templates(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.evaluation.templateDetail(template.id),
      }),
    ]);
  };

  const pick = async (criterion: EvalCriteria) => {
    setError('');
    setBusyId(criterion.id);
    try {
      await link(criterion);
      notify({ title: 'Critério adicionado ao modelo', intent: 'success' });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível adicionar o critério.',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (creating) {
    return (
      <CriteriaFormModal
        criteria={null}
        defaultScaleId={template.scaleId}
        onCreated={link}
        onClose={() => setCreating(false)}
      />
    );
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Adicionar critério"
        description={`Escolha um critério já criado ou crie um novo para o modelo "${template.name}".`}
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <Button type="button" onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.75} /> Novo critério
          </Button>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              Critérios criados
            </p>
            {isLoading ? (
              <p className="text-sm text-ink-muted">A carregar…</p>
            ) : available.length === 0 ? (
              <p className="rounded-card border border-dashed border-border-strong p-4 text-center text-sm text-ink-muted">
                Todos os critérios criados já estão neste modelo.
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {available.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-card border border-border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {c.name}
                      </p>
                      {c.category && (
                        <p className="truncate text-xs text-ink-muted">
                          {c.category}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      intent="secondary"
                      loading={busyId === c.id}
                      onClick={() => pick(c)}
                    >
                      Adicionar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button intent="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
