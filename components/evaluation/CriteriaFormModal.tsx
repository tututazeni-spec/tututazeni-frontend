// components/evaluation/CriteriaFormModal.tsx
// Modal de criar/editar um critério da "biblioteca central" (docs/
// modulo_evaluation.md pt.5) — usada pelo CriteriaTab. Mesmo padrão de
// CreateCycleModal.tsx (useFormValidation + useApiMutation).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CRITERIA_CATEGORY_OPTIONS } from './constants';
import type { EvalCriteria, EvalScale, EvalTemplate } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

export interface CriteriaFormModalProps {
  criteria?: EvalCriteria | null;
  /** Modelo ao qual o novo critério fica ligado depois de guardado. */
  template?: EvalTemplate | null;
  onClose: () => void;
}

const CATEGORY_ITEMS = CRITERIA_CATEGORY_OPTIONS.map((c) => ({
  value: c,
  label: c,
}));

// Sugestões para "Indicadores comportamentais". O backend guarda texto livre
// (um indicador por linha), por isso escolher da lista só acrescenta/remove
// a linha correspondente no texto.
const INDICATOR_SUGGESTIONS = [
  'Cumpre prazos e compromissos assumidos',
  'Assume responsabilidade pelos resultados',
  'Comunica de forma clara e respeitosa',
  'Colabora ativamente com a equipa',
  'Procura feedback e atua sobre ele',
  'Propõe soluções e toma iniciativa',
  'Adapta-se a mudanças com facilidade',
  'Demonstra orientação para o cliente',
  'Partilha conhecimento com os colegas',
  'Atua de acordo com os valores da empresa',
];

const splitIndicators = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function CriteriaFormModal({
  criteria,
  template,
  onClose,
}: CriteriaFormModalProps) {
  const notify = useToast();
  const isEdit = !!criteria;

  const { data: scales } = useApiQuery<EvalScale[]>(
    queryKeys.evaluation.scales(),
    '/evaluations/scales',
  );

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: criteria?.name ?? '',
      code: criteria?.code ?? '',
      description: criteria?.description ?? '',
      category: criteria?.category ?? '',
      weight: String(criteria?.weight ?? 1),
      scaleId: criteria?.scaleId ? String(criteria.scaleId) : '',
      behavioralIndicators: criteria?.behavioralIndicators ?? '',
    },
    { name: [required()] },
  );
  const [isActive, setIsActive] = useState(criteria?.isActive ?? true);
  const [submitError, setSubmitError] = useState('');

  const payload = () => ({
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    category: form.category || undefined,
    weight: Number(form.weight) || 1,
    scaleId: form.scaleId ? Number(form.scaleId) : undefined,
    behavioralIndicators: form.behavioralIndicators.trim() || undefined,
    ...(isEdit ? { isActive } : {}),
  });

  // Ao criar a partir de um modelo, o critério novo é ligado a esse modelo:
  // o PATCH do modelo substitui os critérios, por isso reenviam-se os que já
  // lá estavam e acrescenta-se o novo (com o peso padrão do critério).
  const save = useApiMutation(
    async () => {
      if (criteria)
        return apiClient.patch(
          `/evaluations/criteria/${criteria.id}`,
          payload(),
        );
      const created = await apiClient.post<{ id: number }>(
        '/evaluations/criteria',
        payload(),
      );
      if (template) {
        await apiClient.patch(`/evaluations/templates/${template.id}`, {
          criteria: [
            ...(template.criteria ?? []).map((c) => ({
              criteriaId: c.criteriaId,
              weight: Number(c.weight ?? 1),
            })),
            { criteriaId: created.id, weight: Number(form.weight) || 1 },
          ],
        });
      }
      return created;
    },
    {
      invalidateKeys: [
        queryKeys.evaluation.criteria(),
        queryKeys.evaluation.templates(),
        ...(template ? [queryKeys.evaluation.templateDetail(template.id)] : []),
      ],
      onSuccess: () => {
        notify({
          title: isEdit ? 'Critério actualizado' : 'Critério criado',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e instanceof Error ? e.message : 'Erro ao guardar o critério.',
        ),
    },
  );

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    save.mutate(undefined);
  });

  const selectedIndicators = splitIndicators(form.behavioralIndicators);
  const toggleIndicator = (text: string) => {
    const next = selectedIndicators.includes(text)
      ? selectedIndicators.filter((l) => l !== text)
      : [...selectedIndicators, text];
    setField('behavioralIndicators', next.join('\n'));
  };

  const scaleItems = [
    { value: '', label: 'Sem escala definida' },
    ...(scales ?? []).map((s) => ({ value: String(s.id), label: s.name })),
  ];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={isEdit ? 'Editar Critério' : 'Novo critério de avaliação'}
        description={
          template
            ? `Fica ligado ao modelo "${template.name}".`
            : 'Critério reutilizável — pode ser ligado a vários modelos de avaliação.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {(validationError || submitError) && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {validationError || submitError}
            </div>
          )}

          <FormField label="Nome *" htmlFor="crit-name">
            <Input
              id="crit-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Orientação para resultados"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código" htmlFor="crit-code">
              <Input
                id="crit-code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                className="w-full"
                placeholder="Ex.: CRIT-014"
              />
            </FormField>
            <FormField label="Peso padrão" htmlFor="crit-weight">
              <Input
                id="crit-weight"
                type="number"
                min={0}
                step={0.1}
                value={form.weight}
                onChange={(e) => setField('weight', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Categoria" htmlFor="crit-category">
            <Select
              items={[{ value: '', label: 'Sem categoria' }, ...CATEGORY_ITEMS]}
              value={form.category}
              onValueChange={(v) => setField('category', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Escala de avaliação" htmlFor="crit-scale">
            <Select
              items={scaleItems}
              value={form.scaleId}
              onValueChange={(v) => setField('scaleId', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="crit-description">
            <Textarea
              id="crit-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
            />
          </FormField>

          <FormField
            label="Indicadores comportamentais"
            htmlFor="crit-indicators"
          >
            <div
              role="group"
              aria-label="Indicadores sugeridos"
              className="mb-2 flex flex-wrap gap-2"
            >
              {INDICATOR_SUGGESTIONS.map((s) => {
                const active = selectedIndicators.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleIndicator(s)}
                    className={
                      active
                        ? 'rounded-full border-[1.5px] border-brand bg-brand px-3 py-1 text-xs text-white'
                        : 'rounded-full border-[1.5px] border-field bg-surface px-3 py-1 text-xs text-field-ink hover:bg-field-soft'
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <Textarea
              id="crit-indicators"
              value={form.behavioralIndicators}
              onChange={(e) => setField('behavioralIndicators', e.target.value)}
              className="w-full"
              rows={3}
              placeholder="Escolhe acima ou escreve outros — um indicador por linha"
            />
          </FormField>

          {isEdit && (
            <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
              <Checkbox
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Activo
            </label>
          )}
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
            loading={save.isPending}
          >
            {isEdit ? 'Guardar' : 'Guardar critério'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
