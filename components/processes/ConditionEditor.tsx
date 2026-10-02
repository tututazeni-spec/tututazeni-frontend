// components/processes/ConditionEditor.tsx
// Editor de condições {E/OU + linhas campo/operador/valor}, partilhado pelo
// construtor de fluxos (condições de entrada / para avançar) e pelas
// regras de Automações.

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ConditionDraft, ConditionRowDraft } from './workflow-model';

export interface FieldOption {
  value: string;
  label: string;
}

export const OPERATORS: FieldOption[] = [
  { value: 'equals', label: 'é igual a' },
  { value: 'not_equals', label: 'é diferente de' },
  { value: 'contains', label: 'contém' },
  { value: 'not_contains', label: 'não contém' },
  { value: 'greater_than', label: 'é maior que' },
  { value: 'less_than', label: 'é menor que' },
  { value: 'is_empty', label: 'está vazio' },
  { value: 'is_not_empty', label: 'não está vazio' },
];

const FORM = '__form';

export interface ConditionEditorProps {
  value: ConditionDraft | null;
  onChange: (next: ConditionDraft | null) => void;
  fields: FieldOption[];
  /** Permite campos livres `form.<nome>` (dados de formulário). */
  allowFormFields?: boolean;
  disabled?: boolean;
  emptyHint?: string;
}

export function ConditionEditor({
  value,
  onChange,
  fields,
  allowFormFields = false,
  disabled,
  emptyHint = 'Sem condições.',
}: ConditionEditorProps) {
  const rows = value?.rows ?? [];
  const logic = value?.logic ?? 'AND';

  const items = allowFormFields
    ? [...fields, { value: FORM, label: 'Campo de formulário…' }]
    : fields;

  const patch = (i: number, p: Partial<ConditionRowDraft>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...p } : r));
    onChange({ logic, rows: next });
  };
  const add = () =>
    onChange({
      logic,
      rows: [...rows, { field: fields[0]?.value ?? '', operator: 'equals', value: '' }],
    });
  const remove = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? { logic, rows: next } : null);
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="font-body text-xs text-ink-faint">{emptyHint}</p>
      )}
      {rows.length > 1 && (
        <Select
          items={[
            { value: 'AND', label: 'Todas as condições (E)' },
            { value: 'OR', label: 'Qualquer condição (OU)' },
          ]}
          value={logic}
          onValueChange={(v) => onChange({ logic: v as 'AND' | 'OR', rows })}
          disabled={disabled}
          className="w-56"
        />
      )}
      {rows.map((r, i) => {
        const isForm = allowFormFields && r.field.startsWith('form.');
        const fieldValue = isForm ? FORM : r.field;
        const needsValue = r.operator !== 'is_empty' && r.operator !== 'is_not_empty';
        return (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Select
              items={items}
              value={fieldValue}
              onValueChange={(v) => patch(i, { field: v === FORM ? 'form.' : v })}
              disabled={disabled}
              className="w-52"
            />
            {isForm && (
              <Input
                value={r.field.slice(5)}
                onChange={(e) => patch(i, { field: `form.${e.target.value}` })}
                placeholder="nome do campo"
                disabled={disabled}
                className="w-36"
              />
            )}
            <Select
              items={OPERATORS}
              value={r.operator}
              onValueChange={(v) => patch(i, { operator: v })}
              disabled={disabled}
              className="w-40"
            />
            {needsValue && (
              <Input
                value={r.value}
                onChange={(e) => patch(i, { value: e.target.value })}
                placeholder="valor"
                disabled={disabled}
                className="w-40"
              />
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-ink-faint hover:text-danger"
                aria-label="Remover condição"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        );
      })}
      {!disabled && (
        <Button intent="ghost" size="sm" onClick={add}>
          <Plus size={14} strokeWidth={1.75} />
          Adicionar condição
        </Button>
      )}
    </div>
  );
}
