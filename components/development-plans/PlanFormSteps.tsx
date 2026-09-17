// components/development-plans/PlanFormSteps.tsx
// Renderiza a secção de campos de cada etapa do CreatePlanWizard. Sem estado
// próprio (excepto o texto de pesquisa dos pickers de colaborador/gestor):
// recebe `form` + `setField` + mutadores de lista do assistente. Mesmo
// padrão de components/leadership/ProgramFormSteps.tsx.

'use client';

import { useState } from 'react';
import { Popover } from 'radix-ui';
import { Plus, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import {
  ACTION_CFG,
  DURATION_PRESETS,
  GAP_PRIORITY_ITEMS,
  ORIGIN_ITEMS,
  PRIORITY_CFG,
  type WizardStepId,
} from './constants';
import {
  useCompetencyOptions,
  useCourseOptions,
  useDirectoryUsers,
  type DirectoryUser,
} from './planData';
import type {
  ActionDraft,
  ActionType,
  CheckpointDraft,
  CompetencyGapDraft,
  GoalDraft,
  WizardForm,
} from './types';

type ListKey = 'competencyGaps' | 'goals' | 'actions' | 'checkpoints';

export interface PlanFormStepsProps {
  stepId: WizardStepId;
  form: WizardForm;
  setField: <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void;
  addRow: (key: ListKey) => void;
  removeRow: (key: ListKey, index: number) => void;
  setRow: (key: ListKey, index: number, patch: Record<string, unknown>) => void;
}

const ACTION_TYPE_ITEMS = Object.entries(ACTION_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const PRIORITY_ITEMS = Object.entries(PRIORITY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

/**
 * Picker de colaborador/gestor por pesquisa no diretório interno. O
 * dropdown de resultados vai num Popover.Portal (mesmo primitivo do
 * components/ui/Combobox) em vez de `position: absolute` dentro do fluxo
 * normal — o CreatePlanWizard corre dentro de um ModalContent com
 * `overflow-y-auto`, e um dropdown absoluto ficava sujeito a ser cortado
 * pelo overflow do modal quando o picker está perto do fundo visível; o
 * portal escapa para o body e não sofre esse corte.
 */
function UserPicker({
  label,
  htmlFor,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  htmlFor: string;
  value: DirectoryUser | null;
  onChange: (u: DirectoryUser | null) => void;
  /** Não mostrar este utilizador nos resultados (ex.: o próprio colaborador no picker de gestor). */
  excludeId?: number;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { users, loading } = useDirectoryUsers(search, open && !value && search.trim().length > 0);
  const results = users.filter((u) => u.id !== excludeId);

  const select = (u: DirectoryUser) => {
    onChange(u);
    setSearch('');
    setOpen(false);
  };

  return (
    <FormField label={label} htmlFor={htmlFor}>
      {value ? (
        <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
          <Avatar name={value.fullName} url={value.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{value.fullName}</div>
            {(value.position?.name || value.department?.name) && (
              <div className="truncate text-xs text-ink-faint">
                {[value.position?.name, value.department?.name].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remover ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
            className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Anchor asChild>
            <Input
              id={htmlFor}
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                setOpen(v.trim().length > 0);
              }}
              onFocus={() => search.trim().length > 0 && setOpen(true)}
              className="w-full"
              placeholder="Pesquisar por nome ou email…"
              autoComplete="off"
            />
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="z-[60] max-h-56 w-[--radix-popover-trigger-width] overflow-y-auto rounded-card border border-border bg-surface shadow-elevated"
            >
              {loading && <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-ink-muted">Nenhum colaborador encontrado</div>
              )}
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => select(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                >
                  <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{u.fullName}</div>
                    <div className="truncate text-xs text-ink-faint">
                      {u.department?.name ?? u.email ?? '—'}
                    </div>
                  </div>
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </FormField>
  );
}

interface ListEditorProps<T> {
  title: string;
  hint?: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Uma linha já persistida no backend fica bloqueada (ver nota no CreatePlanWizard). */
  isLocked: (row: T) => boolean;
  render: (row: T, index: number, locked: boolean) => React.ReactNode;
}

function ListEditor<T>({ title, hint, rows, onAdd, onRemove, isLocked, render }: ListEditorProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm font-medium text-ink">{title}</span>
        <Button size="sm" intent="ghost" onClick={onAdd} type="button">
          <Plus size={14} strokeWidth={1.75} /> Adicionar
        </Button>
      </div>
      {hint && <p className="font-body text-xs text-ink-faint">{hint}</p>}
      {rows.length === 0 && (
        <p className="font-body text-xs text-ink-faint">Nenhuma linha adicionada ainda.</p>
      )}
      {rows.map((row, i) => {
        const locked = isLocked(row);
        return (
          <div
            key={i}
            className="flex items-start gap-2 rounded-card border border-border p-2"
          >
            <div className="flex-1 space-y-2">{render(row, i, locked)}</div>
            {locked ? (
              <span className="mt-1.5 flex-shrink-0 font-body text-xs text-success">Guardado</span>
            ) : (
              <button
                type="button"
                aria-label={`Remover linha ${i + 1}`}
                className="mt-1.5 flex-shrink-0 rounded-control p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger-ink"
                onClick={() => onRemove(i)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PlanFormSteps({ stepId, form, setField, addRow, removeRow, setRow }: PlanFormStepsProps) {
  const { options: competencyOptions } = useCompetencyOptions(stepId === 'competencies');
  const { options: courseOptions } = useCourseOptions(stepId === 'actionPlan');

  switch (stepId) {
    case 'identification':
      return (
        <div className="space-y-4">
          <UserPicker
            label="Colaborador *"
            htmlFor="pdi-employee"
            value={form.employee}
            onChange={(u) => setField('employee', u)}
          />
          <UserPicker
            label="Gestor / responsável pelo acompanhamento"
            htmlFor="pdi-manager"
            value={form.manager}
            onChange={(u) => setField('manager', u)}
            excludeId={form.employee?.id}
          />
          <FormField label="Título do PDI *" htmlFor="pdi-name">
            <Input
              id="pdi-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ex.: Desenvolvimento para Liderança de Equipas"
              maxLength={200}
              className="w-full"
            />
          </FormField>
          <FormField label="Objectivo geral (SMART) *" htmlFor="pdi-goal">
            <Textarea
              id="pdi-goal"
              value={form.goal}
              onChange={(e) => setField('goal', e.target.value)}
              placeholder="O que o colaborador deverá ser capaz de fazer/alcançar após concluir o PDI?"
              rows={2}
              className="w-full"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Prioridade" htmlFor="pdi-priority">
              <Select
                items={PRIORITY_ITEMS}
                value={form.priority}
                onValueChange={(v) => setField('priority', v as WizardForm['priority'])}
                className="w-full"
              />
            </FormField>
            <FormField label="Ciclo do PDI" htmlFor="pdi-period">
              <Input
                id="pdi-period"
                value={form.period}
                onChange={(e) => setField('period', e.target.value)}
                placeholder="Ex.: 2026 ou 2026/2027"
                className="w-full"
              />
            </FormField>
            <FormField label="Duração" htmlFor="pdi-duration">
              <Select
                items={DURATION_PRESETS}
                value={form.durationPreset}
                onValueChange={(v) => setField('durationPreset', v)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de início" htmlFor="pdi-start">
              <Input
                id="pdi-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data prevista de conclusão" htmlFor="pdi-end">
              <Input
                id="pdi-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                disabled={form.durationPreset !== 'custom' && form.durationPreset !== ''}
                className="w-full"
              />
            </FormField>
          </div>
        </div>
      );

    case 'diagnosis':
      return (
        <div className="space-y-4">
          <FormField label="Origem do PDI" htmlFor="pdi-origin">
            <Select
              items={ORIGIN_ITEMS}
              value={form.origin || undefined}
              onValueChange={(v) => setField('origin', v as WizardForm['origin'])}
              placeholder="Por que razão este PDI foi criado?"
              className="w-full"
            />
          </FormField>
          <FormField label="Justificação para a criação do PDI" htmlFor="pdi-origin-just">
            <Textarea
              id="pdi-origin-just"
              value={form.originJustification}
              onChange={(e) => setField('originJustification', e.target.value)}
              placeholder="Descreva o motivo pelo qual o colaborador necessita deste plano."
              rows={2}
              className="w-full"
            />
          </FormField>
          <FormField label="Principais pontos fortes" htmlFor="pdi-strengths">
            <Textarea
              id="pdi-strengths"
              value={form.strengths}
              onChange={(e) => setField('strengths', e.target.value)}
              placeholder="Competências, conhecimentos, comportamentos e resultados em que o colaborador já se destaca."
              rows={2}
              className="w-full"
            />
          </FormField>
          <FormField label="Principais necessidades de desenvolvimento" htmlFor="pdi-needs">
            <Textarea
              id="pdi-needs"
              value={form.developmentNeeds}
              onChange={(e) => setField('developmentNeeds', e.target.value)}
              placeholder="Competências técnicas/comportamentais, liderança, comunicação, gestão…"
              rows={2}
              className="w-full"
            />
          </FormField>
        </div>
      );

    case 'competencies':
      return (
        <ListEditor<CompetencyGapDraft>
          title="Competências a desenvolver"
          hint="Ligação directa ao Mapa de Competências — nível actual, nível desejado e prioridade."
          rows={form.competencyGaps}
          onAdd={() => addRow('competencyGaps')}
          onRemove={(i) => removeRow('competencyGaps', i)}
          isLocked={() => false}
          render={(row, i) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Select
                items={competencyOptions}
                value={row.competencyId || undefined}
                onValueChange={(v) => setRow('competencyGaps', i, { competencyId: v })}
                placeholder="Competência"
                className="w-full sm:col-span-2"
              />
              <Input
                type="number"
                min={0}
                placeholder="Nível actual"
                value={row.currentLevel}
                onChange={(e) => setRow('competencyGaps', i, { currentLevel: e.target.value })}
                className="w-full"
              />
              <Input
                type="number"
                min={0}
                placeholder="Nível desejado"
                value={row.targetLevel}
                onChange={(e) => setRow('competencyGaps', i, { targetLevel: e.target.value })}
                className="w-full"
              />
              <Select
                items={GAP_PRIORITY_ITEMS}
                value={row.priority}
                onValueChange={(v) => setRow('competencyGaps', i, { priority: v })}
                className="w-full sm:col-span-4 sm:w-48"
              />
            </div>
          )}
        />
      );

    case 'objectives':
      return (
        <div className="space-y-5">
          <div>
            <button
              type="button"
              aria-pressed={form.careerLinked}
              onClick={() => setField('careerLinked', !form.careerLinked)}
              className={cn(
                'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
                form.careerLinked
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border-strong bg-surface text-ink-muted',
              )}
            >
              {form.careerLinked ? '✓ ' : ''}Este PDI está associado a um objectivo de carreira
            </button>
          </div>
          {form.careerLinked && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="ID do plano de carreira" htmlFor="pdi-career-id">
                <Input
                  id="pdi-career-id"
                  type="number"
                  min={1}
                  value={form.careerPlanId}
                  onChange={(e) => setField('careerPlanId', e.target.value)}
                  placeholder="Ver em Carreira → Planos de Carreira"
                  className="w-full"
                />
              </FormField>
              <FormField label="Nível de prontidão actual (%)" htmlFor="pdi-readiness">
                <Input
                  id="pdi-readiness"
                  type="number"
                  min={0}
                  max={100}
                  value={form.careerReadinessPercent}
                  onChange={(e) => setField('careerReadinessPercent', e.target.value)}
                  placeholder="Ex.: 65"
                  className="w-full"
                />
              </FormField>
            </div>
          )}

          <ListEditor<GoalDraft>
            title="Objectivos de desenvolvimento"
            hint="Vários objectivos concretos e mensuráveis, cada um com indicador de sucesso e prazo."
            rows={form.goals}
            onAdd={() => addRow('goals')}
            onRemove={(i) => removeRow('goals', i)}
            isLocked={(row) => row.id !== null}
            render={(row, i, locked) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Nome do objectivo"
                  value={row.title}
                  disabled={locked}
                  onChange={(e) => setRow('goals', i, { title: e.target.value })}
                  className="w-full sm:col-span-2"
                />
                <Textarea
                  placeholder="Descrição (opcional)"
                  value={row.description}
                  disabled={locked}
                  onChange={(e) => setRow('goals', i, { description: e.target.value })}
                  rows={2}
                  className="w-full sm:col-span-2"
                />
                <Input
                  placeholder="Indicador de sucesso"
                  value={row.successIndicator}
                  disabled={locked}
                  onChange={(e) => setRow('goals', i, { successIndicator: e.target.value })}
                  className="w-full"
                />
                <Input
                  type="date"
                  value={row.dueDate}
                  disabled={locked}
                  onChange={(e) => setRow('goals', i, { dueDate: e.target.value })}
                  className="w-full"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Peso (0-100)"
                  value={row.weight}
                  disabled={locked}
                  onChange={(e) => setRow('goals', i, { weight: e.target.value })}
                  className="w-full"
                />
              </div>
            )}
          />
        </div>
      );

    case 'actionPlan':
      return (
        <ListEditor<ActionDraft>
          title="Acções de desenvolvimento"
          hint="Formação, mentoria, coaching, projectos especiais, shadowing, autoestudo — não só cursos."
          rows={form.actions}
          onAdd={() => addRow('actions')}
          onRemove={(i) => removeRow('actions', i)}
          isLocked={(row) => row.id !== null}
          render={(row, i, locked) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Nome da acção"
                value={row.title}
                disabled={locked}
                onChange={(e) => setRow('actions', i, { title: e.target.value })}
                className="w-full sm:col-span-2"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={row.description}
                disabled={locked}
                onChange={(e) => setRow('actions', i, { description: e.target.value })}
                rows={2}
                className="w-full sm:col-span-2"
              />
              <Select
                items={ACTION_TYPE_ITEMS}
                value={row.type}
                onValueChange={(v) => setRow('actions', i, { type: v as ActionType })}
                disabled={locked}
                className="w-full"
              />
              {row.type === 'COURSE' && (
                <Select
                  items={courseOptions}
                  value={row.courseId || undefined}
                  onValueChange={(v) => setRow('actions', i, { courseId: v })}
                  placeholder="Curso associado"
                  disabled={locked}
                  className="w-full"
                />
              )}
              <Input
                type="number"
                min={0}
                placeholder="Carga horária (h)"
                value={row.workloadHours}
                disabled={locked}
                onChange={(e) => setRow('actions', i, { workloadHours: e.target.value })}
                className="w-full"
              />
              <Input
                type="date"
                value={row.dueDate}
                disabled={locked}
                onChange={(e) => setRow('actions', i, { dueDate: e.target.value })}
                className="w-full"
              />
              <label className="flex items-center gap-2 font-body text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={row.mandatory}
                  disabled={locked}
                  onChange={(e) => setRow('actions', i, { mandatory: e.target.checked })}
                  className="h-4 w-4 rounded border-border-strong accent-primary"
                />
                Obrigatória
              </label>
            </div>
          )}
        />
      );

    case 'tracking':
      return (
        <ListEditor<CheckpointDraft>
          title="Checkpoints / marcos de acompanhamento"
          hint="Datas para rever progresso — semanal, quinzenal, mensal ou por marco."
          rows={form.checkpoints}
          onAdd={() => addRow('checkpoints')}
          onRemove={(i) => removeRow('checkpoints', i)}
          isLocked={(row) => row.id !== null}
          render={(row, i, locked) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Título (ex.: Rever progresso do curso)"
                value={row.title}
                disabled={locked}
                onChange={(e) => setRow('checkpoints', i, { title: e.target.value })}
                className="w-full sm:col-span-2"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={row.description}
                disabled={locked}
                onChange={(e) => setRow('checkpoints', i, { description: e.target.value })}
                rows={2}
                className="w-full sm:col-span-2"
              />
              <Input
                type="date"
                value={row.scheduledAt}
                disabled={locked}
                onChange={(e) => setRow('checkpoints', i, { scheduledAt: e.target.value })}
                className="w-full"
              />
              <Select
                items={[
                  { value: 'QUICK', label: 'Check-in rápido' },
                  { value: 'STRUCTURED', label: 'Check-in estruturado' },
                ]}
                value={row.type}
                onValueChange={(v) => setRow('checkpoints', i, { type: v as CheckpointDraft['type'] })}
                disabled={locked}
                className="w-full"
              />
            </div>
          )}
        />
      );

    case 'review':
      return (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 font-body text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-ink-faint">Colaborador</dt>
          <dd className="text-ink">{form.employee?.fullName ?? '—'}</dd>
          <dt className="text-ink-faint">Gestor</dt>
          <dd className="text-ink">{form.manager?.fullName ?? '—'}</dd>
          <dt className="text-ink-faint">Título</dt>
          <dd className="text-ink">{form.name || '—'}</dd>
          <dt className="text-ink-faint">Objectivo geral</dt>
          <dd className="text-ink">{form.goal || '—'}</dd>
          <dt className="text-ink-faint">Competências</dt>
          <dd className="text-ink">{form.competencyGaps.length} a desenvolver</dd>
          <dt className="text-ink-faint">Objectivos</dt>
          <dd className="text-ink">{form.goals.length} definidos</dd>
          <dt className="text-ink-faint">Acções</dt>
          <dd className="text-ink">{form.actions.length} planeadas</dd>
          <dt className="text-ink-faint">Checkpoints</dt>
          <dd className="text-ink">{form.checkpoints.length} agendados</dd>
        </dl>
      );

    default:
      return null;
  }
}
