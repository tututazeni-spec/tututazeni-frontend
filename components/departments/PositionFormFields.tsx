// components/departments/PositionFormFields.tsx
// Campos do modal "Novo cargo": escolher numa lista ou escrever à mão, e
// escolher vários itens sugeridos / acrescentar os seus.

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const OTHER = '__OTHER__';

interface ChoiceOrManualFieldProps {
  id: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  manualPlaceholder?: string;
  maxLength?: number;
}

/** Lista para escolher, com a opção "Outro" para escrever manualmente. */
export function ChoiceOrManualField({
  id,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  manualPlaceholder,
  maxLength,
}: ChoiceOrManualFieldProps) {
  const [manual, setManual] = useState(
    value !== '' && !options.includes(value),
  );
  const selectValue = manual
    ? OTHER
    : options.includes(value)
      ? value
      : undefined;

  return (
    <div className="space-y-2">
      <Select
        items={[
          ...options.map((o) => ({ value: o, label: o })),
          { value: OTHER, label: 'Outro (escrever manualmente)' },
        ]}
        value={selectValue}
        placeholder={placeholder}
        className="w-full"
        onValueChange={(v) => {
          if (v === OTHER) {
            setManual(true);
            if (options.includes(value)) onChange('');
          } else {
            setManual(false);
            onChange(v);
          }
        }}
      />
      {manual && (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={manualPlaceholder}
          maxLength={maxLength}
        />
      )}
    </div>
  );
}

interface ItemListPickerProps {
  /** Itens sugeridos (ex.: responsabilidades da função escolhida). */
  suggestions: string[];
  value: string[];
  onChange: (value: string[]) => void;
  addPlaceholder: string;
  emptyHint: string;
}

/** Escolher vários itens sugeridos e/ou acrescentar os seus à mão. */
export function ItemListPicker({
  suggestions,
  value,
  onChange,
  addPlaceholder,
  emptyHint,
}: ItemListPickerProps) {
  const [draft, setDraft] = useState('');
  const custom = value.filter((v) => !suggestions.includes(v));
  const allSelected =
    suggestions.length > 0 && suggestions.every((s) => value.includes(s));

  const toggle = (item: string) =>
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item],
    );
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    if (!value.includes(text)) onChange([...value, text]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {suggestions.length > 0 ? (
        <div className="rounded-card border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-ink-muted">
              Sugestões para esta função
            </span>
            <Button
              type="button"
              size="sm"
              intent="ghost"
              onClick={() =>
                onChange(
                  allSelected
                    ? value.filter((v) => !suggestions.includes(v))
                    : [
                        ...value,
                        ...suggestions.filter((s) => !value.includes(s)),
                      ],
                )
              }
            >
              {allSelected ? 'Limpar' : 'Seleccionar todas'}
            </Button>
          </div>
          <ul className="max-h-44 divide-y divide-border overflow-y-auto">
            {suggestions.map((s) => (
              <li key={s}>
                <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-sunken/60">
                  <Checkbox
                    className="mt-0.5"
                    checked={value.includes(s)}
                    onChange={() => toggle(s)}
                  />
                  <span>{s}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">{emptyHint}</p>
      )}

      {custom.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {custom.map((c) => (
            <li
              key={c}
              className="flex items-start justify-between gap-2 rounded-card bg-surface-sunken px-3 py-1.5 text-sm text-ink"
            >
              <span>{c}</span>
              <button
                type="button"
                aria-label={`Remover «${c}»`}
                onClick={() => toggle(c)}
                className="mt-0.5 text-ink-faint hover:text-danger"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={addPlaceholder}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          intent="secondary"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus size={14} strokeWidth={1.75} />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
