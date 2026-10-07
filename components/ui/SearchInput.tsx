// components/ui/SearchInput.tsx
// Barra de pesquisa em cápsula (minimalista orgânico) com sugestões
// preditivas: `suggestions` explícitas, ou — por omissão — as pesquisas
// anteriores do utilizador que começam pelo texto escrito.
'use client';

import { forwardRef, useId, useMemo, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'list'
> {
  suggestions?: string[];
  /** Chave para guardar o histórico local; sem ela não há sugestões automáticas. */
  historyKey?: string;
  invalid?: boolean;
}

const MAX_SUGGESTIONS = 6;
const MAX_HISTORY = 20;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function readHistory(key?: string): string[] {
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(`search-history:${key}`);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeHistory(key: string | undefined, term: string) {
  const clean = term.trim();
  if (!key || clean.length < 2) return;
  try {
    const next = [
      clean,
      ...readHistory(key).filter((h) => normalize(h) !== normalize(clean)),
    ].slice(0, MAX_HISTORY);
    window.localStorage.setItem(`search-history:${key}`, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível — sugestões são só uma conveniência */
  }
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      suggestions,
      historyKey,
      invalid,
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [history, setHistory] = useState<string[]>([]);
    const text = typeof value === 'string' ? value : '';

    const options = useMemo(() => {
      const q = normalize(text);
      if (!q) return [];
      const pool = suggestions ?? history;
      return pool
        .filter((s) => normalize(s).startsWith(q) && normalize(s) !== q)
        .slice(0, MAX_SUGGESTIONS);
    }, [text, suggestions, history]);

    const emit = (next: string) => {
      onChange?.({
        target: { value: next },
        currentTarget: { value: next },
      } as ChangeEvent<HTMLInputElement>);
    };

    const pick = (term: string) => {
      emit(term);
      writeHistory(historyKey, term);
      setOpen(false);
      setActive(-1);
    };

    const showList = open && options.length > 0;

    return (
      <div className={cn('relative min-w-0', className)}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-pill border-[1.5px] border-field bg-surface px-4 py-[9px]',
            'focus-within:bg-field-soft focus-within:ring-[3px] focus-within:ring-field-soft',
            invalid && 'border-danger',
          )}
        >
          <Search
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-field"
            aria-hidden
          />
          <input
            ref={ref}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            autoComplete="off"
            value={value}
            onChange={(e) => {
              onChange?.(e);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={(e) => {
              setHistory(readHistory(historyKey));
              setOpen(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              writeHistory(historyKey, text);
              setOpen(false);
              onBlur?.(e);
            }}
            onKeyDown={(e) => {
              if (showList && e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => (a + 1) % options.length);
              } else if (showList && e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
              } else if (showList && e.key === 'Enter' && active >= 0) {
                e.preventDefault();
                pick(options[active]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
              onKeyDown?.(e);
            }}
            className="min-w-0 flex-1 bg-transparent font-body text-sm text-field-ink outline-none placeholder:text-ink-muted"
            {...props}
          />
          {text && (
            <button
              type="button"
              aria-label="Limpar pesquisa"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => emit('')}
              className="shrink-0 text-field hover:text-field-ink"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-card border border-field bg-surface p-1 shadow-elevated"
          >
            {options.map((opt, i) => (
              <li
                key={opt}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 font-body text-sm text-field-ink',
                  i === active && 'bg-field-soft',
                )}
              >
                <Search size={13} strokeWidth={1.75} className="text-field" />
                <span>
                  <strong className="font-semibold">
                    {opt.slice(0, text.trim().length)}
                  </strong>
                  {opt.slice(text.trim().length)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
