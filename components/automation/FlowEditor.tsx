// components/automation/FlowEditor.tsx
// Editor do fluxo (docs/modulo_automation.md §4, "Como deve funcionar o fluxo
// visual?"): blocos de acção, atraso e condição com ramos Sim / Não, que se
// podem adicionar, remover, reordenar e aninhar. Ver flow.ts para o modelo.

'use client';

import {
  ArrowDown,
  ArrowUp,
  Clock,
  GitBranch,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import {
  ACTION_ITEMS,
  CHANNEL_ITEMS,
  OPERATOR_ITEMS,
  VALUELESS_OPERATORS,
} from './constants';
import {
  addStep,
  moveStep,
  newStep,
  removeStep,
  updateStep,
  type FlowActionStep,
  type FlowBranch,
  type FlowConditionStep,
  type FlowDelayStep,
  type FlowStep,
  type ListPath,
} from './flow';

const LOGIC_ITEMS = [
  { value: 'AND', label: 'E — todas as linhas' },
  { value: 'OR', label: 'OU — qualquer linha' },
];
const ON_ERROR_ITEMS = [
  { value: 'stop', label: 'Parar o fluxo' },
  { value: 'continue', label: 'Continuar na etapa seguinte' },
];
const DELAY_UNITS = [
  { value: '1', label: 'minutos' },
  { value: '60', label: 'horas' },
  { value: '1440', label: 'dias' },
];

const NEEDS_MESSAGE = new Set([
  'send_notification',
  'send_email',
  'send_sms',
  'send_whatsapp',
  'create_alert',
]);

export interface FlowEditorProps {
  steps: FlowStep[];
  onChange: (steps: FlowStep[]) => void;
  /** Automações existentes — alvo do bloco "Executar outra automação". */
  ruleOptions?: { value: string; label: string }[];
}

export function FlowEditor({
  steps,
  onChange,
  ruleOptions = [],
}: FlowEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <StepList
        root={steps}
        path={[]}
        onChange={onChange}
        ruleOptions={ruleOptions}
      />
    </div>
  );
}

interface ListProps {
  root: FlowStep[];
  path: ListPath;
  onChange: (steps: FlowStep[]) => void;
  ruleOptions: { value: string; label: string }[];
}

function listAt(root: FlowStep[], path: ListPath): FlowStep[] {
  let list = root;
  for (let i = 0; i < path.length; i += 2) {
    list = (list[path[i] as number] as FlowConditionStep)[
      path[i + 1] as FlowBranch
    ];
  }
  return list;
}

function StepList({ root, path, onChange, ruleOptions }: ListProps) {
  const list = listAt(root, path);
  return (
    <div className="flex flex-col gap-2">
      {list.map((step, index) => (
        <div key={step.id} className="flex flex-col items-stretch gap-2">
          <StepCard
            root={root}
            path={path}
            index={index}
            step={step}
            total={list.length}
            onChange={onChange}
            ruleOptions={ruleOptions}
          />
          {index < list.length - 1 && (
            <ArrowDown
              size={14}
              strokeWidth={1.75}
              className="self-center text-ink-faint"
              aria-hidden
            />
          )}
        </div>
      ))}
      <AddStepBar
        onAdd={(type) => onChange(addStep(root, path, newStep(type)))}
        compact={path.length > 0}
      />
    </div>
  );
}

function AddStepBar({
  onAdd,
  compact,
}: {
  onAdd: (type: FlowStep['type']) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        compact
          ? ''
          : 'rounded-card border border-dashed border-border-strong p-3',
      )}
    >
      <span className="font-body text-xs text-ink-faint">Adicionar etapa:</span>
      <Button size="sm" intent="secondary" onClick={() => onAdd('action')}>
        <Zap size={14} strokeWidth={1.75} />
        Acção
      </Button>
      <Button size="sm" intent="secondary" onClick={() => onAdd('condition')}>
        <GitBranch size={14} strokeWidth={1.75} />
        Condição Sim / Não
      </Button>
      <Button size="sm" intent="secondary" onClick={() => onAdd('delay')}>
        <Clock size={14} strokeWidth={1.75} />
        Atraso
      </Button>
    </div>
  );
}

interface CardProps {
  root: FlowStep[];
  path: ListPath;
  index: number;
  step: FlowStep;
  total: number;
  onChange: (steps: FlowStep[]) => void;
  ruleOptions: { value: string; label: string }[];
}

const KIND_META = {
  action: { label: 'Acção', icon: Zap },
  delay: { label: 'Atraso', icon: Clock },
  condition: { label: 'Condição', icon: GitBranch },
} as const;

function StepCard({
  root,
  path,
  index,
  step,
  total,
  onChange,
  ruleOptions,
}: CardProps) {
  const meta = KIND_META[step.type];
  const Icon = meta.icon;
  const patch = (p: Partial<FlowStep>) =>
    onChange(updateStep(root, path, index, p));

  return (
    <div
      className={cn(
        'rounded-card border p-3',
        step.type === 'condition'
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-surface',
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Icon size={14} strokeWidth={1.75} />
          {meta.label} {index + 1}
        </span>
        <Input
          value={step.label ?? ''}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="Nome da etapa (opcional)"
          aria-label={`Nome da etapa ${index + 1}`}
          className="ml-2 h-8 max-w-[260px] flex-1 text-xs"
        />
        <div className="ml-auto flex gap-1">
          <IconButton
            icon={ArrowUp}
            label="Mover para cima"
            intent="ghost"
            disabled={index === 0}
            onClick={() => onChange(moveStep(root, path, index, -1))}
          />
          <IconButton
            icon={ArrowDown}
            label="Mover para baixo"
            intent="ghost"
            disabled={index === total - 1}
            onClick={() => onChange(moveStep(root, path, index, 1))}
          />
          <IconButton
            icon={Trash2}
            label="Remover etapa"
            intent="ghost"
            className="hover:bg-danger-subtle hover:text-danger"
            onClick={() => onChange(removeStep(root, path, index))}
          />
        </div>
      </div>

      {step.type === 'action' && (
        <ActionFields step={step} patch={patch} ruleOptions={ruleOptions} />
      )}
      {step.type === 'delay' && <DelayFields step={step} patch={patch} />}
      {step.type === 'condition' && (
        <ConditionFields
          step={step}
          patch={patch}
          root={root}
          path={path}
          index={index}
          onChange={onChange}
          ruleOptions={ruleOptions}
        />
      )}
    </div>
  );
}

function ActionFields({
  step,
  patch,
  ruleOptions,
}: {
  step: FlowActionStep;
  patch: (p: Partial<FlowStep>) => void;
  ruleOptions: { value: string; label: string }[];
}) {
  const setParam = (key: string, value: unknown) =>
    patch({ params: { ...step.params, [key]: value } });
  const str = (key: string) => (step.params[key] as string | undefined) ?? '';
  const channel = step.action === 'send_notification' ? str('channel') : '';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Tipo de acção" htmlFor={`${step.id}-action`}>
          <Select
            items={ACTION_ITEMS}
            value={step.action}
            onValueChange={(v) => patch({ action: v })}
            className="w-full"
          />
        </FormField>
        <FormField label="Se a acção falhar" htmlFor={`${step.id}-onerror`}>
          <Select
            items={ON_ERROR_ITEMS}
            value={step.onError ?? 'stop'}
            onValueChange={(v) => patch({ onError: v as 'stop' | 'continue' })}
            className="w-full"
          />
        </FormField>
      </div>

      {NEEDS_MESSAGE.has(step.action) && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Destinatário"
              htmlFor={`${step.id}-recipient`}
              hint="userId, ASSIGNEE, MANAGER, ROLE:RH… — vazio usa o utilizador do evento."
            >
              <Input
                id={`${step.id}-recipient`}
                value={str('recipient')}
                onChange={(e) => setParam('recipient', e.target.value)}
              />
            </FormField>
            {step.action === 'send_notification' && (
              <FormField label="Canal" htmlFor={`${step.id}-channel`}>
                <Select
                  items={CHANNEL_ITEMS}
                  value={channel || 'internal'}
                  onValueChange={(v) => setParam('channel', v)}
                  className="w-full"
                />
              </FormField>
            )}
          </div>
          {(step.action === 'send_email' || channel === 'email') && (
            <FormField label="Assunto" htmlFor={`${step.id}-subject`}>
              <Input
                id={`${step.id}-subject`}
                value={str('subject')}
                onChange={(e) => setParam('subject', e.target.value)}
              />
            </FormField>
          )}
          <FormField
            label="Mensagem"
            htmlFor={`${step.id}-message`}
            hint="Suporta placeholders {{campo}} preenchidos com os dados do evento."
          >
            <Textarea
              id={`${step.id}-message`}
              value={str('messageTemplate')}
              onChange={(e) => setParam('messageTemplate', e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
        </>
      )}

      {step.action === 'run_automation' && (
        <FormField
          label="Automação a executar"
          htmlFor={`${step.id}-rule`}
          hint="O sistema recusa ciclos (A → B → A) e cadeias com mais de 5 níveis."
        >
          <Select
            items={ruleOptions}
            value={str('ruleId') || undefined}
            onValueChange={(v) => setParam('ruleId', Number(v))}
            placeholder="Escolher automação"
            className="w-full"
          />
        </FormField>
      )}

      {['assign_course', 'create_task', 'update_status', 'create_pdi'].includes(
        step.action,
      ) && (
        <FormField
          label="Parâmetros (JSON)"
          htmlFor={`${step.id}-json`}
          hint='Ex.: {"courseId": 5} para atribuir um curso.'
        >
          <JsonParams step={step} patch={patch} />
        </FormField>
      )}
    </div>
  );
}

// Parâmetros livres de acções sem campos dedicados — o JSON só é aplicado quando válido.
function JsonParams({
  step,
  patch,
}: {
  step: FlowActionStep;
  patch: (p: Partial<FlowStep>) => void;
}) {
  const text = JSON.stringify(step.params, null, 0);
  return (
    <Textarea
      id={`${step.id}-json`}
      defaultValue={text === '{}' ? '' : text}
      key={step.action}
      rows={2}
      className="w-full font-data"
      onChange={(e) => {
        try {
          const parsed = e.target.value.trim()
            ? JSON.parse(e.target.value)
            : {};
          if (parsed && typeof parsed === 'object') patch({ params: parsed });
        } catch {
          /* mantém os últimos parâmetros válidos enquanto o JSON está incompleto */
        }
      }}
    />
  );
}

function DelayFields({
  step,
  patch,
}: {
  step: FlowDelayStep;
  patch: (p: Partial<FlowStep>) => void;
}) {
  const unit =
    step.minutes % 1440 === 0 ? '1440' : step.minutes % 60 === 0 ? '60' : '1';
  const amount = step.minutes / Number(unit);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FormField label="Aguardar" htmlFor={`${step.id}-amount`}>
        <Input
          id={`${step.id}-amount`}
          type="number"
          min={1}
          value={amount}
          onChange={(e) =>
            patch({
              minutes: Math.max(1, Number(e.target.value) || 1) * Number(unit),
            })
          }
          className="max-w-[120px]"
        />
      </FormField>
      <FormField label="Unidade" htmlFor={`${step.id}-unit`}>
        <Select
          items={DELAY_UNITS}
          value={unit}
          onValueChange={(v) => patch({ minutes: amount * Number(v) })}
          className="min-w-[130px]"
        />
      </FormField>
      <p className="pb-2 font-body text-xs text-ink-muted">
        A execução fica a aguardar e retoma sozinha (máx. 30 dias).
      </p>
    </div>
  );
}

function ConditionFields({
  step,
  patch,
  root,
  path,
  index,
  onChange,
  ruleOptions,
}: {
  step: FlowConditionStep;
  patch: (p: Partial<FlowStep>) => void;
  root: FlowStep[];
  path: ListPath;
  index: number;
  onChange: (steps: FlowStep[]) => void;
  ruleOptions: { value: string; label: string }[];
}) {
  const setRow = (i: number, p: Partial<FlowConditionStep['rows'][number]>) =>
    patch({ rows: step.rows.map((r, k) => (k === i ? { ...r, ...p } : r)) });

  return (
    <div className="flex flex-col gap-3">
      {step.rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[130px] flex-1">
            <FormField label="Campo" htmlFor={`${step.id}-f-${i}`}>
              <Input
                id={`${step.id}-f-${i}`}
                value={row.field}
                onChange={(e) => setRow(i, { field: e.target.value })}
                placeholder="ex.: departmentId"
              />
            </FormField>
          </div>
          <div className="min-w-[150px] flex-1">
            <FormField label="Operador" htmlFor={`${step.id}-o-${i}`}>
              <Select
                items={OPERATOR_ITEMS}
                value={row.operator}
                onValueChange={(v) => setRow(i, { operator: v })}
                className="w-full"
              />
            </FormField>
          </div>
          {!VALUELESS_OPERATORS.has(row.operator) && (
            <div className="min-w-[130px] flex-1">
              <FormField label="Valor" htmlFor={`${step.id}-v-${i}`}>
                <Input
                  id={`${step.id}-v-${i}`}
                  value={row.value ?? ''}
                  onChange={(e) => setRow(i, { value: e.target.value })}
                />
              </FormField>
            </div>
          )}
          <IconButton
            icon={Trash2}
            label="Remover linha"
            intent="ghost"
            disabled={step.rows.length === 1}
            className="mb-0.5 hover:bg-danger-subtle hover:text-danger"
            onClick={() => patch({ rows: step.rows.filter((_, k) => k !== i) })}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          intent="secondary"
          onClick={() =>
            patch({
              rows: [
                ...step.rows,
                { field: '', operator: 'equals', value: '' },
              ],
            })
          }
        >
          <Plus size={14} strokeWidth={1.75} />
          Adicionar linha
        </Button>
        {step.rows.length > 1 && (
          <Select
            items={LOGIC_ITEMS}
            value={step.logic}
            onValueChange={(v) => patch({ logic: v as 'AND' | 'OR' })}
            className="min-w-[200px]"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {(['then', 'else'] as const).map((branch) => (
          <div
            key={branch}
            className={cn(
              'rounded-card border p-3',
              branch === 'then'
                ? 'border-success/40 bg-success-subtle/40'
                : 'border-warning/40 bg-warning-subtle/40',
            )}
          >
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {branch === 'then'
                ? 'Sim — a condição verifica-se'
                : 'Não — não se verifica'}
            </p>
            <StepList
              root={root}
              path={[...path, index, branch]}
              onChange={onChange}
              ruleOptions={ruleOptions}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
