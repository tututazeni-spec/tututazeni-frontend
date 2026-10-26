// components/development-plans/SuggestionField.tsx
// Campo de texto com lista de sugestões: o utilizador escolhe uma ou mais
// opções da lista ou escreve manualmente (ou mistura os dois). Em modo
// multilinha cada opção escolhida é uma linha do texto; clicar de novo
// retira-a. Em modo de linha única a opção substitui o texto.

'use client';

import { useState } from 'react';
import { Check, ListPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';

interface SuggestionFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function SuggestionField({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  multiline = true,
  rows = 2,
  disabled,
  className,
}: SuggestionFieldProps) {
  const [open, setOpen] = useState(false);
  const lines = multiline ? value.split('\n').map((l) => l.trim()) : [value];

  const toggle = (s: string) => {
    if (!multiline) {
      onChange(value === s ? '' : s);
      return;
    }
    const kept = value.split('\n').filter((l) => l.trim());
    onChange(
      lines.includes(s)
        ? kept.filter((l) => l.trim() !== s).join('\n')
        : [...kept, s].join('\n'),
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
      )}
      {!disabled && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            <ListPlus size={14} strokeWidth={1.75} />
            {open ? 'Fechar lista' : 'Escolher da lista'}
          </button>
          {open && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => {
                const active = lines.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(s)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-left text-xs transition-colors',
                      active
                        ? 'border-brand bg-brand text-white'
                        : 'border-brand-line bg-surface text-brand hover:border-brand',
                    )}
                  >
                    {active && <Check size={12} strokeWidth={2} />}
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
