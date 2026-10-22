// components/courses-modulos/ObjectivesPicker.tsx
// Objectivos de aprendizagem de um módulo: lista de sugestões para marcar
// (modelos genéricos + objectivos já usados noutros módulos do curso) e campo
// para escrever um objectivo à mão. O valor é sempre a lista final de textos.

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const SUGGESTED_OBJECTIVES = [
  'Compreender os conceitos fundamentais do tema',
  'Aplicar os conhecimentos adquiridos em situações reais de trabalho',
  'Identificar boas práticas e erros comuns',
  'Cumprir os procedimentos e normas da organização',
  'Analisar casos práticos e propor soluções',
  'Utilizar as ferramentas e os recursos necessários',
  'Comunicar e colaborar de forma eficaz com a equipa',
  'Avaliar resultados e identificar oportunidades de melhoria',
];

export const SUGGESTED_LESSON_OBJECTIVES = [
  'Reconhecer os principais conceitos apresentados na lição',
  'Descrever o processo ou procedimento passo a passo',
  'Aplicar o conteúdo num exemplo prático',
  'Distinguir situações correctas de situações incorrectas',
  'Resolver o exercício proposto no final da lição',
  'Resumir as ideias-chave da lição',
  'Relacionar o tema com a função desempenhada',
  'Preparar-se para a avaliação do módulo',
];

interface ObjectivesPickerProps {
  value: string[];
  /** Sugestões base; por omissão, as de módulo. */
  suggestions?: string[];
  onChange: (next: string[]) => void;
  /** Objectivos de outros módulos do curso, oferecidos como sugestões. */
  extraSuggestions?: string[];
}

export function ObjectivesPicker({
  value,
  onChange,
  suggestions: baseSuggestions = SUGGESTED_OBJECTIVES,
  extraSuggestions = [],
}: ObjectivesPickerProps) {
  const [manual, setManual] = useState('');

  const suggestions = [...new Set([...extraSuggestions, ...baseSuggestions])];
  const lower = (s: string) => s.trim().toLowerCase();
  const has = (s: string) => value.some((v) => lower(v) === lower(s));

  const toggle = (s: string) =>
    onChange(
      has(s) ? value.filter((v) => lower(v) !== lower(s)) : [...value, s],
    );

  const addManual = () => {
    const text = manual.trim();
    if (!text) return;
    if (!has(text)) onChange([...value, text]);
    setManual('');
  };

  return (
    <div className="space-y-2">
      <div className="max-h-40 overflow-y-auto rounded-control border-[1.5px] border-border-strong bg-surface">
        {suggestions.map((s) => (
          <label
            key={s}
            className="flex cursor-pointer items-start gap-2 border-b border-border px-3 py-2 text-sm text-ink last:border-0 hover:bg-surface-sunken"
          >
            <input
              type="checkbox"
              checked={has(s)}
              onChange={() => toggle(s)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-primary"
            />
            <span>{s}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addManual();
            }
          }}
          className="flex-1"
          placeholder="Escrever outro objectivo…"
          aria-label="Novo objectivo manual"
        />
        <Button
          type="button"
          intent="secondary"
          onClick={addManual}
          disabled={!manual.trim()}
        >
          <Plus size={16} strokeWidth={1.75} /> Adicionar
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((v) => (
            <li
              key={v}
              className="flex items-start gap-2 rounded-control bg-surface-sunken px-3 py-1.5 text-sm text-ink"
            >
              <span className="flex-1">{v}</span>
              <button
                type="button"
                aria-label={`Remover objectivo: ${v}`}
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="rounded-control p-0.5 text-ink-muted hover:text-ink"
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
