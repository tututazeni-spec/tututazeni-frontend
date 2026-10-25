// components/avatar-training/ChoiceOrCustom.tsx
// Escolha numa lista ou, com «Outro (escrever)», um valor livre. O valor
// guardado é sempre o texto final; um valor já gravado que não consta da lista
// abre directamente o campo de texto.

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const NONE = '__NONE__';
const OTHER = '__OTHER__';

export interface ChoiceOrCustomProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  placeholder?: string;
}

export function ChoiceOrCustom({
  id,
  label,
  value,
  options,
  onChange,
  emptyLabel = 'Sem indicação',
  placeholder = 'Escreve o valor',
}: ChoiceOrCustomProps) {
  const [custom, setCustom] = useState(!!value && !options.includes(value));
  return (
    <>
      <Select
        value={custom ? OTHER : value || NONE}
        onValueChange={(v) => {
          setCustom(v === OTHER);
          onChange(v === NONE || v === OTHER ? '' : v);
        }}
        items={[
          { value: NONE, label: emptyLabel },
          ...options.map((o) => ({ value: o, label: o })),
          { value: OTHER, label: 'Outro (escrever)' },
        ]}
      />
      {custom && (
        <Input
          id={id}
          className="mt-2"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          maxLength={120}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}
