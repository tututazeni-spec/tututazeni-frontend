// components/courses/CohortSchedulePicker.tsx
// Horário de uma turma: dias da semana em pílulas (design de Pills.tsx) +
// hora de início e de fim com o campo de hora da plataforma (<Input type="time">,
// o mesmo de automation/SchedulesTab). Emite o texto "Seg/Qua 18:00-20:00",
// que é o que a turma guarda em `schedule` (campo de texto no backend).

'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { pillClass } from '@/components/ui/Pills';

const DAYS = [
  { key: 'Seg', label: 'Segunda-feira' },
  { key: 'Ter', label: 'Terça-feira' },
  { key: 'Qua', label: 'Quarta-feira' },
  { key: 'Qui', label: 'Quinta-feira' },
  { key: 'Sex', label: 'Sexta-feira' },
  { key: 'Sáb', label: 'Sábado' },
  { key: 'Dom', label: 'Domingo' },
] as const;

/** "Seg/Qua 18:00-20:00" — partes em falta são omitidas; vazio quando nada foi escolhido. */
export function formatSchedule(days: string[], start: string, end: string) {
  const dayPart = DAYS.map((d) => d.key)
    .filter((k) => days.includes(k))
    .join('/');
  const timePart = start && end ? `${start}-${end}` : start || end;
  return [dayPart, timePart].filter(Boolean).join(' ');
}

export interface CohortSchedulePickerProps {
  /** Recebe o horário já formatado (ou '' se nada estiver escolhido). */
  onChange: (schedule: string) => void;
  idPrefix?: string;
}

export function CohortSchedulePicker({
  onChange,
  idPrefix = 'ch-schedule',
}: CohortSchedulePickerProps) {
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const update = (nextDays: string[], nextStart: string, nextEnd: string) => {
    setDays(nextDays);
    setStart(nextStart);
    setEnd(nextEnd);
    onChange(formatSchedule(nextDays, nextStart, nextEnd));
  };

  const toggleDay = (key: string) =>
    update(
      days.includes(key) ? days.filter((d) => d !== key) : [...days, key],
      start,
      end,
    );

  const invalidRange = !!start && !!end && end <= start;

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Dias da semana"
        className="flex flex-wrap gap-2"
      >
        {DAYS.map((d) => {
          const active = days.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              aria-pressed={active}
              title={d.label}
              onClick={() => toggleDay(d.key)}
              className={pillClass(active)}
            >
              {d.key}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Das" htmlFor={`${idPrefix}-start`}>
          <Input
            id={`${idPrefix}-start`}
            type="time"
            value={start}
            onChange={(e) => update(days, e.target.value, end)}
            className="w-full"
          />
        </FormField>
        <FormField
          label="Às"
          htmlFor={`${idPrefix}-end`}
          error={
            invalidRange
              ? 'A hora de fim tem de ser depois do início'
              : undefined
          }
        >
          <Input
            id={`${idPrefix}-end`}
            type="time"
            value={end}
            min={start || undefined}
            onChange={(e) => update(days, start, e.target.value)}
            className="w-full"
          />
        </FormField>
      </div>
    </div>
  );
}
