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

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PROFICIENCY_SCALE_PRESET } from './constants';
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

const VALUE_ITEMS = [1, 2, 3, 4, 5].map((v) => ({ value: String(v), label: `Nível ${v}` }));

export function LevelFormModal({
  level,
  competencyId,
  onClose,
  onSuccess,
}: LevelFormModalProps) {
  const editing = !!level;
  const { options: competencyOptions, loading: loadingCompetencies } = useCompetencyOptions(
    !editing,
  );

  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>(
    level ? String(level.competencyId) : competencyId ? String(competencyId) : '',
  );
  const [value, setValue] = useState<string>(level ? String(level.value) : '');
  const [name, setName] = useState(level?.name ?? '');
  const [description, setDescription] = useState(level?.description ?? '');
  const [code, setCode] = useState(level?.code ?? '');
  const [minScore, setMinScore] = useState(level?.minScore != null ? String(level.minScore) : '');
  const [maxScore, setMaxScore] = useState(level?.maxScore != null ? String(level.maxScore) : '');
  const [expectedBehaviors, setExpectedBehaviors] = useState(level?.expectedBehaviors ?? '');
  const [knowledgeDemonstrated, setKnowledgeDemonstrated] = useState(
    level?.knowledgeDemonstrated ?? '',
  );
  const [autonomy, setAutonomy] = useState(level?.autonomy ?? '');
  const [taskComplexity, setTaskComplexity] = useState(level?.taskComplexity ?? '');
  const [observableEvidence, setObservableEvidence] = useState(level?.observableEvidence ?? '');
  const [evaluationCriteria, setEvaluationCriteria] = useState(level?.evaluationCriteria ?? '');
  const [status, setStatus] = useState<string>(level?.status ?? 'ACTIVE');
  const [submitError, setSubmitError] = useState('');

  const applyPreset = () => {
    const v = parseInt(value, 10);
    const preset = PROFICIENCY_SCALE_PRESET.find((p) => p.value === v);
    if (!preset) return;
    setName(preset.name);
    setDescription(preset.description);
  };

  const canSubmit =
    (editing || selectedCompetencyId.length > 0) && value.length > 0 && name.trim().length > 0;

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
        setSubmitError(e.message || 'Erro ao guardar o nível. Tente novamente.'),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
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
        title={editing ? 'Editar nível de proficiência' : 'Novo nível de proficiência'}
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
                onValueChange={setSelectedCompetencyId}
                placeholder={loadingCompetencies ? 'A carregar…' : 'Selecionar competência'}
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
                onValueChange={setValue}
                placeholder="Nível"
                className="w-full"
              />
            </FormField>
            <FormField label="Código" htmlFor="lf-code">
              <Input
                id="lf-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: NIV-3"
                maxLength={60}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField label="Nome *" htmlFor="lf-name">
                <Input
                  id="lf-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Intermédio"
                  maxLength={80}
                  className="w-full"
                />
              </FormField>
            </div>
            <Button intent="ghost" size="sm" onClick={applyPreset} disabled={!value}>
              Usar escala proposta
            </Button>
          </div>

          <FormField label="Descrição" htmlFor="lf-description">
            <Textarea
              id="lf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setMinScore(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Pontuação máxima" htmlFor="lf-max">
              <Input
                id="lf-max"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Comportamentos esperados" htmlFor="lf-behaviors">
            <Textarea
              id="lf-behaviors"
              value={expectedBehaviors}
              onChange={(e) => setExpectedBehaviors(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>

          <FormField label="Conhecimentos demonstrados" htmlFor="lf-knowledge">
            <Textarea
              id="lf-knowledge"
              value={knowledgeDemonstrated}
              onChange={(e) => setKnowledgeDemonstrated(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Autonomia" htmlFor="lf-autonomy">
              <Input
                id="lf-autonomy"
                value={autonomy}
                onChange={(e) => setAutonomy(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Complexidade das tarefas" htmlFor="lf-complexity">
              <Input
                id="lf-complexity"
                value={taskComplexity}
                onChange={(e) => setTaskComplexity(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Evidências observáveis" htmlFor="lf-evidence">
            <Textarea
              id="lf-evidence"
              value={observableEvidence}
              onChange={(e) => setObservableEvidence(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>

          <FormField label="Critérios de avaliação" htmlFor="lf-criteria">
            <Textarea
              id="lf-criteria"
              value={evaluationCriteria}
              onChange={(e) => setEvaluationCriteria(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>

          {editing && (
            <FormField label="Estado" htmlFor="lf-status">
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={setStatus}
                className="w-full"
              />
            </FormField>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
            {editing ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
