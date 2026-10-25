// components/users/createUser/fields.tsx
// Campos reutilizáveis do formulário «Novo Utilizador» (apresentação).

import { X } from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ComboboxOption } from '@/components/ui/Combobox';
import type { Option } from '../createUserData';

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Hoisted fora de CreateUserView: definir um componente dentro doutro
// componente cria uma nova identidade de tipo a cada render — React
// desmonta e remonta toda a subárvore a cada keystroke em qualquer campo.
export function Field({
  label,
  id,
  type = 'text',
  required = false,
  value,
  onChange,
}: FieldProps) {
  return (
    <FormField label={required ? `${label} *` : label} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </FormField>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-2">
      <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3 pb-2 border-b border-border">
        {children}
      </div>
    </div>
  );
}

interface EnumSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
}

export function EnumSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: EnumSelectProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select
        items={options}
        value={value || undefined}
        onValueChange={onChange}
        placeholder={placeholder ?? 'Selecionar…'}
        className="w-full"
      />
    </FormField>
  );
}

interface ListFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ComboboxOption[];
  custom?: boolean;
}

/** Lista de escolha pesquisável que também aceita um valor escrito à mão
 *  (Combobox allowCustom): serve os campos "lista ou manual". */
export function ListField({
  id,
  label,
  value,
  onChange,
  options,
  custom = false,
}: ListFieldProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <Combobox
        items={options}
        value={value || undefined}
        onValueChange={onChange}
        placeholder="Selecionar…"
        searchPlaceholder={
          custom ? 'Escreva para filtrar ou indicar outro…' : undefined
        }
        allowCustom={custom}
      />
    </FormField>
  );
}

interface MultiPickerProps {
  id: string;
  label: string;
  options: Option[];
  loading?: boolean;
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

/** Picker de múltiplas entidades (cursos/percursos/competências/permissões):
 *  Combobox para adicionar + chips removíveis. Usado 4× nesta vista. */
export function MultiPicker({
  id,
  label,
  options,
  loading,
  selected,
  onChange,
  placeholder = 'Adicionar…',
}: MultiPickerProps) {
  const selectedSet = new Set(selected);
  const available = options.filter((o) => !selectedSet.has(Number(o.value)));
  const labelFor = (pid: number) =>
    options.find((o) => Number(o.value) === pid)?.label ?? `#${pid}`;

  return (
    <FormField label={label} htmlFor={id}>
      <Combobox
        items={available}
        value={undefined}
        onValueChange={(v) => {
          const pid = Number(v);
          if (!Number.isNaN(pid)) onChange([...selected, pid]);
        }}
        placeholder={loading ? 'A carregar…' : placeholder}
        disabled={loading}
      />
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((pid) => (
            <span
              key={pid}
              className="inline-flex items-center gap-1 rounded-control bg-surface-sunken px-2 py-1 text-xs text-ink"
            >
              {labelFor(pid)}
              <button
                type="button"
                aria-label="Remover"
                onClick={() => onChange(selected.filter((s) => s !== pid))}
                className="text-ink-muted hover:text-ink"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
    </FormField>
  );
}
