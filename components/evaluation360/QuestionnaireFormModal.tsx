// components/evaluation360/QuestionnaireFormModal.tsx
// Modal "Novo questionário" (docs/evaluation360.md §6): nome, código, escala,
// descrição/instruções e competências avaliadas. As perguntas acrescentam-se
// a seguir, no detalhe do questionário (QuestionnaireDetailModal), porque só
// um questionário em rascunho aceita perguntas novas.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface QuestionnaireFormModalProps {
  onClose: () => void;
  /** Chamado com o id do questionário acabado de criar. */
  onCreated: (id: string) => void;
}

interface CompetencyOption {
  id: number;
  name: string;
}

// "Avaliação de Liderança 2026" → "AVALIACAO-DE-LIDERANCA-2026"
function suggestCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function QuestionnaireFormModal({
  onClose,
  onCreated,
}: QuestionnaireFormModalProps) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [scaleMin, setScaleMin] = useState('1');
  const [scaleMax, setScaleMax] = useState('5');
  const [competencyIds, setCompetencyIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  const { data: catalogue, isLoading: competenciesLoading } = useApiQuery<
    CompetencyOption[]
  >(queryKeys.evaluation360.competencies(), '/evaluation360/competencies', {
    staleTime: STALE_TIME.STATIC,
  });

  const toggleCompetency = (id: number) =>
    setCompetencyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<{ id: string }>('/evaluation360/questionnaires', body),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: (created) => {
        notify({
          title: 'Questionário criado',
          description: 'Acrescenta agora as perguntas e publica-o.',
          intent: 'success',
        });
        onCreated(created.id);
      },
      onError: () =>
        setError(
          'Não foi possível criar o questionário. Confirma que o código ainda não existe.',
        ),
    },
  );

  const handleSubmit = () => {
    setError('');
    const min = Number(scaleMin);
    const max = Number(scaleMax);
    if (!name.trim()) return setError('Indica o nome do questionário.');
    if (!code.trim()) return setError('Indica o código do questionário.');
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1)
      return setError('A escala tem de usar números inteiros a partir de 1.');
    if (max < 2 || max > 10 || max <= min)
      return setError(
        'O máximo da escala tem de ficar entre 2 e 10 e ser maior que o mínimo.',
      );
    create.mutate({
      tenantId: 'default',
      name: name.trim(),
      code: code.trim(),
      scaleMin: min,
      scaleMax: max,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
      ...(competencyIds.length > 0
        ? {
            competencies: competencyIds.map((id, order) => ({
              competencyId: String(id),
              order,
            })),
          }
        : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo questionário"
        description="Cria um modelo reutilizável de perguntas para os ciclos de avaliação 360°."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome *" htmlFor="qn-name">
            <Input
              id="qn-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!codeTouched) setCode(suggestCode(e.target.value));
              }}
              className="w-full"
              placeholder="Ex.: Avaliação de Liderança 2026"
              maxLength={150}
            />
          </FormField>

          <FormField
            label="Código *"
            htmlFor="qn-code"
            hint="Identificador único. É sugerido a partir do nome."
          >
            <Input
              id="qn-code"
              value={code}
              onChange={(e) => {
                setCodeTouched(true);
                setCode(e.target.value);
              }}
              className="w-full"
              maxLength={60}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Escala — mínimo" htmlFor="qn-min">
              <Input
                id="qn-min"
                type="number"
                min={1}
                value={scaleMin}
                onChange={(e) => setScaleMin(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Escala — máximo" htmlFor="qn-max">
              <Input
                id="qn-max"
                type="number"
                min={2}
                max={10}
                value={scaleMax}
                onChange={(e) => setScaleMax(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="qn-description">
            <Textarea
              id="qn-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Para que serve este questionário…"
            />
          </FormField>

          <FormField
            label="Instruções para quem responde"
            htmlFor="qn-instructions"
          >
            <Textarea
              id="qn-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Ex.: Responde com base no que observaste nos últimos 6 meses."
            />
          </FormField>

          <div>
            <span className="font-body text-sm font-medium text-ink">
              Competências avaliadas
            </span>
            <p className="mt-1 mb-2 font-body text-xs text-ink-muted">
              Escolhe do catálogo do módulo Competências. Um ciclo criado com
              este questionário avalia estas competências.
            </p>
            <div className="max-h-48 overflow-y-auto rounded-card border border-border p-2 space-y-1">
              {competenciesLoading && <Skeleton rows={3} />}
              {!competenciesLoading && (catalogue ?? []).length === 0 && (
                <EmptyState
                  variant="inline"
                  title="Nenhuma competência encontrada no catálogo"
                />
              )}
              {(catalogue ?? []).map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-control px-1 py-1 font-body text-sm text-ink hover:bg-surface-sunken"
                >
                  <Checkbox
                    checked={competencyIds.includes(c.id)}
                    onChange={() => toggleCompetency(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={create.isPending}
          >
            {create.isPending ? 'A criar...' : 'Criar e adicionar perguntas'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
