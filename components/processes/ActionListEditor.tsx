// components/processes/ActionListEditor.tsx
// Editor das acções de sucesso / falha de uma etapa e das acções de uma
// etapa «Acção automática» (docs/Modulo_Processes.md §8).

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { emptyAction, type ActionDraft, type ActionType } from './workflow-model';

export const RECIPIENT_TOKENS = [
  { value: 'ASSIGNEE', label: 'Responsável da etapa' },
  { value: 'TARGET', label: 'Colaborador-alvo' },
  { value: 'REQUESTER', label: 'Solicitante' },
  { value: 'MANAGER', label: 'Gestor do colaborador' },
  { value: 'OWNER', label: 'Dono do modelo' },
  { value: 'RESPONSIBLE', label: 'Responsável actual' },
  { value: 'ROLE:RH', label: 'Equipa de RH' },
  { value: 'ROLE:ADMIN', label: 'Administradores' },
];

const TYPE_ITEMS: Array<{ value: ActionType; label: string }> = [
  { value: 'NOTIFY', label: 'Notificar' },
  { value: 'SET_PRIORITY', label: 'Alterar prioridade' },
  { value: 'ADD_COMMENT', label: 'Adicionar comentário' },
  { value: 'EMIT_EVENT', label: 'Emitir evento (automações)' },
  { value: 'SUSPEND_INSTANCE', label: 'Suspender o processo' },
  { value: 'CANCEL_INSTANCE', label: 'Cancelar o processo' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export function RecipientPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (t: string) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  const custom = value.filter((v) => !RECIPIENT_TOKENS.some((t) => t.value === v));
  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {RECIPIENT_TOKENS.map((t) => (
          <label key={t.value} className="flex items-center gap-1.5 font-body text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={value.includes(t.value)}
              disabled={disabled}
              onChange={() => toggle(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>
      <Input
        value={custom.join(', ')}
        disabled={disabled}
        placeholder="ou IDs de utilizadores, separados por vírgula"
        onChange={(e) =>
          onChange([
            ...value.filter((v) => RECIPIENT_TOKENS.some((t) => t.value === v)),
            ...e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => /^\d+$/.test(s)),
          ])
        }
        className="mt-2 w-full"
      />
    </div>
  );
}

export interface ActionListEditorProps {
  value: ActionDraft[];
  onChange: (next: ActionDraft[]) => void;
  disabled?: boolean;
  emptyHint?: string;
}

export function ActionListEditor({ value, onChange, disabled, emptyHint }: ActionListEditorProps) {
  const patch = (i: number, p: Partial<ActionDraft>) =>
    onChange(value.map((a, idx) => (idx === i ? { ...a, ...p } : a)));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="font-body text-xs text-ink-faint">{emptyHint ?? 'Sem acções.'}</p>
      )}
      {value.map((a, i) => (
        <div key={i} className="rounded-card border border-border p-3">
          <div className="flex items-center gap-2">
            <Select
              items={TYPE_ITEMS}
              value={a.type}
              onValueChange={(v) => patch(i, { ...emptyAction(v as ActionType) })}
              disabled={disabled}
              className="w-60"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="ml-auto text-ink-faint hover:text-danger"
                aria-label="Remover acção"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {a.type === 'NOTIFY' && (
              <>
                <RecipientPicker
                  value={a.recipients}
                  onChange={(recipients) => patch(i, { recipients })}
                  disabled={disabled}
                />
                <Textarea
                  rows={2}
                  value={a.message}
                  disabled={disabled}
                  onChange={(e) => patch(i, { message: e.target.value })}
                  placeholder="Mensagem (aceita {{form.campo}})"
                  className="w-full"
                />
              </>
            )}
            {a.type === 'SET_PRIORITY' && (
              <Select
                items={PRIORITIES}
                value={a.priority}
                onValueChange={(priority) => patch(i, { priority })}
                disabled={disabled}
                className="w-40"
              />
            )}
            {a.type === 'ADD_COMMENT' && (
              <Textarea
                rows={2}
                value={a.message}
                disabled={disabled}
                onChange={(e) => patch(i, { message: e.target.value })}
                placeholder="Comentário"
                className="w-full"
              />
            )}
            {a.type === 'EMIT_EVENT' && (
              <Input
                value={a.event}
                disabled={disabled}
                onChange={(e) => patch(i, { event: e.target.value })}
                placeholder="ex.: process.custom_event"
                className="w-full"
              />
            )}
            {(a.type === 'SUSPEND_INSTANCE' || a.type === 'CANCEL_INSTANCE') && (
              <Input
                value={a.reason}
                disabled={disabled}
                onChange={(e) => patch(i, { reason: e.target.value })}
                placeholder="Justificação registada"
                className="w-full"
              />
            )}
          </div>
        </div>
      ))}
      {!disabled && (
        <Button intent="ghost" size="sm" onClick={() => onChange([...value, emptyAction()])}>
          <Plus size={14} strokeWidth={1.75} />
          Adicionar acção
        </Button>
      )}
    </div>
  );
}
