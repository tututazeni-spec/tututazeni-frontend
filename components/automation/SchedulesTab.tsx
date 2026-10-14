// components/automation/SchedulesTab.tsx
// Agendamentos (docs/modulo_automation.md §6): execuções programadas de uma
// automação por data, hora, periodicidade ou cron, com fuso horário, próxima
// execução calculada e política para execuções perdidas. O backend corre-os
// minuto a minuto (AutomationScheduleService.tick).

'use client';

import { useDeferredValue, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Clock,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { TEMPLATE_PALETTES } from './templateTheme';
import { type BadgeProps } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import type {
  AutomationRule,
  AutomationSchedule,
  Paginated,
  ScheduleStatus,
  ScheduleType,
} from './types';

const ALL = '__all__';

const STATUS_DOT: Record<NonNullable<BadgeProps['intent']>, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-400',
};

const STATUS_META: Record<
  ScheduleStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  ACTIVE: { label: 'Activo', intent: 'success' },
  PAUSED: { label: 'Pausado', intent: 'neutral' },
  COMPLETED: { label: 'Concluído', intent: 'info' },
  ERROR: { label: 'Com erro', intent: 'danger' },
};
const TYPE_ITEMS: { value: ScheduleType; label: string }[] = [
  { value: 'ONCE', label: 'Único' },
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'CUSTOM', label: 'Personalizado (cron)' },
];
const MISSED_ITEMS = [
  { value: 'RUN_ONCE', label: 'Executar uma vez ao recuperar' },
  { value: 'RUN_ALL', label: 'Recuperar todas (máx. 24)' },
  { value: 'SKIP', label: 'Ignorar as perdidas' },
];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt') : '–';

function describe(s: AutomationSchedule) {
  switch (s.type) {
    case 'ONCE':
      return `Uma vez, às ${s.time}`;
    case 'DAILY':
      return `Todos os dias, às ${s.time}`;
    case 'WEEKLY':
      return `${(s.daysOfWeek ?? []).map((d) => DAYS[d]).join(', ')} às ${s.time}`;
    case 'MONTHLY':
      return `Dia ${s.dayOfMonth} de cada mês, às ${s.time}`;
    default:
      return `Cron ${s.cronExpression}`;
  }
}

export function SchedulesTab() {
  const notify = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [editing, setEditing] = useState<AutomationSchedule | 'new' | null>(
    null,
  );

  const params = {
    search: deferredSearch.trim() || undefined,
    status: status === ALL ? undefined : status,
    type: type === ALL ? undefined : type,
    limit: 50,
  };
  const { data, isLoading } = useApiQuery<Paginated<AutomationSchedule>>(
    queryKeys.automation.schedules(params),
    '/automation/schedules',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const rows = data?.data ?? [];
  const invalidateKeys = [queryKeys.automation.schedules()];

  const action = useApiMutation(
    ({
      id,
      verb,
    }: {
      id: string;
      verb: 'pause' | 'resume' | 'run' | 'delete';
    }) => {
      if (verb === 'delete')
        return apiClient.delete(`/automation/schedules/${id}`);
      if (verb === 'run')
        return apiClient.post(`/automation/schedules/${id}/run`, {});
      return apiClient.patch(`/automation/schedules/${id}/${verb}`, {});
    },
    {
      invalidateKeys,
      onSuccess: (_d, v) =>
        notify({
          title:
            v.verb === 'run'
              ? 'Execução pedida'
              : v.verb === 'delete'
                ? 'Agendamento removido'
                : v.verb === 'pause'
                  ? 'Agendamento pausado'
                  : 'Agendamento retomado',
          intent: 'success',
        }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = async (s: AutomationSchedule) => {
    const ok = await confirm({
      title: 'Remover agendamento',
      message: `“${s.name}” deixa de ser executado. A automação não é afectada.`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) action.mutate({ id: s.id, verb: 'delete' });
  };

  const runNow = async (s: AutomationSchedule) => {
    const ok = await confirm({
      title: 'Executar agora',
      message: `Executa “${s.rule?.name ?? 'a automação'}” já, sem alterar a próxima ocorrência (${fmt(s.nextRunAt)}).`,
      confirmLabel: 'Executar',
    });
    if (ok) action.mutate({ id: s.id, verb: 'run' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome"
          aria-label="Pesquisar agendamentos"
          className="max-w-[260px]"
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os estados' },
            ...Object.entries(STATUS_META).map(([value, m]) => ({
              value,
              label: m.label,
            })),
          ]}
          value={status}
          onValueChange={setStatus}
          className="min-w-[170px]"
        />
        <Select
          items={[{ value: ALL, label: 'Todos os tipos' }, ...TYPE_ITEMS]}
          value={type}
          onValueChange={setType}
          className="min-w-[190px]"
        />
        <Button className="ml-auto" size="sm" onClick={() => setEditing('new')}>
          <Plus size={14} strokeWidth={1.75} />
          Novo agendamento
        </Button>
      </div>

      {isLoading ? (
        <Skeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sem agendamentos"
          description="Crie um agendamento para executar uma automação numa data, hora ou periodicidade — por exemplo, lembretes de formação ou alertas semanais de PDI."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => {
            const st = STATUS_META[s.status];
            const dot = STATUS_DOT[st.intent ?? 'neutral'];
            const c = TEMPLATE_PALETTES[s.ruleId % TEMPLATE_PALETTES.length];
            const iconBtn =
              'text-[#0F1F3D] hover:bg-[#0F1F3D]/10 hover:text-[#0F1F3D] focus-visible:ring-[#0F1F3D]/40';
            return (
              <li
                key={s.id}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-resting transition-shadow duration-150 hover:shadow-hover',
                  c.border,
                  s.status === 'PAUSED' && 'opacity-80',
                )}
              >
                <div
                  className={`relative h-20 overflow-hidden bg-gradient-to-br ${c.header}`}
                >
                  <div
                    className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"
                    aria-hidden
                  />
                  <div
                    className="absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <CalendarClock
                    size={72}
                    strokeWidth={1.25}
                    className="absolute -bottom-2 right-5 rotate-12 text-white/25"
                    aria-hidden
                  />
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 font-body text-[11px] font-medium text-ink shadow-sm">
                    <span
                      aria-hidden
                      className={cn('h-2 w-2 rounded-full', dot)}
                    />
                    {st.label}
                  </span>
                </div>

                <div className="relative -mt-6 flex flex-1 flex-col gap-3 px-4 pb-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-[3px] ring-surface ${c.tile}`}
                    aria-hidden
                  >
                    <CalendarClock size={22} strokeWidth={1.75} />
                  </span>

                  <div className="min-w-0">
                    <h3 className="break-words font-display text-base font-bold leading-snug text-[#0F1F3D]">
                      {s.name}
                    </h3>
                    <p className="font-data text-[11px] text-ink-muted">
                      {s.timezone}
                    </p>
                  </div>

                  <dl className={`space-y-2 rounded-xl px-3 py-2.5 ${c.panel}`}>
                    <div className="flex items-start gap-2.5">
                      <CalendarClock
                        size={14}
                        strokeWidth={1.75}
                        className={`mt-0.5 shrink-0 ${c.accent}`}
                        aria-hidden
                      />
                      <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                        Quando
                      </dt>
                      <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                        {describe(s)}
                      </dd>
                    </div>
                    <div
                      className={`flex items-start gap-2.5 border-t pt-2.5 ${c.divider}`}
                    >
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className={`mt-0.5 shrink-0 ${c.accent}`}
                        aria-hidden
                      />
                      <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                        Então
                      </dt>
                      <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                        {s.rule?.name ?? `#${s.ruleId}`}
                        {s.rule?.draft && (
                          <span className="font-normal text-ink-muted">
                            {' '}
                            (rascunho)
                          </span>
                        )}
                        {s.rule && !s.rule.draft && !s.rule.active && (
                          <span className="font-normal text-ink-muted">
                            {' '}
                            (pausada)
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className={`rounded-xl border px-3 py-2.5 ${c.border}`}>
                    <p className="flex items-center gap-1.5 font-body text-xs text-ink-muted">
                      <Clock size={12} strokeWidth={1.75} aria-hidden />
                      Próxima execução
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-[#0F1F3D]">
                      {fmt(s.nextRunAt)}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 divide-x divide-border font-body text-xs text-[#0F1F3D]">
                    <div className="pr-3">
                      <dt className="mb-0.5 text-ink-muted">Última execução</dt>
                      <dd>{fmt(s.lastRunAt)}</dd>
                    </div>
                    <div className="pl-3">
                      <dt className="mb-0.5 text-ink-muted">Resultado</dt>
                      <dd
                        className={cn(
                          s.lastRunStatus === 'FAILED' && 'text-danger-ink',
                        )}
                        title={s.lastError ?? undefined}
                      >
                        {s.lastRunStatus
                          ? `${s.lastRunStatus} · ${s.runCount}×`
                          : '–'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
                    <div className="flex min-w-0 items-center gap-2 font-body text-xs text-[#0F1F3D]">
                      {s.ownerName ? (
                        <>
                          <Avatar
                            name={s.ownerName}
                            url={s.ownerAvatarUrl ?? undefined}
                            size="sm"
                          />
                          <span className="min-w-0 truncate">
                            <span className="block text-[10px] text-ink-muted">
                              Responsável
                            </span>
                            {s.ownerName}
                          </span>
                        </>
                      ) : (
                        <span className="text-ink-muted">Sem responsável</span>
                      )}
                    </div>
                    <div className="-mr-2 flex shrink-0 gap-0.5">
                      {s.status === 'PAUSED' || s.status === 'COMPLETED' ? (
                        <Tooltip content="Retomar agendamento">
                          <IconButton
                            icon={Play}
                            label="Retomar agendamento"
                            intent="ghost"
                            className={iconBtn}
                            onClick={() =>
                              action.mutate({ id: s.id, verb: 'resume' })
                            }
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip content="Pausar agendamento">
                          <IconButton
                            icon={Pause}
                            label="Pausar agendamento"
                            intent="ghost"
                            className={iconBtn}
                            onClick={() =>
                              action.mutate({ id: s.id, verb: 'pause' })
                            }
                          />
                        </Tooltip>
                      )}
                      <Tooltip content="Executar agora">
                        <IconButton
                          icon={PlayCircle}
                          label="Executar agora"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => void runNow(s)}
                        />
                      </Tooltip>
                      <Tooltip content="Editar agendamento">
                        <IconButton
                          icon={Pencil}
                          label="Editar agendamento"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => setEditing(s)}
                        />
                      </Tooltip>
                      <Tooltip content="Remover agendamento">
                        <IconButton
                          icon={Trash2}
                          label="Remover agendamento"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => void remove(s)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ScheduleModal
          schedule={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ScheduleModal({
  schedule,
  onClose,
}: {
  schedule: AutomationSchedule | null;
  onClose: () => void;
}) {
  const notify = useToast();
  const { data: rules = [] } = useApiQuery<AutomationRule[]>(
    queryKeys.automation.rules({}),
    '/automation/rules',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(schedule?.name ?? '');
  const [ruleId, setRuleId] = useState(schedule ? String(schedule.ruleId) : '');
  const [type, setType] = useState<ScheduleType>(schedule?.type ?? 'DAILY');
  const [startDate, setStartDate] = useState(
    schedule ? schedule.startDate.slice(0, 10) : today,
  );
  const [endDate, setEndDate] = useState(schedule?.endDate?.slice(0, 10) ?? '');
  const [time, setTime] = useState(schedule?.time ?? '09:00');
  const [timezone, setTimezone] = useState(
    schedule?.timezone ?? 'Africa/Luanda',
  );
  const [days, setDays] = useState<number[]>(schedule?.daysOfWeek ?? [1]);
  const [dayOfMonth, setDayOfMonth] = useState(
    String(schedule?.dayOfMonth ?? 1),
  );
  const [cron, setCron] = useState(schedule?.cronExpression ?? '');
  const [missed, setMissed] = useState(schedule?.missedPolicy ?? 'RUN_ONCE');
  const [ownerId, setOwnerId] = useState(schedule?.ownerId ?? '');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string[] | null>(null);

  const body = () => ({
    name: name.trim(),
    ruleId: Number(ruleId),
    type,
    startDate: `${startDate}T00:00:00.000Z`,
    ...(endDate ? { endDate: `${endDate}T23:59:59.000Z` } : {}),
    time,
    timezone: timezone.trim() || 'Africa/Luanda',
    ...(type === 'WEEKLY' ? { daysOfWeek: days } : {}),
    ...(type === 'MONTHLY' ? { dayOfMonth: Number(dayOfMonth) } : {}),
    ...(type === 'CUSTOM' ? { cronExpression: cron.trim() } : {}),
    missedPolicy: missed,
    ...(ownerId.trim() ? { ownerId: ownerId.trim() } : {}),
  });

  const save = useApiMutation(
    () =>
      schedule
        ? apiClient.put(`/automation/schedules/${schedule.id}`, body())
        : apiClient.post('/automation/schedules', body()),
    {
      invalidateKeys: [queryKeys.automation.schedules()],
      onSuccess: () => {
        notify({
          title: schedule ? 'Agendamento actualizado' : 'Agendamento criado',
          intent: 'success',
        });
        onClose();
      },
      onError: (e: Error) => setError(e.message || 'Erro ao guardar.'),
    },
  );
  const previewMut = useApiMutation(
    () =>
      apiClient.post<{ runs: string[] }>(
        '/automation/schedules/preview',
        body(),
      ),
    {
      onSuccess: (r: { runs: string[] }) => {
        setError('');
        setPreview(r.runs);
      },
      onError: (e: Error) => {
        setPreview(null);
        setError(e.message);
      },
    },
  );

  const canSave = name.trim() && ruleId && time && startDate;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={schedule ? 'Editar agendamento' : 'Novo agendamento'}
        description="Define quando a automação deve correr. A hora é interpretada no fuso horário escolhido."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink"
            >
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Nome *" htmlFor="sc-name">
            <Input
              id="sc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Alerta semanal de PDI atrasados"
            />
          </FormField>
          <FormField label="Automação *" htmlFor="sc-rule">
            <Select
              items={rules.map((r) => ({ value: String(r.id), label: r.name }))}
              value={ruleId || undefined}
              onValueChange={setRuleId}
              placeholder="Escolher automação"
              className="w-full"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Tipo" htmlFor="sc-type">
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType(v as ScheduleType)}
                className="w-full"
              />
            </FormField>
            <FormField label="Hora *" htmlFor="sc-time">
              <Input
                id="sc-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </FormField>
            <FormField
              label="Fuso horário"
              htmlFor="sc-tz"
              hint="Ex.: Africa/Luanda, Europe/Lisbon"
            >
              <Input
                id="sc-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={
                type === 'ONCE' ? 'Data da execução *' : 'Data de início *'
              }
              htmlFor="sc-start"
            >
              <Input
                id="sc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            {type !== 'ONCE' && (
              <FormField label="Data de fim" htmlFor="sc-end" hint="Opcional.">
                <Input
                  id="sc-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormField>
            )}
          </div>

          {type === 'WEEKLY' && (
            <FormField label="Dias da semana" htmlFor="sc-days">
              <div id="sc-days" className="flex flex-wrap gap-1.5">
                {DAYS.map((label, d) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={days.includes(d)}
                    onClick={() =>
                      setDays((cur) =>
                        cur.includes(d)
                          ? cur.filter((x) => x !== d)
                          : [...cur, d],
                      )
                    }
                    className={cn(
                      'rounded-control border-[1.5px] px-2.5 py-1 font-body text-xs font-semibold transition-colors',
                      days.includes(d)
                        ? 'border-primary bg-primary text-canvas'
                        : 'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FormField>
          )}
          {type === 'MONTHLY' && (
            <FormField
              label="Dia do mês"
              htmlFor="sc-dom"
              hint="Em meses mais curtos corre no último dia."
            >
              <Input
                id="sc-dom"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="max-w-[120px]"
              />
            </FormField>
          )}
          {type === 'CUSTOM' && (
            <FormField
              label="Expressão cron *"
              htmlFor="sc-cron"
              hint="5 campos: minuto hora dia-do-mês mês dia-da-semana — ex.: 0 8 * * 1-5 (dias úteis às 08:00). A hora acima é ignorada."
            >
              <Input
                id="sc-cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="font-data"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Execuções perdidas"
              htmlFor="sc-missed"
              hint="O que fazer se o sistema estiver indisponível à hora marcada."
            >
              <Select
                items={MISSED_ITEMS}
                value={missed}
                onValueChange={(v) =>
                  setMissed(v as 'RUN_ONCE' | 'RUN_ALL' | 'SKIP')
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Responsável"
              htmlFor="sc-owner"
              hint="userId — por omissão, quem cria."
            >
              <Input
                id="sc-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              />
            </FormField>
          </div>

          <div className="rounded-card border border-border p-3">
            <Button
              size="sm"
              intent="secondary"
              onClick={() => previewMut.mutate(undefined)}
              loading={previewMut.isPending}
              disabled={!canSave}
            >
              Ver próximas execuções
            </Button>
            {preview && (
              <ol className="mt-2 list-decimal pl-5 text-sm">
                {preview.length === 0 && <li>Sem execuções futuras.</li>}
                {preview.map((r) => (
                  <li key={r}>{fmt(r)}</li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setError('');
              save.mutate(undefined);
            }}
            disabled={!canSave}
            loading={save.isPending}
          >
            {schedule ? 'Guardar' : 'Criar agendamento'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
