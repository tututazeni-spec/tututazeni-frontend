// components/competencies/LevelFormModal.tsx
// Modal de criação/edição de um nível de proficiência (docs/
// módulo_competencies.md §3, Fase 2). Só ADMIN/RH — mesmo RBAC de
// @Roles(ADMIN, RH) em competencies.controller.ts (POST/PATCH
// /competencies/proficiency-levels). Ao contrário de
// CompetencyFormModal, não faz GET dedicado em modo edição: a aba
// "Níveis de Proficiência" já tem o registo completo na listagem (GET
// /competencies/proficiency-levels devolve todos os campos), por isso o
// modal recebe o nível a editar directamente como prop.
//
// competencyId não é editável depois de criado (ver
// docs/superpowers/specs/2026-09-25-competencies-fase2-design.md, decisão
// 3) — apaga-se e recria-se para mudar de competência.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  LEVEL_AUTONOMY_OPTIONS,
  LEVEL_BEHAVIORS_OPTIONS,
  LEVEL_COMPLEXITY_OPTIONS,
  LEVEL_CRITERIA_OPTIONS,
  LEVEL_DEMONSTRATED_OPTIONS,
  LEVEL_EVIDENCE_OPTIONS,
  LEVEL_NAME_OPTIONS,
  PROFICIENCY_SCALE_PRESET,
} from './constants';
import { useCompetencyOptions } from './modelFormData';
import type { ProficiencyLevelWithCompetency } from './types';

export interface LevelFormModalProps {
  /** Presente → edição desse nível. Ausente → criação. */
  level?: ProficiencyLevelWithCompetency | null;
  /** Pré-selecciona a competência ao criar (ex.: vindo do filtro activo). */
  competencyId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

const VALUE_ITEMS = [1, 2, 3, 4, 5].map((v) => ({
  value: String(v),
  label: `Nível ${v}`,
}));

interface LevelFormModalFormValues {
  selectedCompetencyId: string;
  value: string;
  name: string;
  description: string;
  code: string;
  minScore: string;
  maxScore: string;
  expectedBehaviors: string;
  knowledgeDemonstrated: string;
  autonomy: string;
  taskComplexity: string;
  observableEvidence: string;
  evaluationCriteria: string;
  status: string;
  submitError: string;
}

export function LevelFormModal({
  level,
  competencyId,
  onClose,
  onSuccess,
}: LevelFormModalProps) {
  const editing = !!level;
  const { options: competencyOptions, loading: loadingCompetencies } =
    useCompetencyOptions(!editing);

  const { values: formValues, set: setField } =
    useFormState<LevelFormModalFormValues>({
      selectedCompetencyId: level
        ? String(level.competencyId)
        : competencyId
          ? String(competencyId)
          : '',
      value: level ? String(level.value) : '',
      name: level?.name ?? '',
      description: level?.description ?? '',
      code: level?.code ?? '',
      minScore: level?.minScore != null ? String(level.minScore) : '',
      maxScore: level?.maxScore != null ? String(level.maxScore) : '',
      expectedBehaviors: level?.expectedBehaviors ?? '',
      knowledgeDemonstrated: level?.knowledgeDemonstrated ?? '',
      autonomy: level?.autonomy ?? '',
      taskComplexity: level?.taskComplexity ?? '',
      observableEvidence: level?.observableEvidence ?? '',
      evaluationCriteria: level?.evaluationCriteria ?? '',
      status: level?.status ?? 'ACTIVE',
      submitError: '',
    });
  const {
    selectedCompetencyId,
    value,
    name,
    description,
    code,
    minScore,
    maxScore,
    expectedBehaviors,
    knowledgeDemonstrated,
    autonomy,
    taskComplexity,
    observableEvidence,
    evaluationCriteria,
    status,
    submitError,
  } = formValues;

  const applyPreset = () => {
    const v = parseInt(value, 10);
    const preset = PROFICIENCY_SCALE_PRESET.find((p) => p.value === v);
    if (!preset) return;
    setField('name', preset.name);
    setField('description', preset.description);
  };

  const canSubmit =
    (editing || selectedCompetencyId.length > 0) &&
    value.length > 0 &&
    name.trim().length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.patch(`/competencies/proficiency-levels/${level!.id}`, body)
        : apiClient.post('/competencies/proficiency-levels', body),
    {
      invalidateKeys: [queryKeys.competencies.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao guardar o nível. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    const body: Record<string, unknown> = {
      value: parseInt(value, 10),
      name: name.trim(),
      description: description.trim() || null,
      code: code.trim() || null,
      minScore: minScore.trim() ? parseInt(minScore, 10) : null,
      maxScore: maxScore.trim() ? parseInt(maxScore, 10) : null,
      expectedBehaviors: expectedBehaviors.trim() || null,
      knowledgeDemonstrated: knowledgeDemonstrated.trim() || null,
      autonomy: autonomy.trim() || null,
      taskComplexity: taskComplexity.trim() || null,
      observableEvidence: observableEvidence.trim() || null,
      evaluationCriteria: evaluationCriteria.trim() || null,
    };
    if (editing) body.status = status;
    else body.competencyId = parseInt(selectedCompetencyId, 10);
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={
          editing
            ? 'Editar nível de proficiência'
            : 'Novo nível de proficiência'
        }
        description={
          editing
            ? `Competência: ${level!.competency.name}`
            : 'Define o que significa estar neste nível de uma competência.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {!editing && (
            <FormField label="Competência *" htmlFor="lf-competency">
              <Select
                items={competencyOptions}
                value={selectedCompetencyId || undefined}
                onValueChange={(v) => setField('selectedCompetencyId', v)}
                placeholder={
                  loadingCompetencies ? 'A carregar…' : 'Selecionar competência'
                }
                disabled={loadingCompetencies}
                className="w-full"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nível (escala 1-5) *" htmlFor="lf-value">
              <Select
                items={VALUE_ITEMS}
                value={value || undefined}
                onValueChange={(v) => setField('value', v)}
                placeholder="Nível"
                className="w-full"
              />
            </FormField>
            <FormField label="Código" htmlFor="lf-code">
              <Input
                id="lf-code"
                value={code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="Ex.: NIV-3"
                maxLength={60}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField label="Nome *" htmlFor="lf-name">
                <Combobox
                  items={LEVEL_NAME_OPTIONS}
                  value={name || undefined}
                  onValueChange={(v) => setField('name', v)}
                  placeholder="Selecionar ou escrever"
                  searchPlaceholder="Escreva para filtrar ou indicar outro…"
                  allowCustom
                />
              </FormField>
            </div>
            <Button
              intent="ghost"
              size="sm"
              onClick={applyPreset}
              disabled={!value}
            >
              Usar escala proposta
            </Button>
          </div>

          <FormField label="Descrição" htmlFor="lf-description">
            <Textarea
              id="lf-description"
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              placeholder="Âncoras comportamentais deste nível."
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pontuação mínima" htmlFor="lf-min">
              <Input
                id="lf-min"
                type="number"
                value={minScore}
                onChange={(e) => setField('minScore', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Pontuação máxima" htmlFor="lf-max">
              <Input
                id="lf-max"
                type="number"
                value={maxScore}
                onChange={(e) => setField('maxScore', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Comportamentos esperados" htmlFor="lf-behaviors">
            <Combobox
              items={LEVEL_BEHAVIORS_OPTIONS}
              value={expectedBehaviors || undefined}
              onValueChange={(v) => setField('expectedBehaviors', v)}
              placeholder="Selecionar ou escrever"
              searchPlaceholder="Escreva para filtrar ou indicar outro…"
              allowCustom
            />
          </FormField>

          <FormField label="Conhecimentos demonstrados" htmlFor="lf-knowledge">
            <Combobox
              items={LEVEL_DEMONSTRATED_OPTIONS}
              value={knowledgeDemonstrated || undefined}
              onValueChange={(v) => setField('knowledgeDemonstrated', v)}
              placeholder="Selecionar ou escrever"
              searchPlaceholder="Escreva para filtrar ou indicar outro…"
              allowCustom
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Autonomia" htmlFor="lf-autonomy">
              <Combobox
                items={LEVEL_AUTONOMY_OPTIONS}
                value={autonomy || undefined}
                onValueChange={(v) => setField('autonomy', v)}
                placeholder="Selecionar ou escrever"
                searchPlaceholder="Escreva para filtrar ou indicar outro…"
                allowCustom
              />
            </FormField>
            <FormField label="Complexidade das tarefas" htmlFor="lf-complexity">
              <Combobox
                items={LEVEL_COMPLEXITY_OPTIONS}
                value={taskComplexity || undefined}
                onValueChange={(v) => setField('taskComplexity', v)}
                placeholder="Selecionar ou escrever"
                searchPlaceholder="Escreva para filtrar ou indicar outro…"
                allowCustom
              />
            </FormField>
          </div>

          <FormField label="Evidências observáveis" htmlFor="lf-evidence">
            <Combobox
              items={LEVEL_EVIDENCE_OPTIONS}
              value={observableEvidence || undefined}
              onValueChange={(v) => setField('observableEvidence', v)}
              placeholder="Selecionar ou escrever"
              searchPlaceholder="Escreva para filtrar ou indicar outro…"
              allowCustom
            />
          </FormField>

          <FormField label="Critérios de avaliação" htmlFor="lf-criteria">
            <Combobox
              items={LEVEL_CRITERIA_OPTIONS}
              value={evaluationCriteria || undefined}
              onValueChange={(v) => setField('evaluationCriteria', v)}
              placeholder="Selecionar ou escrever"
              searchPlaceholder="Escreva para filtrar ou indicar outro…"
              allowCustom
            />
          </FormField>

          {editing && (
            <FormField label="Estado" htmlFor="lf-status">
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={(v) => setField('status', v)}
                className="w-full"
              />
            </FormField>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {editing ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
