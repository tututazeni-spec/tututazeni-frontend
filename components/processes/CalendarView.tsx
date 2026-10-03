// components/processes/CalendarView.tsx
// Aba «Calendário e Prazos» (docs/Modulo_Processes.md §10): vistas diária,
// semanal, mensal e cronograma das tarefas e processos, com filtros por
// departamento, unidade e responsável, destaque de atrasos e prazos próximos,
// conflitos de atribuição, dependências e exportação iCalendar (.ics).

'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GanttChart, type GanttRow } from '@/components/ui/charts/GanttChart';
import { useToast } from '@/providers/ToastProvider';
import {
  CHIP_CLASS,
  dayKey,
  daysInMonth,
  groupByDay,
  rangeFor,
  shiftAnchor,
  titleFor,
  toneOf,
  type CalendarMode,
} from './calendar-utils';
import { CalendarItemPanel } from './CalendarItemPanel';
import { Skeleton } from './Skeleton';
import { TaskPanel } from './TaskPanel';
import { UserPicker } from './UserPicker';
import type { CalendarItem, CalendarResponse, InstanceFilterOptions } from './types';

export interface CalendarViewProps {
  canManage: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MODES: Array<{ id: CalendarMode; label: string }> = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'timeline', label: 'Cronograma' },
];
const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em curso' },
  { value: 'BLOCKED', label: 'Bloqueada' },
  { value: 'ESCALATED', label: 'Escalada' },
  { value: 'COMPLETED', label: 'Concluída' },
];
const KIND_ITEMS = [
  { value: 'ALL', label: 'Tarefas e processos' },
  { value: 'TASK', label: 'Só tarefas' },
  { value: 'PROCESS', label: 'Só processos' },
];

const timeOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '';

function Chip({
  item,
  onClick,
  showTime = false,
}: {
  item: CalendarItem;
  onClick: () => void;
  showTime?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${item.code} — ${item.title} (${item.processTitle})`}
      className={cn(
        'block w-full truncate rounded-control px-1.5 py-0.5 text-left font-body text-xs',
        CHIP_CLASS[toneOf(item)],
        item.hasConflict && 'ring-1 ring-warning',
        item.kind === 'PROCESS' && 'font-semibold',
      )}
    >
      {showTime && <span className="mr-1 opacity-70">{timeOf(item.dueAt)}</span>}
      {item.kind === 'PROCESS' ? '◆ ' : ''}
      {item.title}
    </button>
  );
}

export function CalendarView({ canManage, onOpenInstance }: CalendarViewProps) {
  const notify = useToast();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [scope, setScope] = useState<'mine' | 'all'>(canManage ? 'all' : 'mine');
  const [kind, setKind] = useState('ALL');
  const [status, setStatus] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [responsibleId, setResponsibleId] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [task, setTask] = useState<{ instanceId: number; stepId: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounce(search, 300);

  const range = useMemo(() => rangeFor(mode, anchor), [mode, anchor]);
  const params = useMemo(() => {
    const p: Record<string, string> = {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      scope,
    };
    if (kind !== 'ALL') p.kind = kind;
    if (status !== ALL) p.status = status;
    if (departmentId !== ALL) p.departmentId = departmentId;
    if (unitId !== ALL) p.unitId = unitId;
    if (responsibleId) p.responsibleId = responsibleId;
    if (overdue) p.overdue = 'true';
    if (debounced) p.search = debounced;
    return p;
  }, [range, scope, kind, status, departmentId, unitId, responsibleId, overdue, debounced]);

  const { data, isLoading, error } = useApiQuery<CalendarResponse>(
    queryKeys.processes.calendar(params),
    '/processes/calendar',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const { data: options } = useApiQuery<InstanceFilterOptions>(
    queryKeys.processes.instanceFilters(),
    '/processes/instances/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const byDay = useMemo(() => groupByDay(data?.data ?? []), [data]);
  const todayKey = dayKey(new Date());
  const anchorMonth = anchor.getMonth();

  const exportIcs = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/processes/calendar/ics?${qs}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Falha ao exportar o calendário');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prazos-processos.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Falha ao exportar', intent: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const open = (it: CalendarItem) => setSelected(it);

  // ── Cronograma: dias do mês no eixo; barras de início → prazo ────────────
  const ganttRows: GanttRow[] = useMemo(() => {
    if (mode !== 'timeline') return [];
    const monthStart = range.days[0];
    const total = daysInMonth(anchor);
    const toValue = (iso: string) => {
      const d = new Date(iso);
      const v = 1 + (d.getTime() - monthStart.getTime()) / 86_400_000;
      return Math.min(total + 1, Math.max(1, v));
    };
    return (data?.data ?? [])
      .filter((i) => i.dueAt)
      .slice(0, 40)
      .map((i) => {
        const end = toValue(i.dueAt as string);
        const start = Math.min(i.startAt ? toValue(i.startAt) : end - 0.5, end - 0.25);
        const deps = i.dependencies.filter((d) => !d.done).map((d) => d.title);
        return {
          label: `${i.kind === 'PROCESS' ? '◆ ' : ''}${i.title}`.slice(0, 24),
          start,
          end,
          status: i.status === 'COMPLETED' ? 'done' : i.isOverdue ? 'overdue' : i.status === 'IN_PROGRESS' ? 'current' : 'pending',
          detail: `${i.processTitle} · prazo ${formatDate(i.dueAt)}${deps.length ? ` · depende de: ${deps.join(', ')}` : ''}`,
        } satisfies GanttRow;
      });
  }, [mode, data, range, anchor]);

  const summary = data?.summary;
  const dayItems = (d: Date) => byDay.get(dayKey(d)) ?? [];

  return (
    <div className="space-y-4">
      {/* Barra de navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button intent="secondary" size="sm" onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))} aria-label="Anterior">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <Button intent="secondary" size="sm" onClick={() => setAnchor(new Date())}>
            Hoje
          </Button>
          <Button intent="secondary" size="sm" onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))} aria-label="Seguinte">
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <h2 className="ml-2 font-display text-base font-semibold text-ink">{titleFor(mode, anchor)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-control border border-border">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  'px-3 py-1.5 font-body text-sm',
                  mode === m.id ? 'bg-primary/10 font-medium text-primary' : 'bg-surface text-ink-muted hover:text-ink',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button intent="secondary" size="sm" onClick={exportIcs} loading={exporting}>
            <Download size={14} strokeWidth={1.75} />
            Exportar .ics
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar tarefa, processo ou código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        {canManage && (
          <Select
            items={[
              { value: 'all', label: 'Todos os prazos' },
              { value: 'mine', label: 'Os meus prazos' },
            ]}
            value={scope}
            onValueChange={(v) => setScope(v as 'mine' | 'all')}
            className="w-44"
          />
        )}
        <Select items={KIND_ITEMS} value={kind} onValueChange={setKind} className="w-48" />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} className="w-44" />
        <Select
          items={[
            { value: ALL, label: 'Todas as unidades' },
            ...(options?.units ?? []).map((u) => ({ value: String(u.id), label: u.name })),
          ]}
          value={unitId}
          onValueChange={setUnitId}
          className="w-44"
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os departamentos' },
            ...(options?.departments ?? []).map((d) => ({ value: String(d.id), label: d.name })),
          ]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="w-52"
        />
        {canManage && (
          <div className="flex items-center gap-1">
            <UserPicker
              value={responsibleId}
              onChange={setResponsibleId}
              placeholder="Responsável"
              className="w-48"
            />
            {responsibleId && (
              <button
                type="button"
                onClick={() => setResponsibleId('')}
                className="font-body text-xs text-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        )}
        <label className="flex items-center gap-2 font-body text-sm text-ink-muted">
          <input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />
          Em atraso
        </label>
      </div>

      {/* Alertas de prazos */}
      {summary && (summary.overdue > 0 || summary.dueSoon > 0 || summary.conflicts > 0) && (
        <div className="flex flex-wrap gap-2">
          {summary.overdue > 0 && (
            <span className="rounded-control bg-danger-subtle px-3 py-1 font-body text-sm text-danger-ink">
              {summary.overdue} em atraso
            </span>
          )}
          {summary.dueSoon > 0 && (
            <span className="rounded-control bg-warning-subtle px-3 py-1 font-body text-sm text-warning-ink">
              {summary.dueSoon} a vencer nas próximas 48h
            </span>
          )}
          {summary.conflicts > 0 && (
            <span className="flex items-center gap-1 rounded-control bg-warning-subtle px-3 py-1 font-body text-sm text-warning-ink">
              <AlertTriangle size={14} strokeWidth={1.75} />
              {summary.conflicts} conflito(s) de atribuição
            </span>
          )}
        </div>
      )}
      {data?.truncated && (
        <p className="font-body text-xs text-warning-ink">
          Resultados limitados — refine os filtros ou reduza o intervalo para ver tudo.
        </p>
      )}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}
      {isLoading && <Skeleton rows={4} />}

      {/* Mês */}
      {data && mode === 'month' && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid grid-cols-7 border-b border-border bg-surface-sunken">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {range.days.map((d) => {
              const items = dayItems(d);
              const k = dayKey(d);
              return (
                <div
                  key={k}
                  className={cn(
                    'min-h-[104px] border-b border-r border-border p-1.5',
                    d.getMonth() !== anchorMonth && 'bg-surface-sunken/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAnchor(d);
                      setMode('day');
                    }}
                    className={cn(
                      'mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-body text-xs',
                      k === todayKey ? 'bg-primary text-white' : d.getMonth() !== anchorMonth ? 'text-ink-faint' : 'text-ink',
                    )}
                  >
                    {d.getDate()}
                  </button>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map((it) => (
                      <Chip key={it.key} item={it} onClick={() => open(it)} />
                    ))}
                    {items.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnchor(d);
                          setMode('day');
                        }}
                        className="font-body text-xs text-primary hover:underline"
                      >
                        +{items.length - 3} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Semana */}
      {data && mode === 'week' && (
        <div className="grid gap-2 md:grid-cols-7">
          {range.days.map((d, i) => {
            const items = dayItems(d);
            const k = dayKey(d);
            return (
              <div key={k} className={cn('rounded-card border border-border bg-surface p-2', k === todayKey && 'border-primary')}>
                <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {WEEKDAYS[i]} <span className="text-ink">{d.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {items.length === 0 && <p className="font-body text-xs text-ink-faint">—</p>}
                  {items.map((it) => (
                    <Chip key={it.key} item={it} onClick={() => open(it)} showTime />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dia */}
      {data && mode === 'day' && (
        <div className="rounded-card border border-border bg-surface">
          {dayItems(range.days[0]).length === 0 ? (
            <EmptyState title="Sem prazos neste dia" description="Nenhuma tarefa ou processo vence nesta data com os filtros actuais." />
          ) : (
            dayItems(range.days[0]).map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => open(it)}
                className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <span className="w-14 shrink-0 font-mono text-sm text-ink-muted">{timeOf(it.dueAt)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-sm font-medium text-ink">{it.title}</span>
                  <span className="block truncate font-body text-xs text-ink-muted">
                    {it.code} · {it.processTitle} · {it.assignee?.fullName ?? 'Por atribuir'}
                  </span>
                </span>
                <span className={cn('shrink-0 rounded-control px-2 py-0.5 font-body text-xs', CHIP_CLASS[toneOf(it)])}>
                  {it.isOverdue ? 'Em atraso' : it.isDueSoon ? 'A vencer' : it.status === 'COMPLETED' ? 'Concluída' : 'No prazo'}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Cronograma */}
      {data && mode === 'timeline' && (
        <div className="rounded-card border border-border bg-surface p-4">
          {ganttRows.length === 0 ? (
            <EmptyState title="Sem actividades no mês" description="Nenhuma actividade com prazo neste mês e filtros." />
          ) : (
            <GanttChart
              rows={ganttRows}
              unitLabel="dia do mês"
              todayValue={
                anchor.getMonth() === new Date().getMonth() && anchor.getFullYear() === new Date().getFullYear()
                  ? new Date().getDate()
                  : undefined
              }
            />
          )}
          <p className="mt-2 font-body text-xs text-ink-faint">
            ◆ processo · barras do início ao prazo; passe o rato para ver as dependências por concluir.
          </p>
        </div>
      )}

      {/* Conflitos */}
      {data && data.conflicts.length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-3">
          <div className="mb-2 flex items-center gap-2 font-body text-sm font-medium text-warning-ink">
            <AlertTriangle size={16} strokeWidth={1.75} /> Conflitos de atribuição
          </div>
          <ul className="space-y-1 font-body text-sm text-warning-ink">
            {data.conflicts.map((c) => (
              <li key={`${c.assigneeId}-${c.day}`}>
                {c.assigneeName} — {formatDate(new Date(`${c.day}T12:00:00`))}: {c.totalHours}h previstas
                (capacidade {c.capacityHours}h) em {c.itemKeys.length} tarefas
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <CalendarItemPanel
          item={selected}
          conflicts={data?.conflicts ?? []}
          canReschedule={canManage}
          onClose={() => setSelected(null)}
          onOpenTask={(instanceId, stepId) => {
            setSelected(null);
            setTask({ instanceId, stepId });
          }}
          onOpenInstance={(id) => {
            setSelected(null);
            onOpenInstance(id);
          }}
        />
      )}
      {task && <TaskPanel instanceId={task.instanceId} stepId={task.stepId} onClose={() => setTask(null)} />}
    </div>
  );
}
