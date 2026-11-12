// components/competencies/LevelMultiField.tsx
// Campo de escolha múltipla do modal de nível: escolhe-se mais de um item da
// lista e/ou escreve-se à mão. Guardado como texto, um item por linha (a API
// continua a receber uma string; valores antigos de uma só linha continuam
// válidos).

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MultiCombobox } from '@/components/ui/MultiCombobox';

export function parseLevelItems(text: string): string[] {
  return text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function joinLevelItems(items: string[]): string {
  return items.join('\n');
}

interface LevelMultiFieldProps {
  id: string;
  options: Array<{ value: string; label: string }>;
  /** Texto guardado (itens separados por quebra de linha). */
  value: string;
  onChange: (value: string) => void;
}

export function LevelMultiField({
  id,
  options,
  value,
  onChange,
}: LevelMultiFieldProps) {
  const [draft, setDraft] = useState('');
  const selected = parseLevelItems(value);
  const suggestionValues = options.map((o) => o.value);
  const custom = selected.filter((s) => !suggestionValues.includes(s));

  const update = (items: string[]) => onChange(joinLevelItems(items));

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    if (!selected.includes(text)) update([...selected, text]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <MultiCombobox
        items={options}
        value={selected.filter((s) => suggestionValues.includes(s))}
        onValueChange={(picked) => update([...picked, ...custom])}
        label="Selecionar da lista (pode escolher vários)"
        searchPlaceholder="Escreva para filtrar…"
      />
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
                onClick={() => update(selected.filter((s) => s !== c))}
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
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ou escreva outro e prima Enter…"
          className="w-full"
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
