// components/history/filters.tsx
// Barra de filtros global do History (docs/history.md §8) — não é uma página,
// é partilhada por todas as abas através de um contexto. Cada aba converte o
// estado em query-string com `useScopeParams()`.

'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDirectoryUsers } from '@/components/departments/departmentFormData';
import {
  AUDIT_STATUS_LABEL,
  DOC_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  MODULE_LABEL,
  PERIOD_PRESET_LABEL,
} from './constants';
import type { HistoryFilters, PeriodPreset, PersonRef, Tab } from './types';

const ALL = 'ALL';

export const DEFAULT_FILTERS: HistoryFilters = {
  preset: 'year',
  from: '',
  to: '',
  affected: null,
  actor: null,
  responsible: null,
  module: '',
  entity: '',
  departmentId: '',
  unitId: '',
  eventType: '',
  status: '',
  search: '',
};

// ─── Período ─────────────────────────────────────────────────────────

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function presetRange(
  preset: PeriodPreset,
  from: string,
  to: string,
): { from?: string; to?: string } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: iso(now), to: iso(now) };
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: iso(d), to: iso(now) };
    }
    case 'month':
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: iso(now),
      };
    case 'lastMonth':
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case 'year':
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) };
    case 'custom':
      return { from: from || undefined, to: to || undefined };
    default:
      return {};
  }
}

// ─── Contexto ────────────────────────────────────────────────────────

interface Ctx {
  filters: HistoryFilters;
  setFilters: (patch: Partial<HistoryFilters>) => void;
  reset: () => void;
}

const FiltersContext = createContext<Ctx | null>(null);

export function HistoryFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setAll] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const value = useMemo<Ctx>(
    () => ({
      filters,
      setFilters: (patch) => setAll((f) => ({ ...f, ...patch })),
      reset: () => setAll(DEFAULT_FILTERS),
    }),
    [filters],
  );
  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export function useHistoryFilters(): Ctx {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useHistoryFilters fora de HistoryFiltersProvider');
  return ctx;
}

/** Filtros globais → parâmetros de query dos endpoints do hub. */
export function useScopeParams(
  extra: Record<string, string | number | undefined> = {},
) {
  const { filters: f } = useHistoryFilters();
  const range = presetRange(f.preset, f.from, f.to);
  return {
    ...range,
    affectedUserId: f.affected?.id,
    actorId: f.actor?.id,
    responsibleId: f.responsible?.id,
    module: f.module || undefined,
    entity: f.entity || undefined,
    departmentId: f.departmentId || undefined,
    unitId: f.unitId || undefined,
    eventType: f.eventType || undefined,
    status: f.status || undefined,
    search: f.search || undefined,
    ...extra,
  };
}

// ─── Selector de pessoa (diretório interno) ──────────────────────────

export function PersonPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PersonRef | null;
  onChange: (p: PersonRef | null) => void;
}) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const { users, loading } = useDirectoryUsers(text, open && !value);

  if (value)
    return (
      <div className="flex h-[38px] items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-3 text-sm text-ink">
        <span className="max-w-[160px] truncate">{value.fullName}</span>
        <button
          type="button"
          aria-label={`Limpar ${label}`}
          onClick={() => onChange(null)}
          className="text-ink-faint hover:text-ink"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    );

  return (
    <div className="relative">
      <Input
        value={text}
        placeholder={label}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setText(e.target.value)}
        className="w-44"
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-60 w-64 overflow-auto rounded-card border border-border bg-surface shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-xs text-ink-faint">A pesquisar…</li>
          )}
          {!loading && users.length === 0 && (
            <li className="px-3 py-2 text-xs text-ink-faint">Sem resultados</li>
          )}
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ id: u.id, fullName: u.fullName });
                  setText('');
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunken"
              >
                {u.fullName}
                {u.department?.name && (
                  <span className="ml-2 text-xs text-ink-faint">
                    {u.department.name}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Barra ───────────────────────────────────────────────────────────

const toItems = (map: Record<string, string>, allLabel: string) => [
  { value: ALL, label: allLabel },
  ...Object.entries(map).map(([value, label]) => ({ value, label })),
];

export function HistoryFilterBar({ tab }: { tab: Tab }) {
  const { filters: f, setFilters, reset } = useHistoryFilters();

  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ limit: 200 }),
    '/departments',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const units = useApiQuery<{ id: number; name: string }[]>(
    queryKeys.departments.units(),
    '/units',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const sel = (v: string) => (v === ALL ? '' : v);
  const statusMap = tab === 'documents' ? DOC_STATUS_LABEL : AUDIT_STATUS_LABEL;

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="w-48"
          value={f.preset}
          onValueChange={(v) => setFilters({ preset: v as PeriodPreset })}
          items={Object.entries(PERIOD_PRESET_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        {f.preset === 'custom' && (
          <>
            <Input
              type="date"
              aria-label="De"
              value={f.from}
              onChange={(e) => setFilters({ from: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              aria-label="Até"
              value={f.to}
              onChange={(e) => setFilters({ to: e.target.value })}
              className="w-40"
            />
          </>
        )}
        <Input
          value={f.search}
          placeholder="Pesquisar…"
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-52"
        />
        <Button intent="ghost" size="sm" onClick={reset}>
          Limpar filtros
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tab !== 'employee' && (
          <PersonPicker
            label="Colaborador"
            value={f.affected}
            onChange={(p) => setFilters({ affected: p })}
          />
        )}
        <PersonPicker
          label="Utilizador"
          value={f.actor}
          onChange={(p) => setFilters({ actor: p })}
        />
        <PersonPicker
          label="Responsável"
          value={f.responsible}
          onChange={(p) => setFilters({ responsible: p })}
        />
        <Select
          className="w-44"
          placeholder="Módulo"
          value={f.module || ALL}
          onValueChange={(v) => setFilters({ module: sel(v) })}
          items={toItems(MODULE_LABEL, 'Todos os módulos')}
        />
        <Select
          className="w-44"
          placeholder="Departamento"
          value={f.departmentId || ALL}
          onValueChange={(v) => setFilters({ departmentId: sel(v) })}
          items={[
            { value: ALL, label: 'Todos os departamentos' },
            ...(depts.data?.data ?? []).map((d) => ({
              value: String(d.id),
              label: d.name,
            })),
          ]}
        />
        <Select
          className="w-44"
          placeholder="Unidade"
          value={f.unitId || ALL}
          onValueChange={(v) => setFilters({ unitId: sel(v) })}
          items={[
            { value: ALL, label: 'Todas as unidades' },
            ...(units.data ?? []).map((u) => ({
              value: String(u.id),
              label: u.name,
            })),
          ]}
        />
        <Select
          className="w-44"
          placeholder="Tipo de evento"
          value={f.eventType || ALL}
          onValueChange={(v) => setFilters({ eventType: sel(v) })}
          items={toItems(EVENT_TYPE_LABEL, 'Todos os tipos')}
        />
        <Select
          className="w-44"
          placeholder="Estado"
          value={f.status || ALL}
          onValueChange={(v) => setFilters({ status: sel(v) })}
          items={toItems(statusMap, 'Todos os estados')}
        />
        <Input
          value={f.entity}
          placeholder="Entidade"
          onChange={(e) => setFilters({ entity: e.target.value })}
          className="w-36"
        />
      </div>
    </div>
  );
}
