// components/trainings/ScheduleField.tsx
// Horário da formação: escolha da hora de início/fim e dos dias da semana.
// Guarda um texto único, ex.: "09:00–13:00 · Seg, Qua" (formato lido por
// parseSchedule, para voltar a preencher os campos ao editar).

'use client';

import { Input } from '@/components/ui/Input';
import { WEEKDAY_OPTIONS } from './trainingOptions';

export interface ScheduleValue {
  start: string;
  end: string;
  days: string[];
}

const SCHEDULE_RE = /^(\d{2}:\d{2})–(\d{2}:\d{2})(?: · (.+))?$/;

/** null quando o texto não segue o formato (horário antigo, escrito à mão). */
export function parseSchedule(text: string): ScheduleValue | null {
  const m = SCHEDULE_RE.exec(text.trim());
  if (!m) return null;
  return {
    start: m[1],
    end: m[2],
    days: m[3] ? m[3].split(',').map((d) => d.trim()) : [],
  };
}

export function formatSchedule({ start, end, days }: ScheduleValue): string {
  const hours = start && end ? `${start}–${end}` : start || end;
  if (!hours) return days.join(', ');
  return days.length ? `${hours} · ${days.join(', ')}` : hours;
}

interface ScheduleFieldProps {
  value: ScheduleValue;
  onChange: (value: ScheduleValue) => void;
  /** Horário antigo em texto livre, mostrado enquanto nada for escolhido. */
  legacy?: string;
}

export function ScheduleField({ value, onChange, legacy }: ScheduleFieldProps) {
  const toggleDay = (d: string) =>
    onChange({
      ...value,
      days: value.days.includes(d)
        ? value.days.filter((x) => x !== d)
        : WEEKDAY_OPTIONS.filter((w) => w === d || value.days.includes(w)),
    });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-ink-muted">
          Hora de início
          <Input
            type="time"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="w-full"
          />
        </label>
        <label className="space-y-1 text-xs text-ink-muted">
          Hora de fim
          <Input
            type="time"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="w-full"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dias">
        {WEEKDAY_OPTIONS.map((d) => {
          const on = value.days.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              onClick={() => toggleDay(d)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                on
                  ? 'border-brand bg-brand text-white'
                  : 'border-border text-ink-muted hover:border-brand'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      {legacy && (
        <p className="text-xs text-ink-faint">
          Horário actual: {legacy}. Escolhe horas ou dias para o substituir.
        </p>
      )}
    </div>
  );
}
