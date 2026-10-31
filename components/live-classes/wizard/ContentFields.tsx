// components/live-classes/wizard/ContentFields.tsx
// Campos da etapa "Conteúdo" do assistente "Nova Aula": editor de lista com
// modo manual (objetivos, agenda), lista de tópicos e seletor de materiais da
// Biblioteca. Sem estado de formulário próprio — o valor vive no WizardForm.

'use client';

import { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
  /** Opções do seletor (setinha): as do curso primeiro, depois as predefinidas. */
  options: string[];
  placeholder: string;
}

/**
 * Lista de itens escolhidos. O seletor com a setinha mostra as opções para
 * clicar; também se pode escrever um item próprio (Enter ou «Usar …»).
 */
export function ItemList({
  items,
  onChange,
  inputId,
  options,
  placeholder,
}: ItemListProps) {
  const choices = [...new Set(options)]
    .filter((o) => !items.includes(o))
    .map((o) => ({ value: o, label: o }));

  const add = (value: string) => {
    const v = value.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
  };

  return (
    <div className="space-y-2" id={inputId}>
      <Combobox
        items={choices}
        value=""
        onValueChange={add}
        placeholder={placeholder}
        searchPlaceholder="Escolhe da lista ou escreve o teu…"
        emptyText="Sem mais opções — escreve o teu"
        allowCustom
      />
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
    </div>
  );
}

interface ListFieldProps {
  label: string;
  inputId: string;
  value: string; // um item por linha
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}

/** Campo de lista (seletor + escrita manual); guarda-se como texto, um item por linha. */
export function ListOrTextField({
  label,
  inputId,
  value,
  onChange,
  placeholder,
  options,
}: ListFieldProps) {
  return (
    <FormField label={label} htmlFor={inputId}>
      <ItemList
        items={splitLines(value)}
        onChange={(items) => onChange(items.join('\n'))}
        inputId={inputId}
        placeholder={placeholder}
        options={options}
      />
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
