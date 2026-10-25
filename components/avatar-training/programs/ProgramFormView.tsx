// components/avatar-training/programs/ProgramFormView.tsx
// Formulário «Nova/Editar formação com avatar» (apresentação). Estado,
// queries de apoio e gravação: hooks/useProgramForm.ts; regras: ./logic.ts.

import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { ProgramFormController } from '@/hooks/useProgramForm';
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_LABEL,
  EXPERIENCE_LABEL,
  LANGUAGE_ITEMS,
  OBJECTIVE_OPTIONS,
  TARGET_ROLE_OPTIONS,
} from '../constants';
import { CheckList } from './CheckList';
import { ALL, OTHER, withCurrent } from './logic';
import type { AvatarProgramDetail } from '../types';

const DIFFICULTY_ITEMS = Object.entries(DIFFICULTY_LABEL).map(
  ([value, label]) => ({ value, label }),
);
const EXPERIENCE_ITEMS = Object.entries(EXPERIENCE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

interface ProgramFormViewProps {
  /** Presente = edição (ficha completa); ausente = criação. */
  program?: AvatarProgramDetail;
  ctl: ProgramFormController;
  onClose: () => void;
}

export function ProgramFormView({
  program,
  ctl,
  onClose,
}: ProgramFormViewProps) {
  const {
    form,
    set,
    changeCategory,
    changeLanguage,
    changeCourse,
    customObjective,
    setCustomObjective,
    addCustomObjective,
    users,
    courseOptions,
    moduleOptions,
    deptOptions,
    competencyOptions,
    avatarItems,
    variantItems,
    durationInvalid,
    minScoreInvalid,
    canSave,
    save,
    isSaving,
  } = ctl;
  const {
    title,
    description,
    objectives,
    category,
    otherCategory,
    difficulty,
    experienceType,
    language,
    duration,
    courseId,
    moduleId,
    avatarId,
    responsible,
    prerequisites,
    departments,
    roleNames,
    competencies,
    certificate,
    minScore,
    allSessions,
    variant,
  } = form;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={
          program ? 'Editar formação com avatar' : 'Nova formação com avatar'
        }
        description={
          program?.status === 'IN_REVIEW'
            ? 'Editar uma formação em revisão devolve-a a rascunho.'
            : 'Fica em rascunho até ser revista e publicada.'
        }
      >
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <FormField label="Título" htmlFor="ap-title">
            <Input
              id="ap-title"
              value={title}
              maxLength={200}
              onChange={(e) => set({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Descrição" htmlFor="ap-desc">
            <Textarea
              id="ap-desc"
              rows={3}
              value={description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </FormField>
          <CheckList<string>
            legend="Objectivos de aprendizagem"
            options={withCurrent(OBJECTIVE_OPTIONS, objectives).map((o) => ({
              id: o,
              label: o,
            }))}
            selected={objectives}
            onChange={(ids) => set({ objectives: ids })}
            emptyText="Sem objectivos disponíveis."
          />
          <div className="flex gap-2">
            <Input
              aria-label="Novo objectivo"
              placeholder="Outro objectivo (escrever)"
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomObjective();
                }
              }}
            />
            <Button
              type="button"
              intent="secondary"
              onClick={addCustomObjective}
              disabled={!customObjective.trim()}
            >
              Adicionar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Categoria" htmlFor="ap-cat">
              <Select
                value={otherCategory ? OTHER : category || ALL}
                onValueChange={changeCategory}
                items={[
                  { value: ALL, label: 'Sem categoria' },
                  ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
                  { value: OTHER, label: 'Outra (escrever)' },
                ]}
              />
              {otherCategory && (
                <Input
                  className="mt-2"
                  aria-label="Categoria"
                  placeholder="Escreve a categoria"
                  value={category}
                  maxLength={80}
                  onChange={(e) => set({ category: e.target.value })}
                />
              )}
            </FormField>
            <FormField label="Nível de dificuldade" htmlFor="ap-diff">
              <Select
                value={difficulty}
                onValueChange={(v) => set({ difficulty: v })}
                items={DIFFICULTY_ITEMS}
              />
            </FormField>
            <FormField label="Tipo de experiência" htmlFor="ap-exp">
              <Select
                value={experienceType}
                onValueChange={(v) => set({ experienceType: v })}
                items={EXPERIENCE_ITEMS}
              />
            </FormField>
            <FormField label="Idioma" htmlFor="ap-lang">
              <Select
                value={language}
                onValueChange={changeLanguage}
                items={LANGUAGE_ITEMS}
              />
            </FormField>
            <FormField
              label="Duração estimada (min)"
              htmlFor="ap-dur"
              error={durationInvalid ? 'Entre 1 e 1440 minutos' : undefined}
            >
              <Input
                id="ap-dur"
                type="number"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) => set({ duration: e.target.value })}
              />
            </FormField>
            <FormField label="Variante do idioma" htmlFor="ap-variant">
              <Select
                value={variant || ALL}
                onValueChange={(v) => set({ variant: v === ALL ? '' : v })}
                items={variantItems}
              />
            </FormField>
            <FormField label="Curso associado" htmlFor="ap-course">
              <Combobox
                value={courseId}
                onValueChange={changeCourse}
                placeholder="Sem curso"
                items={[
                  { value: ALL, label: 'Sem curso' },
                  ...courseOptions.map((c) => ({
                    value: String(c.id),
                    label: c.label,
                  })),
                ]}
              />
            </FormField>
            <FormField label="Módulo do curso" htmlFor="ap-module">
              <Select
                value={moduleId}
                onValueChange={(v) => set({ moduleId: v })}
                disabled={courseId === ALL}
                items={[
                  { value: ALL, label: 'Curso inteiro' },
                  ...moduleOptions.map((m) => ({
                    value: String(m.id),
                    label: m.title,
                  })),
                ]}
              />
            </FormField>
            <FormField label="Avatar (instrutor virtual)" htmlFor="ap-avatar">
              <Select
                value={avatarId}
                onValueChange={(v) => set({ avatarId: v })}
                items={avatarItems}
              />
            </FormField>
            <FormField label="Formador responsável" htmlFor="ap-resp">
              <Select
                value={responsible}
                onValueChange={(v) => set({ responsible: v })}
                items={users}
              />
            </FormField>
          </div>
          <CheckList
            legend="Pré-requisitos (cursos concluídos)"
            options={courseOptions}
            selected={prerequisites}
            onChange={(ids) => set({ prerequisites: ids })}
            emptyText="Sem cursos disponíveis."
          />
          <CheckList
            legend="Público-alvo — departamentos"
            options={deptOptions}
            selected={departments}
            onChange={(ids) => set({ departments: ids })}
            emptyText="Sem departamentos disponíveis."
          />
          <CheckList<string>
            legend="Público-alvo — perfis (vazio = todos)"
            options={withCurrent(
              TARGET_ROLE_OPTIONS.map((r) => r.value),
              roleNames,
            ).map((v) => ({
              id: v,
              label: TARGET_ROLE_OPTIONS.find((r) => r.value === v)?.label ?? v,
            }))}
            selected={roleNames}
            onChange={(ids) => set({ roleNames: ids })}
            emptyText="Sem perfis disponíveis."
          />
          <CheckList
            legend="Competências-alvo"
            options={competencyOptions}
            selected={competencies}
            onChange={(ids) => set({ competencies: ids })}
            emptyText="Sem competências disponíveis."
          />
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={certificate}
              onChange={(e) => set({ certificate: e.target.checked })}
            />
            Permitir pedido de certificado ao concluir
          </label>
          {certificate && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Nota média mínima (0-100)"
                htmlFor="ap-minscore"
                hint="Vazio = sem nota mínima."
                error={minScoreInvalid ? 'Entre 0 e 100' : undefined}
              >
                <Input
                  id="ap-minscore"
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => set({ minScore: e.target.value })}
                />
              </FormField>
              <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  checked={allSessions}
                  onChange={(e) => set({ allSessions: e.target.checked })}
                />
                Exigir todas as sessões obrigatórias concluídas
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button intent="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={isSaving}
            disabled={!canSave}
            onClick={save}
          >
            {program ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
