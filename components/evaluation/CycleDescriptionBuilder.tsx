// components/evaluation/CycleDescriptionBuilder.tsx
// Descrição do ciclo de avaliação: em vez de uma caixa de texto vazia, três
// listas para escolher (Âmbito, Objectivos, Notas para os participantes), cada
// uma com a possibilidade de acrescentar uma opção manual fora da lista, mais
// um texto livre. A escolha compõe o texto da descrição (um único campo no
// backend: `description`).

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { pillClass } from '@/components/ui/Pills';

interface Group {
  key: 'scope' | 'objectives' | 'notes';
  label: string;
  /** Prefixo da secção no texto final. */
  heading: string;
  options: readonly string[];
  placeholder: string;
}

const GROUPS: readonly Group[] = [
  {
    key: 'scope',
    label: 'Âmbito',
    heading: 'Âmbito',
    options: [
      'Toda a empresa',
      'Por departamento',
      'Por equipa',
      'Cargos de liderança',
      'Novos colaboradores',
      'Por função ou cargo',
    ],
    placeholder: 'Outro âmbito…',
  },
  {
    key: 'objectives',
    label: 'Objectivos',
    heading: 'Objectivos',
    options: [
      'Avaliar o desempenho do período',
      'Identificar pontos fortes e áreas de melhoria',
      'Apoiar decisões de carreira e promoção',
      'Alimentar os planos de desenvolvimento (PDI)',
      'Alinhar o desempenho com as metas da empresa',
      'Reconhecer o bom desempenho',
    ],
    placeholder: 'Outro objectivo…',
  },
  {
    key: 'notes',
    label: 'Notas para os participantes',
    heading: 'Notas para os participantes',
    options: [
      'As respostas são confidenciais',
      'Responde com honestidade e exemplos concretos',
      'Reserva cerca de 20 minutos para concluir',
      'O prazo final não será prorrogado',
      'Em caso de dúvida, contacta o RH',
    ],
    placeholder: 'Outra nota…',
  },
];

type Selection = Record<Group['key'], string[]>;

const EMPTY: Selection = { scope: [], objectives: [], notes: [] };

/** Junta as escolhas e o texto livre no texto da descrição. */
export function composeDescription(sel: Selection, free: string): string {
  const parts = GROUPS.filter((g) => sel[g.key].length > 0).map(
    (g) => `${g.heading}: ${sel[g.key].join('; ')}.`,
  );
  if (free.trim()) parts.push(free.trim());
  return parts.join('\n');
}

interface Props {
  onChange: (description: string) => void;
}

export function CycleDescriptionBuilder({ onChange }: Props) {
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [free, setFree] = useState('');
  const [draft, setDraft] = useState<Record<Group['key'], string>>({
    scope: '',
    objectives: '',
    notes: '',
  });

  const commit = (next: Selection, nextFree: string) => {
    setSel(next);
    setFree(nextFree);
    onChange(composeDescription(next, nextFree));
  };

  const toggle = (key: Group['key'], value: string) => {
    const has = sel[key].includes(value);
    commit(
      {
        ...sel,
        [key]: has ? sel[key].filter((v) => v !== value) : [...sel[key], value],
      },
      free,
    );
  };

  const addManual = (key: Group['key']) => {
    const value = draft[key].trim();
    if (!value) return;
    setDraft((d) => ({ ...d, [key]: '' }));
    if (sel[key].includes(value)) return;
    commit({ ...sel, [key]: [...sel[key], value] }, free);
  };

  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        // Opções acrescentadas à mão ficam junto das da lista, removíveis.
        const manual = sel[g.key].filter((v) => !g.options.includes(v));
        return (
          <div key={g.key}>
            <div className="mb-1.5 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {g.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const active = sel[g.key].includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(g.key, o)}
                    className={cn(pillClass(active), 'py-1 text-xs')}
                  >
                    {o}
                  </button>
                );
              })}
              {manual.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-label={`Remover ${o}`}
                  onClick={() => toggle(g.key, o)}
                  className={cn(
                    pillClass(true),
                    'inline-flex items-center gap-1 py-1 text-xs',
                  )}
                >
                  {o}
                  <X size={12} strokeWidth={2} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={draft[g.key]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [g.key]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addManual(g.key);
                  }
                }}
                placeholder={g.placeholder}
                aria-label={`Acrescentar ${g.label.toLowerCase()} manualmente`}
                className="w-full"
              />
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onClick={() => addManual(g.key)}
                disabled={!draft[g.key].trim()}
              >
                <Plus size={14} strokeWidth={1.75} />
                Adicionar
              </Button>
            </div>
          </div>
        );
      })}

      <div>
        <div className="mb-1.5 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Texto livre (opcional)
        </div>
        <Textarea
          value={free}
          onChange={(e) => commit(sel, e.target.value)}
          className="w-full"
          rows={2}
          placeholder="Qualquer outra informação sobre o ciclo…"
        />
      </div>
    </div>
  );
}
