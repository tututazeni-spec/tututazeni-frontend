// components/leave/SettingsFields.tsx
// Primitivas de formulário das Configurações do módulo Leave
// (docs/Modulo_Leave.md §10): secção com título, interruptor com descrição,
// campo numérico opcional e selector de dias da semana.

'use client';

import type { ReactNode } from 'react';
import {
  ArrowRightLeft,
  Ban,
  Calculator,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Clock,
  FileText,
  Hourglass,
  Layers,
  MapPin,
  Plug,
  Settings2,
  ShieldCheck,
  Tags,
  UserCog,
  UserRoundCheck,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { WEEKDAYS, parseOptionalInt } from './settingsMeta';
import { Checkbox } from '@/components/ui/Checkbox';

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  'Ano de referência e período de férias': CalendarDays,
  'Semana de trabalho e horário': Clock,
  'Regra de contagem de dias': Calculator,
  'Transição de dias': ArrowRightLeft,
  'Limites de antecedência': CalendarClock,
  'Documentos e substituto': FileText,
  'Prazos de decisão e escalonamento': Hourglass,
  'Cancelamento e alteração': Ban,
  'Categorias justificadas e injustificadas': Tags,
  'Cobertura operacional': Layers,
  'Permissões do gestor': ShieldCheck,
  Integrações: Plug,
  'Nova substituição': UserRoundPlus,
  'Localização e ano': MapPin,
  'Acrescentar feriado': CalendarPlus,
  'Configurados por si': UserCog,
  Substituições: UserRoundCheck,
  'As minhas substituições': UserRoundCheck,
};

export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Conteúdo à direita do cabeçalho (ex.: estado). */
  actions?: ReactNode;
}

/** Cabeçalho azul-marinho das secções: ícone redondo, divisor e título. */
export function SectionHeader({
  title,
  description,
  icon,
  actions,
}: SectionHeaderProps) {
  const Icon = icon ?? SECTION_ICONS[title] ?? Settings2;
  return (
    <div className="relative flex items-center gap-4 overflow-hidden bg-gradient-to-r from-[#0B1730] via-[#0F1F3D] to-[#1D4ED8] px-5 py-4 text-white">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/30">
        <Icon size={24} strokeWidth={1.75} />
      </span>
      <span aria-hidden className="h-10 w-px shrink-0 bg-white/30" />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-tight">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-white/80">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card className="overflow-hidden p-0">
      <SectionHeader title={title} description={description} />
      <div className="space-y-4 p-5">{children}</div>
    </Card>
  );
}

export interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 py-2.5 border-b border-border last:border-0',
        disabled ? 'opacity-60' : 'cursor-pointer',
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 flex-shrink-0"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="block text-xs text-ink-faint">{description}</span>
        )}
      </span>
    </label>
  );
}

export interface OptionalNumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

/** Campo numérico em que vazio = "sem limite" (null). */
export function OptionalNumberField({
  id,
  label,
  hint,
  value,
  onChange,
  min = 0,
  max,
  suffix,
}: OptionalNumberFieldProps) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          placeholder="Sem limite"
          value={value ?? ''}
          onChange={(e) => onChange(parseOptionalInt(e.target.value))}
          className="w-full"
        />
        {suffix && (
          <span className="text-xs text-ink-faint whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </FormField>
  );
}

export interface RequiredNumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}

export function RequiredNumberField({
  id,
  label,
  hint,
  value,
  onChange,
  min,
  max,
  suffix,
}: RequiredNumberFieldProps) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="w-full"
        />
        {suffix && (
          <span className="text-xs text-ink-faint whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </FormField>
  );
}

export interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const toggle = (day: number) =>
    onChange(
      value.includes(day)
        ? value.filter((d) => d !== day)
        : [...value, day].sort((a, b) => a - b),
    );
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Dias úteis">
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={on}
            title={d.label}
            onClick={() => toggle(d.value)}
            className={cn(
              'rounded-full border-[1.5px] px-5 py-2 text-sm font-semibold transition-colors',
              on
                ? 'border-[#0F1F3D] bg-[#0F1F3D] text-white'
                : 'border-[#0F1F3D]/20 bg-surface text-[#0F1F3D] hover:bg-[#EEF2FC]',
            )}
          >
            {d.short}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipMultiSelectProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T[];
  onChange: (next: T[]) => void;
  ariaLabel: string;
}

export function ChipMultiSelect<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ChipMultiSelectProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on ? value.filter((v) => v !== o.value) : [...value, o.value],
              )
            }
            className={cn(
              'rounded-control border px-2.5 py-1 text-xs transition-colors',
              on
                ? 'border-primary bg-primary-subtle text-primary font-semibold'
                : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
