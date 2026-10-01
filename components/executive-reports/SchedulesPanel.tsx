// components/executive-reports/SchedulesPanel.tsx
// Separador "Relatórios Agendados" (docs/Executive_Reports.md §8): periodicidade
// semanal/mensal/trimestral/anual, destinatários, formato, hora e estado, com o
// registo de execuções. As permissões dos destinatários são revalidadas pelo
// backend no momento da entrega.

'use client';

import { useState } from 'react';
import {
  CalendarClock,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  ExportFormat,
  ReportSchedule,
  ScheduleFrequency,
  TemplateOption,
} from './reportTypes';

const FREQUENCY_LABEL: Record<ScheduleFrequency, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
};
const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const RUN_INTENT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> =
  {
    SUCCESS: 'success',
    PARTIAL: 'warning',
    NO_RECIPIENTS: 'warning',
    FAILED: 'danger',
    RUNNING: 'neutral',
  };
const RUN_LABEL: Record<string, string> = {
  SUCCESS: 'Entregue',
  PARTIAL: 'Entrega parcial',
  NO_RECIPIENTS: 'Sem destinatários elegíveis',
  FAILED: 'Falhou',
  RUNNING: 'A executar',
};

const SELECT_CLS =
  'w-full rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink';

interface UserOption {
  id: number;
  fullName: string;
  role?: { name?: string } | string | null;
}

const ELIGIBLE = ['ADMIN', 'RH', 'DIRECTOR'];
function roleName(u: UserOption): string | null {
  if (!u.role) return null;
  return typeof u.role === 'string' ? u.role : (u.role.name ?? null);
}

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('pt-PT') : '—';
}

function ScheduleForm({ onDone }: { onDone: () => void }) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [templateCode, setTemplateCode] = useState('EXEC_MONTHLY');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('MONTHLY');
  const [hour, setHour] = useState(8);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [recipients, setRecipients] = useState<number[]>([]);

  const templatesQ = useApiQuery<TemplateOption[]>(
    queryKeys.executiveReports.reportTemplates(),
    '/executive-reports/report-templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const usersQ = useApiQuery<{ data: UserOption[] }>(
    ['executive-reports', 'recipients-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const users = (usersQ.data?.data ?? []).filter((u) => {
    const r = roleName(u);
    return r === null || ELIGIBLE.includes(r);
  });

  const create = useApiMutation(
    (_: void) =>
      apiClient.post('/executive-reports/schedules', {
        name: name.trim(),
        ...(templateCode.startsWith('CUSTOM:')
          ? { templateId: Number(templateCode.split(':')[1]) }
          : { templateCode }),
        frequency,
        hour,
        ...(frequency === 'WEEKLY' ? { dayOfWeek } : { dayOfMonth }),
        format,
        recipientIds: recipients,
      }),
    {
      invalidateKeys: [queryKeys.executiveReports.schedules()],
      onSuccess: () => {
        notify({ title: 'Agendamento criado', intent: 'success' });
        onDone();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const toggleRecipient = (id: number) =>
    setRecipients((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  return (
    <Card className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label
            htmlFor="sc-name"
            className="mb-1 block font-body text-xs font-medium text-ink"
          >
            Nome
          </label>
          <Input
            id="sc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex.: Relatório mensal à Direcção"
          />
        </div>
        <div>
          <label
            htmlFor="sc-template"
            className="mb-1 block font-body text-xs font-medium text-ink"
          >
            Modelo
          </label>
          <select
            id="sc-template"
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            className={SELECT_CLS}
          >
            {(templatesQ.data ?? []).map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="sc-format"
            className="mb-1 block font-body text-xs font-medium text-ink"
          >
            Formato
          </label>
          <select
            id="sc-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className={SELECT_CLS}
          >
            <option value="PDF">PDF</option>
            <option value="XLSX">Excel</option>
            <option value="CSV">CSV</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="sc-freq"
            className="mb-1 block font-body text-xs font-medium text-ink"
          >
            Periodicidade
          </label>
          <select
            id="sc-freq"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
            className={SELECT_CLS}
          >
            {Object.entries(FREQUENCY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {frequency === 'WEEKLY' ? (
          <div>
            <label
              htmlFor="sc-dow"
              className="mb-1 block font-body text-xs font-medium text-ink"
            >
              Dia da semana
            </label>
            <select
              id="sc-dow"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className={SELECT_CLS}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label
              htmlFor="sc-dom"
              className="mb-1 block font-body text-xs font-medium text-ink"
            >
              Dia do mês (1-28)
            </label>
            <Input
              id="sc-dom"
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) =>
                setDayOfMonth(Math.min(28, Math.max(1, Number(e.target.value))))
              }
            />
          </div>
        )}
        <div>
          <label
            htmlFor="sc-hour"
            className="mb-1 block font-body text-xs font-medium text-ink"
          >
            Hora de execução
          </label>
          <Input
            id="sc-hour"
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) =>
              setHour(Math.min(23, Math.max(0, Number(e.target.value))))
            }
          />
        </div>
      </div>

      <div>
        <div className="mb-2 font-body text-xs font-medium text-ink">
          Destinatários ({recipients.length} seleccionados)
        </div>
        <div className="grid max-h-48 gap-1 overflow-y-auto rounded-control border border-border p-2 md:grid-cols-2">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 font-body text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={recipients.includes(u.id)}
                onChange={() => toggleRecipient(u.id)}
              />
              {u.fullName}
              {roleName(u) && (
                <span className="text-xs text-ink-faint">{roleName(u)}</span>
              )}
            </label>
          ))}
          {users.length === 0 && (
            <span className="font-body text-xs text-ink-muted">
              Sem utilizadores elegíveis.
            </span>
          )}
        </div>
        <p className="mt-1 font-body text-xs text-ink-faint">
          As permissões de cada destinatário são validadas de novo no momento da
          entrega.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button intent="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          size="sm"
          loading={create.isPending}
          disabled={name.trim().length < 3 || recipients.length === 0}
          onClick={() => create.mutate()}
        >
          Criar agendamento
        </Button>
      </div>
    </Card>
  );
}

export function SchedulesPanel() {
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  const q = useApiQuery<ReportSchedule[]>(
    queryKeys.executiveReports.schedules(),
    '/executive-reports/schedules',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const onError = (e: Error) => notify({ title: e.message, intent: 'danger' });
  const invalidate = [queryKeys.executiveReports.schedules()];

  const toggle = useApiMutation(
    (s: ReportSchedule) =>
      apiClient.patch(`/executive-reports/schedules/${s.id}`, {
        active: !s.active,
      }),
    { invalidateKeys: invalidate, onError },
  );
  const runNow = useApiMutation(
    (id: number) => apiClient.post(`/executive-reports/schedules/${id}/run`),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: () =>
        notify({ title: 'Execução concluída', intent: 'success' }),
      onError,
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/executive-reports/schedules/${id}`),
    { invalidateKeys: invalidate, onError },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="h-28 rounded-card bg-surface-sunken"
      />
    );
  if (q.error)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const schedules = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          Relatórios agendados
        </h2>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Novo agendamento
          </Button>
        )}
      </div>

      {creating && <ScheduleForm onDone={() => setCreating(false)} />}

      {schedules.length === 0 && !creating && (
        <EmptyState
          icon={CalendarClock}
          title="Sem relatórios agendados"
          description="Crie um agendamento para receber relatórios recorrentes automaticamente."
        />
      )}

      {schedules.map((s) => {
        const last = s.runs[0];
        return (
          <Card key={s.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-semibold text-ink">
                    {s.name}
                  </span>
                  <Badge intent={s.active ? 'success' : 'neutral'}>
                    {s.active ? 'Activo' : 'Pausado'}
                  </Badge>
                </div>
                <p className="mt-1 font-body text-xs text-ink-muted">
                  {FREQUENCY_LABEL[s.frequency]} às {s.hour}h ·{' '}
                  {s.templateCode ?? `modelo #${s.templateId}`} · {s.format} ·{' '}
                  {s.recipientIds.length} destinatário(s)
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-faint">
                  Próxima execução: {when(s.nextRunAt)} · Última:{' '}
                  {when(s.lastRunAt)}
                </p>
                {last && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge intent={RUN_INTENT[last.status] ?? 'neutral'}>
                      {RUN_LABEL[last.status] ?? last.status}
                    </Badge>
                    {last.rejected.length > 0 && (
                      <span className="font-body text-xs text-warning-ink">
                        {last.rejected.length} destinatário(s) sem permissão
                        actual
                      </span>
                    )}
                    {last.errorMessage && (
                      <span className="font-body text-xs text-danger-ink">
                        {last.errorMessage}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  intent="secondary"
                  size="sm"
                  loading={runNow.isPending && runNow.variables === s.id}
                  disabled={runNow.isPending}
                  onClick={() => runNow.mutate(s.id)}
                >
                  <PlayCircle size={14} strokeWidth={1.75} />
                  Executar agora
                </Button>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => toggle.mutate(s)}
                >
                  {s.active ? (
                    <Pause size={14} strokeWidth={1.75} />
                  ) : (
                    <Play size={14} strokeWidth={1.75} />
                  )}
                  {s.active ? 'Pausar' : 'Reactivar'}
                </Button>
                <Button
                  intent="ghost"
                  size="sm"
                  aria-label={`Eliminar ${s.name}`}
                  onClick={() => remove.mutate(s.id)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
