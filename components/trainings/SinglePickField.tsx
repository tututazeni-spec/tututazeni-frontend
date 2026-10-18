// components/trainings/SinglePickField.tsx
// Escolha única numa lista, com a opção "Outro (escrever)" para valor manual.
// O valor é o texto guardado: um item da lista ou o texto escrito.

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const OTHER = '__other__';

interface SinglePickFieldProps {
  id: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  manualPlaceholder?: string;
}

export function SinglePickField({
  id,
  options,
  value,
  onChange,
  placeholder = 'Selecionar',
  manualPlaceholder = 'Escrever outro valor',
}: SinglePickFieldProps) {
  // Um valor fora da lista (manual ou de registos antigos) abre o modo manual.
  const [manual, setManual] = useState(
    value !== '' && !options.includes(value),
  );
  const items = [
    ...options.map((o) => ({ value: o, label: o })),
    { value: OTHER, label: 'Outro (escrever)' },
  ];

  return (
    <div className="space-y-2">
      <Select
        items={items}
        value={manual ? OTHER : value || undefined}
        onValueChange={(v) => {
          if (v === OTHER) {
            setManual(true);
            if (options.includes(value)) onChange('');
          } else {
            setManual(false);
            onChange(v);
          }
        }}
        className="w-full"
        placeholder={placeholder}
      />
      {manual && (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={manualPlaceholder}
          className="w-full"
          aria-label={manualPlaceholder}
        />
      )}
    </div>
  );
}
