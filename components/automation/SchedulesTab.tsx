// components/automation/SchedulesTab.tsx
// Agendamentos (docs/modulo_automation.md §6): execuções programadas de uma
// automação por data, hora, periodicidade ou cron, com fuso horário, próxima
// execução calculada e política para execuções perdidas. O backend corre-os
// minuto a minuto (AutomationScheduleService.tick).

'use client';

import { useDeferredValue, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Agendamento</TableHeaderCell>
              <TableHeaderCell>Automação</TableHeaderCell>
              <TableHeaderCell>Quando</TableHeaderCell>
              <TableHeaderCell>Próxima execução</TableHeaderCell>
              <TableHeaderCell>Última execução</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell>Acções</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((s) => {
              const st = STATUS_META[s.status];
              return (
                <TableRow key={s.id}>
                  <TableCell className="min-w-[180px] font-semibold">
                    {s.name}
                    <span className="block font-data text-[10px] font-normal text-ink-faint">
                      {s.timezone}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.rule?.name ?? `#${s.ruleId}`}
                    {s.rule?.draft && (
                      <span className="block text-warning-ink">Rascunho</span>
                    )}
                    {s.rule && !s.rule.draft && !s.rule.active && (
                      <span className="block text-ink-faint">Pausada</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[160px] text-xs">
                    {describe(s)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmt(s.nextRunAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {fmt(s.lastRunAt)}
                    {s.lastRunStatus && (
                      <span
                        className={cn(
                          'block',
                          s.lastRunStatus === 'FAILED' && 'text-danger-ink',
                        )}
                        title={s.lastError ?? undefined}
                      >
                        {s.lastRunStatus} · {s.runCount}×
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge intent={st.intent}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.ownerName ?? '–'}
                  </TableCell>
                  <TableCell>
                    <div className="flex shrink-0 gap-1">
                      {s.status === 'PAUSED' || s.status === 'COMPLETED' ? (
                        <IconButton
                          icon={Play}
                          label="Retomar agendamento"
                          intent="ghost"
                          onClick={() =>
                            action.mutate({ id: s.id, verb: 'resume' })
                          }
                        />
                      ) : (
                        <IconButton
                          icon={Pause}
                          label="Pausar agendamento"
                          intent="ghost"
                          onClick={() =>
                            action.mutate({ id: s.id, verb: 'pause' })
                          }
                        />
                      )}
                      <IconButton
                        icon={PlayCircle}
                        label="Executar agora"
                        intent="ghost"
                        onClick={() => void runNow(s)}
                      />
                      <IconButton
                        icon={Pencil}
                        label="Editar agendamento"
                        intent="ghost"
                        onClick={() => setEditing(s)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Remover agendamento"
                        intent="ghost"
                        className="hover:bg-danger-subtle hover:text-danger"
                        onClick={() => void remove(s)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
