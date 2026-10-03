// components/crm/beneficiaries/FieldRenderer.tsx
// Renderiza um campo descrito em formConfig.ts (input/select/combobox/etc.).

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/crm/shared';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { provinceOptions, type FieldDef } from './formConfig';

interface FieldRendererProps {
  def: FieldDef;
  value: string;
  onChange: (value: string) => void;
}

export function FieldRenderer({ def, value, onChange }: FieldRendererProps) {
  let control: React.ReactNode;
  switch (def.kind) {
    case 'select':
      control = (
        <Select
          value={value}
          onValueChange={onChange}
          items={def.options ?? []}
        />
      );
      break;
    case 'province':
      control = (
        <Select
          value={value}
          onValueChange={onChange}
          items={provinceOptions}
        />
      );
      break;
    case 'country':
      control = (
        <Combobox
          value={value}
          onValueChange={onChange}
          placeholder="Selecionar país…"
          searchPlaceholder="Escreva a inicial do país…"
          items={COUNTRY_OPTIONS}
        />
      );
      break;
    case 'textarea':
      control = (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      );
      break;
    default:
      control = (
        <Input
          required={def.required}
          type={
            def.kind === 'date'
              ? 'date'
              : def.kind === 'number'
                ? 'number'
                : def.kind === 'email'
                  ? 'email'
                  : 'text'
          }
          min={def.kind === 'number' ? 0 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
  return (
    <div className={def.wide ? 'md:col-span-2' : undefined}>
      <Field label={def.label}>{control}</Field>
    </div>
  );
}
