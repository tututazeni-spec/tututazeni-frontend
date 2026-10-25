// components/trainings/plans/MultiPickField.tsx
// Escolha múltipla numa lista, com entrada manual opcional. O valor é o texto
// guardado no backend: itens separados por quebra de linha. Itens que não
// constam da lista (escritos à mão ou de planos antigos) aparecem como chips.

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

export function parsePickValue(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface MultiPickFieldProps {
  id: string;
  options: string[];
  /** Texto guardado: itens separados por '\n'. */
  value: string;
  onChange: (value: string) => void;
  /** Permite acrescentar itens manualmente além da lista. */
  allowManual?: boolean;
  manualPlaceholder?: string;
}

export function MultiPickField({
  id,
  options,
  value,
  onChange,
  allowManual = false,
  manualPlaceholder = 'Escrever outro item',
}: MultiPickFieldProps) {
  const [draft, setDraft] = useState('');
  const selected = parsePickValue(value);
  const custom = selected.filter((s) => !options.includes(s));

  const emit = (items: string[]) => onChange(items.join('\n'));
  const toggle = (item: string) =>
    emit(
      selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item],
    );

  function addManual() {
    const item = draft.trim();
    if (!item) return;
    if (!selected.includes(item)) emit([...selected, item]);
    setDraft('');
  }

  return (
    <div className="space-y-2">
      <div
        id={id}
        className="max-h-40 space-y-1 overflow-y-auto rounded-control border border-border p-2"
      >
        {options.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2 text-xs text-ink-muted"
          >
            <Checkbox
              checked={selected.includes(o)}
              onChange={() => toggle(o)}
            />
            {o}
          </label>
        ))}
      </div>

      {custom.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {custom.map((c) => (
            <li
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 text-xs text-ink"
            >
              {c}
              <IconButton
                icon={X}
                label={`Remover ${c}`}
                intent="ghost"
                size="xs"
                type="button"
                onClick={() => toggle(c)}
              />
            </li>
          ))}
        </ul>
      )}

      {allowManual && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addManual();
              }
            }}
            placeholder={manualPlaceholder}
            className="w-full"
            aria-label={manualPlaceholder}
          />
          <Button
            type="button"
            intent="secondary"
            size="sm"
            onClick={addManual}
            disabled={!draft.trim()}
          >
            <Plus size={14} strokeWidth={1.75} />
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
