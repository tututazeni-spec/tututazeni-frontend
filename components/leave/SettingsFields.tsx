// components/leave/SettingsFields.tsx
// Primitivas de formulário das Configurações do módulo Leave
// (docs/Modulo_Leave.md §10): secção com título, interruptor com descrição,
// campo numérico opcional e selector de dias da semana.

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { WEEKDAYS, parseOptionalInt } from './settingsMeta';

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description && (
          <p className="text-xs text-ink-faint mt-0.5">{description}</p>
        )}
      </div>
      {children}
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
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border-strong accent-primary flex-shrink-0"
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
              'rounded-control border px-3 py-1.5 text-xs font-semibold transition-colors',
              on
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken',
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
