// components/processes/CalendarView.tsx
// Aba «Calendário e Prazos» (docs/Modulo_Processes.md §10): vistas diária,
// semanal, mensal e cronograma das tarefas e processos, com filtros por
// departamento, unidade e responsável, destaque de atrasos e prazos próximos,
// conflitos de atribuição, dependências e exportação iCalendar (.ics).

'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadFromApi } from '@/lib/download';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GanttChart, type GanttRow } from '@/components/ui/charts/GanttChart';
import { useToast } from '@/providers/ToastProvider';
import {
  BAR_CLASS,
  CHIP_CLASS,
  TONE_LEGEND,
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
import type {
  CalendarItem,
  CalendarResponse,
  InstanceFilterOptions,
} from './types';

export interface CalendarViewProps {
  canManage: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
// Cabeçalho azul-marinho, igual ao calendário de eventos.
const NAVY_HEADER =
  'cursor-default select-none bg-brand/60 font-body text-xs font-medium capitalize text-white';
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
  iso
    ? new Date(iso).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

interface ChipProps {
  item: CalendarItem;
  onClick: () => void;
  showTime?: boolean;
}

function Chip({ item, onClick, showTime = true }: ChipProps) {
  const tone = toneOf(item);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${item.code} — ${item.title} (${item.processTitle})`}
      className={cn(
        'flex h-[22px] w-full items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left font-body text-[11px] hover:brightness-110',
        CHIP_CLASS[tone],
        item.hasConflict && 'ring-1 ring-warning ring-offset-1',
        tone === 'done' && 'opacity-70',
      )}
    >
      {showTime && (
        <span className="shrink-0 font-mono">{timeOf(item.dueAt)}</span>
      )}
      <span
        className={cn(
          'truncate font-medium',
          tone === 'done' && 'line-through',
        )}
      >
        {item.kind === 'PROCESS' ? '◆ ' : ''}
        {item.title}
      </span>
    </button>
  );
}

function DayRow({
  item,
  onClick,
}: {
  item: CalendarItem;
  onClick: () => void;
}) {
  const tone = toneOf(item);
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full flex-wrap items-center gap-3 py-3 pl-5 pr-4 text-left transition-colors hover:bg-surface-sunken"
    >
      <span
        className={cn(
          'absolute inset-y-2 left-2 w-1 rounded-full',
          BAR_CLASS[tone],
        )}
      />
      <span
        className={cn(
          'w-16 shrink-0 rounded-control py-1 text-center font-mono text-xs font-semibold',
          CHIP_CLASS[tone],
        )}
      >
        {timeOf(item.dueAt)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">
          {item.kind === 'PROCESS' ? '◆ ' : ''}
          {item.title}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-faint">
          <span>{item.code}</span>
          <span>{item.processTitle}</span>
          <span>{item.assignee?.fullName ?? 'Por atribuir'}</span>
        </div>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
          CHIP_CLASS[tone],
        )}
      >
        {item.isOverdue
          ? 'Em atraso'
          : item.isDueSoon
            ? 'A vencer'
            : item.status === 'COMPLETED'
              ? 'Concluída'
              : 'No prazo'}
      </span>
    </button>
  );
}

export function CalendarView({ canManage, onOpenInstance }: CalendarViewProps) {
  const notify = useToast();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [scope, setScope] = useState<'mine' | 'all'>(
    canManage ? 'all' : 'mine',
  );
  const [kind, setKind] = useState('ALL');
  const [status, setStatus] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [responsibleId, setResponsibleId] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [task, setTask] = useState<{
    instanceId: number;
    stepId: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
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
  }, [
    range,
    scope,
    kind,
    status,
    departmentId,
    unitId,
    responsibleId,
    overdue,
    debounced,
  ]);

  const { data, isLoading, error } = useApiQuery<CalendarResponse>(
    queryKeys.processes.calendar(params),
    '/processes/calendar',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
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
      await downloadFromApi('/processes/calendar/ics', {
        params,
        filename: 'prazos-processos.ics',
        errorMessage: 'Falha ao exportar o calendário',
      });
    } catch (e) {
      notify({
        title: e instanceof Error ? e.message : 'Falha ao exportar',
        intent: 'danger',
      });
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
        const start = Math.min(
          i.startAt ? toValue(i.startAt) : end - 0.5,
          end - 0.25,
        );
        const deps = i.dependencies.filter((d) => !d.done).map((d) => d.title);
        return {
          label: `${i.kind === 'PROCESS' ? '◆ ' : ''}${i.title}`.slice(0, 24),
          start,
          end,
          status:
            i.status === 'COMPLETED'
              ? 'done'
              : i.isOverdue
                ? 'overdue'
                : i.status === 'IN_PROGRESS'
                  ? 'current'
                  : 'pending',
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
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))}
            aria-label="Anterior"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[160px] text-center font-body text-sm font-medium capitalize text-ink">
            {titleFor(mode, anchor)}
          </span>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))}
            aria-label="Seguinte"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setAnchor(new Date())}
          >
            Hoje
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-card bg-surface-sunken p-1">
            {MODES.map((m) => (
              <Button
                key={m.id}
                size="sm"
                intent={mode === m.id ? 'primary' : 'ghost'}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
          <Button
            intent="secondary"
            size="sm"
            onClick={exportIcs}
            loading={exporting}
          >
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
          className="min-w-[160px] flex-1"
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
        <Select
          items={KIND_ITEMS}
          value={kind}
          onValueChange={setKind}
          className="w-48"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
          className="w-44"
        />
        <Select
          items={[
            { value: ALL, label: 'Todas as unidades' },
            ...(options?.units ?? []).map((u) => ({
              value: String(u.id),
              label: u.name,
            })),
          ]}
          value={unitId}
          onValueChange={setUnitId}
          className="w-44"
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os departamentos' },
            ...(options?.departments ?? []).map((d) => ({
              value: String(d.id),
              label: d.name,
            })),
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
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => setOverdue(e.target.checked)}
          />
          Em atraso
        </label>
      </div>

      {/* Alertas de prazos */}
      {summary &&
        (summary.overdue > 0 ||
          summary.dueSoon > 0 ||
          summary.conflicts > 0) && (
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
          Resultados limitados — refine os filtros ou reduza o intervalo para
          ver tudo.
        </p>
      )}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {isLoading && <Skeleton rows={4} />}

      {/* Mês */}
      {data && mode === 'month' && (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border bg-brand/60">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className={
                  'cursor-default select-none px-2 py-1.5 text-center font-body text-xs font-medium capitalize text-white'
                }
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {range.days.map((d) => {
              const items = dayItems(d);
              const k = dayKey(d);
              const inMonth = d.getMonth() === anchorMonth;
              const expanded = expandedDay === k;
              const visible = expanded ? items : items.slice(0, 2);
              const overflow = items.length - visible.length;
              return (
                <div
                  key={k}
                  className={cn(
                    'flex min-h-[92px] flex-col border-b border-r border-border p-1',
                    !inMonth && 'bg-surface-sunken/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAnchor(d);
                      setMode('day');
                    }}
                    className={cn(
                      'mb-0.5 self-start font-body text-xs',
                      k === todayKey
                        ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-white'
                        : inMonth
                          ? 'text-ink-muted'
                          : 'text-ink-faint',
                    )}
                  >
                    {d.getDate()}
                  </button>
                  <div className="flex flex-1 flex-col justify-center space-y-0.5 pb-1">
                    {visible.map((it) => (
                      <Chip key={it.key} item={it} onClick={() => open(it)} />
                    ))}
                    {(overflow > 0 || expanded) && (
                      <button
                        type="button"
                        onClick={() => setExpandedDay(expanded ? null : k)}
                        className="px-1 text-left font-body text-[11px] text-primary hover:underline"
                      >
                        {expanded ? 'Ver menos' : `+${overflow} mais`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2 font-body text-[11px] text-ink-muted">
            {TONE_LEGEND.map((l) => (
              <span key={l.tone} className="inline-flex items-center gap-1.5">
                <span
                  className={cn('h-2.5 w-4 rounded-sm', BAR_CLASS[l.tone])}
                />
                {l.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Semana */}
      {data && mode === 'week' && (
        <div className="space-y-3">
          {range.days.map((d) => {
            const items = dayItems(d);
            return (
              <Card
                key={dayKey(d)}
                className={cn(
                  'overflow-hidden p-0',
                  dayKey(d) === todayKey && 'ring-1 ring-primary',
                )}
              >
                <div
                  className={cn(
                    NAVY_HEADER,
                    'border-b border-border px-4 py-2',
                  )}
                >
                  {formatDate(d, {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-4 font-body text-xs text-ink-faint">
                    Sem prazos
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {items.map((it) => (
                      <DayRow key={it.key} item={it} onClick={() => open(it)} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dia */}
      {data &&
        mode === 'day' &&
        (dayItems(range.days[0]).length === 0 ? (
          <EmptyState
            title="Sem prazos neste dia"
            description="Nenhuma tarefa ou processo vence nesta data com os filtros actuais."
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {dayItems(range.days[0]).map((it) => (
              <DayRow key={it.key} item={it} onClick={() => open(it)} />
            ))}
          </Card>
        ))}

      {/* Cronograma */}
      {data && mode === 'timeline' && (
        <div className="rounded-card border border-border bg-surface p-4">
          {ganttRows.length === 0 ? (
            <EmptyState
              title="Sem actividades no mês"
              description="Nenhuma actividade com prazo neste mês e filtros."
            />
          ) : (
            <GanttChart
              rows={ganttRows}
              unitLabel="dia do mês"
              todayValue={
                anchor.getMonth() === new Date().getMonth() &&
                anchor.getFullYear() === new Date().getFullYear()
                  ? new Date().getDate()
                  : undefined
              }
            />
          )}
          <p className="mt-2 font-body text-xs text-ink-faint">
            ◆ processo · barras do início ao prazo; passe o rato para ver as
            dependências por concluir.
          </p>
        </div>
      )}

      {/* Conflitos */}
      {data && data.conflicts.length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-3">
          <div className="mb-2 flex items-center gap-2 font-body text-sm font-medium text-warning-ink">
            <AlertTriangle size={16} strokeWidth={1.75} /> Conflitos de
            atribuição
          </div>
          <ul className="space-y-1 font-body text-sm text-warning-ink">
            {data.conflicts.map((c) => (
              <li key={`${c.assigneeId}-${c.day}`}>
                {c.assigneeName} — {formatDate(new Date(`${c.day}T12:00:00`))}:{' '}
                {c.totalHours}h previstas (capacidade {c.capacityHours}h) em{' '}
                {c.itemKeys.length} tarefas
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
      {task && (
        <TaskPanel
          instanceId={task.instanceId}
          stepId={task.stepId}
          onClose={() => setTask(null)}
        />
      )}
    </div>
  );
}
