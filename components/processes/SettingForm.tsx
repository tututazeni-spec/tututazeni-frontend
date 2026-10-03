// components/processes/SettingForm.tsx
// Renderizador genérico dos formulários de «Configurações» (§14), guiado pelos
// esquemas em setting-schemas.ts. Mantém o valor como JSON puro (o mesmo que o
// backend valida e guarda) e delega a validação autoritativa no servidor.

'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { FieldSpec, SectionSchema } from './setting-schemas';

type Json = Record<string, unknown>;

const NONE = '__none__';
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const asObj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 font-body text-xs font-medium text-ink-muted">{children}</div>;
}

function Tags({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !value.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.length === 0 && <span className="font-body text-xs text-ink-faint">Nenhum item</span>}
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-control bg-surface-sunken px-2 py-1 font-body text-xs text-ink">
            {t}
            <button type="button" aria-label={`Remover ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
              <X size={12} strokeWidth={1.75} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="w-72"
        />
        <Button type="button" intent="secondary" size="sm" onClick={add} disabled={!draft.trim()}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function Control({
  spec,
  value,
  onChange,
  disabled,
  compact = false,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  switch (spec.t) {
    case 'number':
      return (
        <Input
          type="number"
          min={spec.min}
          max={spec.max}
          step={spec.step ?? 1}
          disabled={disabled}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? (spec.nullable ? null : '') : Number(e.target.value))}
          className={compact ? 'w-28' : 'w-40'}
        />
      );
    case 'text':
      return (
        <Input
          disabled={disabled || spec.readOnly}
          placeholder={spec.placeholder}
          maxLength={spec.max}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={compact ? 'w-40' : 'w-72'}
        />
      );
    case 'textarea':
      return (
        <Textarea
          disabled={disabled}
          rows={2}
          maxLength={spec.max}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-64"
        />
      );
    case 'bool':
      return (
        <label className="inline-flex items-center gap-2 font-body text-sm text-ink">
          <input type="checkbox" disabled={disabled} checked={value !== false} onChange={(e) => onChange(e.target.checked)} />
          {compact ? '' : spec.label}
        </label>
      );
    case 'select': {
      const items = spec.nullable ? [{ value: NONE, label: '—' }, ...spec.options] : spec.options;
      return (
        <Select
          items={items}
          value={typeof value === 'string' && value ? value : spec.nullable ? NONE : ''}
          onValueChange={(v) => onChange(v === NONE ? null : v)}
          disabled={disabled}
          className={compact ? 'w-40' : 'w-60'}
        />
      );
    }
    case 'tags':
      return disabled ? (
        <div className="font-body text-sm text-ink">{asArr(value).join(', ') || '—'}</div>
      ) : (
        <Tags value={asArr(value).map(String)} onChange={onChange} placeholder={spec.placeholder} />
      );
    case 'days': {
      const days = asArr(value).map(Number);
      return (
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d, i) => {
            const on = days.includes(i);
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onChange(on ? days.filter((x) => x !== i) : [...days, i].sort())}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  on ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-ink-muted'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      );
    }
    case 'matrix': {
      const m = asObj(value);
      return (
        <div className="overflow-x-auto">
          <table className="font-body text-sm">
            <thead>
              <tr>
                <th className="pr-3 text-left text-xs text-ink-faint">De \ Para</th>
                {spec.rows.map((c) => (
                  <th key={c.value} className="px-3 text-xs font-medium text-ink-muted">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.rows.map((r) => (
                <tr key={r.value}>
                  <td className="py-1 pr-3 text-xs font-medium text-ink-muted">{r.label}</td>
                  {spec.rows.map((c) => {
                    const to = asArr(m[r.value]).map(String);
                    return (
                      <td key={c.value} className="px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={disabled || r.value === c.value}
                          checked={to.includes(c.value)}
                          onChange={(e) =>
                            onChange({
                              ...m,
                              [r.value]: e.target.checked ? [...to, c.value] : to.filter((x) => x !== c.value),
                            })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'record': {
      const rec = asObj(value);
      return (
        <div className="grid gap-2 md:grid-cols-2">
          {spec.keys.map((k) => (
            <label key={k.value} className="flex flex-col gap-1 font-body text-xs text-ink-muted">
              {k.label}
              <Input
                disabled={disabled}
                maxLength={40}
                value={typeof rec[k.value] === 'string' ? (rec[k.value] as string) : ''}
                onChange={(e) => onChange({ ...rec, [k.value]: e.target.value })}
              />
            </label>
          ))}
        </div>
      );
    }
    case 'rows': {
      const rows = asArr(value).map(asObj);
      const update = (i: number, patch: Json) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
      return (
        <div className="space-y-2">
          {rows.length === 0 && <div className="font-body text-xs text-ink-faint">Sem entradas</div>}
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-card border border-border p-3">
              {spec.cols.map((c) => (
                <div key={c.k}>
                  {c.t !== 'bool' && <Label>{c.label}</Label>}
                  <Control
                    spec={c}
                    value={row[c.k]}
                    onChange={(v) => update(i, { [c.k]: v })}
                    disabled={disabled || (!!spec.fixed && (c.k === 'code' || c.k === 'event'))}
                    compact
                  />
                  {c.t === 'bool' && <Label>{c.label}</Label>}
                </div>
              ))}
              {!disabled && !spec.fixed && (
                <Button
                  type="button"
                  intent="ghost"
                  size="sm"
                  aria-label="Remover linha"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </Button>
              )}
            </div>
          ))}
          {!disabled && !spec.fixed && rows.length < (spec.max ?? 50) && (
            <Button
              type="button"
              intent="secondary"
              size="sm"
              onClick={() =>
                onChange([
                  ...rows,
                  spec.blank ?? Object.fromEntries(spec.cols.map((c) => [c.k, c.t === 'number' ? null : ''])),
                ])
              }
            >
              <Plus size={14} strokeWidth={1.75} />
              Adicionar
            </Button>
          )}
        </div>
      );
    }
  }
}

export interface SettingFormProps {
  schema: SectionSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}

export function SettingForm({ schema, value, onChange, disabled }: SettingFormProps) {
  // Secções cujo valor é a própria lista/matriz (sem chave de objecto).
  const single = schema.kind === 'list' ? schema.field : schema.fields.length === 1 && schema.fields[0].k === '' ? schema.fields[0] : null;
  if (single) {
    return <Control spec={single} value={value} onChange={onChange} disabled={disabled} />;
  }
  if (schema.kind === 'list') return null;
  const obj = asObj(value);
  return (
    <div className="space-y-4">
      {schema.fields.map((f) => (
        <div key={f.k}>
          {f.t !== 'bool' && <Label>{f.label}</Label>}
          <Control spec={f} value={obj[f.k]} onChange={(v) => onChange({ ...obj, [f.k]: v })} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}
