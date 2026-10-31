// components/evaluation/performance/RatingScale.tsx
// Escala de desempenho 1–5 (docs/avaliacao_desempenho_robusta_claude_code.md §3):
// grupo de rádios segmentado, navegável por teclado (setas/Home/End), com o
// nome e a descrição do nível escolhido sempre visíveis — nunca só o número
// nem só a cor. Não existe zero: sem seleção significa "não avaliado".

'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FALLBACK_RATING_LEVELS, type RatingLevel } from './types';

export interface RatingScaleProps {
  /** Nome acessível do grupo (ex.: "Nota de Comunicação"). */
  label: string;
  value?: number;
  onChange: (v: number) => void;
  levels?: RatingLevel[];
  disabled?: boolean;
  /** Mostra a legenda completa dos 5 níveis em vez de só o selecionado. */
  showLegend?: boolean;
}

export function RatingScale({
  label,
  value,
  onChange,
  levels = FALLBACK_RATING_LEVELS,
  disabled,
  showLegend,
}: RatingScaleProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = levels.find((l) => l.value === value);
  // Roving tabindex: o nível escolhido (ou o primeiro) é o único com Tab.
  const tabbable = selected ? selected.value : levels[0]?.value;

  const move = (index: number) => {
    const next = (index + levels.length) % levels.length;
    refs.current[next]?.focus();
    onChange(levels[next].value);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(levels.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
      >
        {levels.map((l, i) => {
          const active = l.value === value;
          return (
            <button
              key={l.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${l.value} — ${l.label}`}
              title={`${l.value} — ${l.label}: ${l.description}`}
              tabIndex={l.value === tabbable ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(l.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-control border-[1.5px] px-1 py-1.5 text-center transition-colors',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-field-soft',
                'disabled:cursor-not-allowed disabled:opacity-50',
                active
                  ? 'border-brand bg-brand text-white'
                  : 'border-border-strong bg-surface text-ink-muted hover:border-brand hover:bg-surface-sunken',
              )}
            >
              <span className="flex items-center gap-1 text-base font-semibold leading-none">
                {active && <Check size={14} strokeWidth={2.5} aria-hidden />}
                {l.value}
              </span>
              <span className="hidden text-[11px] leading-tight sm:block">
                {l.label}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="min-h-[1.25rem] text-xs text-ink-muted"
        aria-live="polite"
        data-testid="rating-description"
      >
        {selected ? (
          <>
            <span className="font-semibold text-ink">
              {selected.value} — {selected.label}.
            </span>{' '}
            {selected.description}
          </>
        ) : (
          'Sem nota — passe o cursor ou escolha um nível para ver o significado.'
        )}
      </p>

      {showLegend && (
        <ul className="grid gap-1 text-xs text-ink-muted sm:grid-cols-2">
          {levels.map((l) => (
            <li key={l.value}>
              <span className="font-semibold text-ink">
                {l.value} — {l.label}:
              </span>{' '}
              {l.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
