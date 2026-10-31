// components/live-classes/wizard/ContentFields.tsx
// Campos da etapa "Conteúdo" do assistente "Nova Aula": editor de lista com
// modo manual (objetivos, agenda), lista de tópicos e seletor de materiais da
// Biblioteca. Sem estado de formulário próprio — o valor vive no WizardForm.

'use client';

import { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PeriodPills } from '@/components/ui/Pills';
import { Textarea } from '@/components/ui/Textarea';
import { useDocumentSearch } from './wizardData';
import type { WizardMaterial } from './wizardTypes';

export const splitLines = (value: string): string[] =>
  value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

interface ItemListProps {
  items: string[];
  onChange: (items: string[]) => void;
  inputId: string;
  placeholder: string;
  addLabel: string;
}

/** Lista de itens curtos: escreve-se um, Enter ou "Adicionar" acrescenta. */
export function ItemList({
  items,
  onChange,
  inputId,
  placeholder,
  addLabel,
}: ItemListProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={`${i}-${item}`}
              className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-sm text-ink"
            >
              <span className="min-w-0 flex-1 break-words">{item}</span>
              <button
                type="button"
                aria-label={`Remover: ${item}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-ink-muted hover:text-danger-ink"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full"
        />
        <Button
          type="button"
          intent="secondary"
          size="compact"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus size={14} strokeWidth={1.75} />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

type Mode = 'list' | 'text';
const MODE_OPTIONS = [
  { value: 'list' as const, label: 'Lista' },
  { value: 'text' as const, label: 'Manual' },
];

interface ListOrTextFieldProps {
  label: string;
  inputId: string;
  value: string; // um item por linha
  onChange: (value: string) => void;
  placeholder: string;
  addLabel: string;
  textRows?: number;
}

/** Lista de itens OU texto livre; ambos guardam-se como texto (um item por linha). */
export function ListOrTextField({
  label,
  inputId,
  value,
  onChange,
  placeholder,
  addLabel,
  textRows = 4,
}: ListOrTextFieldProps) {
  const [mode, setMode] = useState<Mode>('list');

  return (
    <FormField label={label} htmlFor={inputId}>
      <div className="space-y-2">
        <PeriodPills
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
          label={`Modo de edição: ${label}`}
        />
        {mode === 'list' ? (
          <ItemList
            items={splitLines(value)}
            onChange={(items) => onChange(items.join('\n'))}
            inputId={inputId}
            placeholder={placeholder}
            addLabel={addLabel}
          />
        ) : (
          <Textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={textRows}
            className="w-full resize-none"
            placeholder="Escreve livremente (uma linha por item)."
          />
        )}
      </div>
    </FormField>
  );
}

interface MaterialsPickerProps {
  value: WizardMaterial[];
  onChange: (value: WizardMaterial[]) => void;
}

/** Pesquisa na Biblioteca (`/documents`) e escolhe vários documentos. */
export function MaterialsPicker({ value, onChange }: MaterialsPickerProps) {
  const [search, setSearch] = useState('');
  const { results, loading } = useDocumentSearch(search);
  const chosen = new Set(value.map((m) => m.id));
  const available = results.filter((d) => !chosen.has(d.id));

  return (
    <FormField
      label="Materiais da Biblioteca"
      htmlFor="lc-materials"
      hint="Pesquisa por título (mínimo 2 letras) e escolhe os documentos."
    >
      <div className="space-y-2">
        {value.length > 0 && (
          <ul className="space-y-1">
            {value.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-sm text-ink"
              >
                <FileText size={14} strokeWidth={1.75} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{m.title}</span>
                <button
                  type="button"
                  aria-label={`Remover material: ${m.title}`}
                  onClick={() => onChange(value.filter((x) => x.id !== m.id))}
                  className="text-ink-muted hover:text-danger-ink"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Input
          id="lc-materials"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar documento na Biblioteca…"
          className="w-full"
        />
        {search.trim().length >= 2 && (
          <div className="max-h-44 overflow-y-auto rounded-control border border-line bg-surface">
            {loading ? (
              <p className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</p>
            ) : available.length === 0 ? (
              <p className="px-3 py-2 text-sm text-ink-muted">
                Nenhum documento encontrado.
              </p>
            ) : (
              available.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onChange([...value, { id: d.id, title: d.title }]);
                    setSearch('');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunken"
                >
                  <Plus size={14} strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">{d.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </FormField>
  );
}
