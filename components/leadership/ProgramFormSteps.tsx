// components/leadership/ProgramFormSteps.tsx
// Renderiza a secção de campos de cada etapa do ProgramWizard. Sem estado
// próprio: recebe `form` + `setField` + mutadores de lista do assistente.

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  ADVISOR_ROLE_ITEMS,
  CONTENT_TYPE_ITEMS,
  CORPORATE_LEVEL_ITEMS,
  CRITERION_SOURCE_ITEMS,
  LEVEL_ITEMS,
  METHODOLOGY_ITEMS,
  MODALITY_ITEMS,
  PROGRAM_TYPE_ITEMS,
  TARGETING_SCOPE_ITEMS,
  type WizardStepId,
} from './constants';
import type { WizardForm } from './types';

type ListKey =
  | 'objectives'
  | 'targeting'
  | 'selectionCriteria'
  | 'competencies'
  | 'contents'
  | 'methodologies'
  | 'advisors';

export interface ProgramFormStepsProps {
  stepId: WizardStepId;
  form: WizardForm;
  setField: <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void;
  addRow: (key: ListKey) => void;
  removeRow: (key: ListKey, index: number) => void;
  setRow: (key: ListKey, index: number, patch: Record<string, string>) => void;
}

const num = (props: React.ComponentProps<typeof Input>) => (
  <Input type="number" min={0} className="w-full" {...props} />
);

export function ProgramFormSteps({
  stepId,
  form,
  setField,
  addRow,
  removeRow,
  setRow,
}: ProgramFormStepsProps) {
  const text = (key: keyof WizardForm, label: string, placeholder?: string) => (
    <FormField label={label} htmlFor={`pw-${key}`}>
      <Input
        id={`pw-${key}`}
        value={String(form[key] ?? '')}
        onChange={(e) => setField(key, e.target.value as never)}
        className="w-full"
        placeholder={placeholder}
      />
    </FormField>
  );

  switch (stepId) {
    case 'identity':
      return (
        <div className="space-y-4">
          {text('code', 'Código *', 'Ex: LDR-2026-001')}
          {text('name', 'Nome do programa *', 'Ex: Líderes do Futuro 2026')}
          <FormField label="Nível *" htmlFor="pw-level">
            <Select
              items={LEVEL_ITEMS}
              value={form.level || undefined}
              onValueChange={(v) => setField('level', v as WizardForm['level'])}
              className="w-full"
              placeholder="Selecionar nível"
            />
          </FormField>
          {text('description', 'Descrição')}
        </div>
      );

    case 'classification':
      return (
        <div className="space-y-4">
          <FormField label="Tipo de programa" htmlFor="pw-type">
            <Select
              items={PROGRAM_TYPE_ITEMS}
              value={form.type || undefined}
              onValueChange={(v) => setField('type', v)}
              className="w-full"
            />
          </FormField>
          <FormField label="Nível corporativo" htmlFor="pw-corporateLevel">
            <Select
              items={CORPORATE_LEVEL_ITEMS}
              value={form.corporateLevel || undefined}
              onValueChange={(v) => setField('corporateLevel', v)}
              className="w-full"
            />
          </FormField>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={form.mandatory}
              onChange={(e) => setField('mandatory', e.target.checked)}
            />
            Participação obrigatória
          </label>
        </div>
      );

    case 'objective':
      return (
        <FormField label="Objetivo geral do programa" htmlFor="pw-objective">
          <Textarea
            id="pw-objective"
            rows={5}
            className="w-full"
            value={form.objective}
            onChange={(e) => setField('objective', e.target.value)}
            placeholder="Que resultado de negócio/comportamento este programa procura?"
          />
        </FormField>
      );

    case 'planning':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Início" htmlFor="pw-startDate">
            <Input
              id="pw-startDate"
              type="date"
              className="w-full"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
            />
          </FormField>
          <FormField label="Fim" htmlFor="pw-endDate">
            <Input
              id="pw-endDate"
              type="date"
              className="w-full"
              value={form.endDate}
              onChange={(e) => setField('endDate', e.target.value)}
            />
          </FormField>
          <FormField label="Duração (semanas)" htmlFor="pw-durationWeeks">
            {num({
              id: 'pw-durationWeeks',
              value: form.durationWeeks,
              onChange: (e) => setField('durationWeeks', e.target.value),
            })}
          </FormField>
          <FormField label="Carga horária" htmlFor="pw-workloadHours">
            {num({
              id: 'pw-workloadHours',
              value: form.workloadHours,
              onChange: (e) => setField('workloadHours', e.target.value),
            })}
          </FormField>
        </div>
      );

    case 'sessions':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nº de sessões" htmlFor="pw-totalSessions">
            {num({
              id: 'pw-totalSessions',
              value: form.totalSessions,
              onChange: (e) => setField('totalSessions', e.target.value),
            })}
          </FormField>
          <FormField label="Modalidade" htmlFor="pw-modality">
            <Select
              items={MODALITY_ITEMS}
              value={form.modality || undefined}
              onValueChange={(v) => setField('modality', v)}
              className="w-full"
            />
          </FormField>
        </div>
      );

    case 'capacity':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Capacidade" htmlFor="pw-capacity">
            {num({
              id: 'pw-capacity',
              value: form.capacity,
              onChange: (e) => setField('capacity', e.target.value),
            })}
          </FormField>
          <FormField label="Mínimo de participantes" htmlFor="pw-minParticipants">
            {num({
              id: 'pw-minParticipants',
              value: form.minParticipants,
              onChange: (e) => setField('minParticipants', e.target.value),
            })}
          </FormField>
        </div>
      );

    case 'audience':
      return (
        <ListEditor
          title="Segmentos do público-alvo"
          rows={form.targeting}
          onAdd={() => addRow('targeting')}
          onRemove={(i) => removeRow('targeting', i)}
          render={(row, i) => (
            <>
              <Select
                items={TARGETING_SCOPE_ITEMS}
                value={row.scope || undefined}
                onValueChange={(v) => setRow('targeting', i, { scope: v })}
                className="w-40"
                placeholder="Âmbito"
              />
              <Input
                className="flex-1"
                placeholder="Descrição do segmento"
                value={row.description}
                onChange={(e) => setRow('targeting', i, { description: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'selection':
      return (
        <ListEditor
          title="Critérios de seleção (pesos ativos têm de somar 100)"
          rows={form.selectionCriteria}
          onAdd={() => addRow('selectionCriteria')}
          onRemove={(i) => removeRow('selectionCriteria', i)}
          render={(row, i) => (
            <>
              <Input
                className="w-36"
                placeholder="Nome"
                value={row.name}
                onChange={(e) => setRow('selectionCriteria', i, { name: e.target.value })}
              />
              <Select
                items={CRITERION_SOURCE_ITEMS}
                value={row.source || undefined}
                onValueChange={(v) => setRow('selectionCriteria', i, { source: v })}
                className="flex-1"
                placeholder="Fonte"
              />
              <Input
                type="number"
                min={0}
                max={100}
                className="w-20"
                placeholder="Peso"
                value={row.weight}
                onChange={(e) => setRow('selectionCriteria', i, { weight: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'competencies':
      return (
        <ListEditor
          title="Competências-alvo"
          rows={form.competencies}
          onAdd={() => addRow('competencies')}
          onRemove={(i) => removeRow('competencies', i)}
          render={(row, i) => (
            <>
              <Input
                type="number"
                min={1}
                className="w-28"
                placeholder="Competency ID"
                value={row.competencyId}
                onChange={(e) => setRow('competencies', i, { competencyId: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                className="w-28"
                placeholder="Nível-alvo"
                value={row.targetLevel}
                onChange={(e) => setRow('competencies', i, { targetLevel: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                className="w-20"
                placeholder="Peso"
                value={row.weight}
                onChange={(e) => setRow('competencies', i, { weight: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'objectives':
      return (
        <ListEditor
          title="Objetivos mensuráveis"
          rows={form.objectives}
          onAdd={() => addRow('objectives')}
          onRemove={(i) => removeRow('objectives', i)}
          render={(row, i) => (
            <>
              <Input
                className="flex-1"
                placeholder="Objetivo"
                value={row.title}
                onChange={(e) => setRow('objectives', i, { title: e.target.value })}
              />
              <Input
                className="w-48"
                placeholder="Indicador"
                value={row.indicator}
                onChange={(e) => setRow('objectives', i, { indicator: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'contents':
      return (
        <ListEditor
          title="Conteúdos da Academia (referência por ID)"
          rows={form.contents}
          onAdd={() => addRow('contents')}
          onRemove={(i) => removeRow('contents', i)}
          render={(row, i) => (
            <>
              <Select
                items={CONTENT_TYPE_ITEMS}
                value={row.contentType || undefined}
                onValueChange={(v) => setRow('contents', i, { contentType: v })}
                className="w-40"
                placeholder="Tipo"
              />
              <Input
                className="w-28"
                placeholder="ID / URL"
                value={row.refId}
                onChange={(e) => setRow('contents', i, { refId: e.target.value })}
              />
              <Input
                className="flex-1"
                placeholder="Título (opcional)"
                value={row.title}
                onChange={(e) => setRow('contents', i, { title: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'methodologies':
      return (
        <ListEditor
          title="Metodologias (se usar pesos, têm de somar 100)"
          rows={form.methodologies}
          onAdd={() => addRow('methodologies')}
          onRemove={(i) => removeRow('methodologies', i)}
          render={(row, i) => (
            <>
              <Select
                items={METHODOLOGY_ITEMS}
                value={row.type || undefined}
                onValueChange={(v) => setRow('methodologies', i, { type: v })}
                className="flex-1"
                placeholder="Metodologia"
              />
              <Input
                type="number"
                min={0}
                max={100}
                className="w-24"
                placeholder="Peso"
                value={row.weight}
                onChange={(e) => setRow('methodologies', i, { weight: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'advisors':
      return (
        <ListEditor
          title="Equipa de acompanhamento (User ID)"
          rows={form.advisors}
          onAdd={() => addRow('advisors')}
          onRemove={(i) => removeRow('advisors', i)}
          render={(row, i) => (
            <>
              <Input
                type="number"
                min={1}
                className="w-24"
                placeholder="User ID"
                value={row.userId}
                onChange={(e) => setRow('advisors', i, { userId: e.target.value })}
              />
              <Select
                items={ADVISOR_ROLE_ITEMS}
                value={row.role || undefined}
                onValueChange={(v) => setRow('advisors', i, { role: v })}
                className="w-40"
                placeholder="Papel"
              />
              <Input
                className="flex-1"
                placeholder="Área de foco"
                value={row.focusArea}
                onChange={(e) => setRow('advisors', i, { focusArea: e.target.value })}
              />
            </>
          )}
        />
      );

    case 'completion':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Presença mínima (%)" htmlFor="pw-minAttendanceRate">
              {num({
                id: 'pw-minAttendanceRate',
                value: form.minAttendanceRate,
                onChange: (e) => setField('minAttendanceRate', e.target.value),
              })}
            </FormField>
            <FormField label="Nota final mínima (%)" htmlFor="pw-minFinalScore">
              {num({
                id: 'pw-minFinalScore',
                value: form.minFinalScore,
                onChange: (e) => setField('minFinalScore', e.target.value),
              })}
            </FormField>
          </div>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={form.requireFinalProject}
              onChange={(e) => setField('requireFinalProject', e.target.checked)}
            />
            Exigir projeto final avaliado
          </label>
          <FormField label="Notas dos critérios de conclusão" htmlFor="pw-completionCriteria">
            <Textarea
              id="pw-completionCriteria"
              rows={3}
              className="w-full"
              value={form.completionCriteria}
              onChange={(e) => setField('completionCriteria', e.target.value)}
            />
          </FormField>
        </div>
      );

    case 'certification':
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={form.certificationEnabled}
              onChange={(e) => setField('certificationEnabled', e.target.checked)}
            />
            Emitir certificado ao concluir
          </label>
          {form.certificationEnabled &&
            text('certificateTitle', 'Título do certificado', 'Ex: Certificado de Liderança')}
        </div>
      );

    case 'review':
      return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-body text-sm">
          <ReviewRow k="Código" v={form.code} />
          <ReviewRow k="Nome" v={form.name} />
          <ReviewRow k="Nível" v={form.level} />
          <ReviewRow k="Tipo" v={form.type} />
          <ReviewRow k="Público-alvo" v={`${form.targeting.length} segmento(s)`} />
          <ReviewRow k="Critérios de seleção" v={`${form.selectionCriteria.length}`} />
          <ReviewRow k="Competências" v={`${form.competencies.length}`} />
          <ReviewRow k="Objetivos" v={`${form.objectives.length}`} />
          <ReviewRow k="Conteúdos" v={`${form.contents.length}`} />
          <ReviewRow k="Metodologias" v={`${form.methodologies.length}`} />
          <ReviewRow k="Equipa" v={`${form.advisors.length}`} />
          <ReviewRow k="Certificação" v={form.certificationEnabled ? 'Sim' : 'Não'} />
        </dl>
      );

    default:
      return null;
  }
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-ink">{v || '—'}</dd>
    </>
  );
}

interface ListEditorProps<T> {
  title: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (row: T, index: number) => React.ReactNode;
}

function ListEditor<T>({ title, rows, onAdd, onRemove, render }: ListEditorProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm font-medium text-ink">{title}</span>
        <Button size="sm" intent="ghost" onClick={onAdd}>
          <Plus size={14} strokeWidth={1.75} /> Adicionar
        </Button>
      </div>
      {rows.length === 0 && (
        <p className="font-body text-xs text-ink-faint">Nenhuma linha. Esta secção é opcional.</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {render(row, i)}
          <button
            type="button"
            aria-label={`Remover linha ${i + 1}`}
            className="rounded-control p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger-ink"
            onClick={() => onRemove(i)}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
}
