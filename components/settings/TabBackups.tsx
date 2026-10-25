// components/settings/TabBackups.tsx
// Tab "Backups" (ADMIN): periodicidade, retenção, destino, execução manual,
// histórico, restauração e estado — GET/PUT /settings/backups, POST
// /settings/backups/run e /settings/backups/:id/restore
// (docs/modulo_settings.md §14).

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useServerDraft } from '@/hooks/useServerDraft';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type {
  BackupFrequency,
  BackupRunRow,
  BackupSettingsForm,
  BackupsView,
} from './types';
import { pollInterval } from '@/lib/polling';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const FREQUENCY_ITEMS = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
];
const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const HEALTH: Record<
  BackupsView['health'],
  { label: string; intent: 'success' | 'danger' | 'warning' | 'neutral' }
> = {
  HEALTHY: { label: 'Em dia', intent: 'success' },
  STALE: { label: 'Em atraso', intent: 'warning' },
  FAILED: { label: 'Último falhou', intent: 'danger' },
  NEVER: { label: 'Nunca executado', intent: 'warning' },
  DISABLED: { label: 'Desactivado', intent: 'neutral' },
};

// O browser não consegue escolher pastas do servidor — sugerem-se caminhos
// comuns e aceita-se qualquer caminho absoluto escrito à mão (o backend cria-o).
const DESTINATION_SUGGESTIONS = [
  'C:\\Backups\\innova',
  'D:\\Backups\\innova',
  'E:\\Backups\\innova',
  '/var/backups/innova',
].map((v) => ({ value: v, label: v }));

// Cores de estado do card ROI Total.
const HEALTH_COLORS: Record<string, string> = {
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  neutral: '#9CA3AF',
};

const RUN_STATUS: Record<
  BackupRunRow['status'],
  { label: string; intent: 'success' | 'danger' | 'warning' }
> = {
  SUCCESS: { label: 'Concluído', intent: 'success' },
  FAILED: { label: 'Falhou', intent: 'danger' },
  RUNNING: { label: 'A correr', intent: 'warning' },
};

const TRIGGER_LABEL: Record<BackupRunRow['trigger'], string> = {
  MANUAL: 'Manual',
  SCHEDULED: 'Agendado',
  PRE_RESTORE: 'Pré-restauro',
};

function fmtBytes(n: number | null) {
  if (n === null) return '—';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('pt-PT') : '—';

export function TabBackups() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<BackupsView>(
    queryKeys.settings.backups(),
    '/settings/backups',
    { refetchInterval: pollInterval(15_000) },
  );
  const [form, setForm] = useServerDraft<BackupSettingsForm>(data?.settings);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const save = useApiMutation(
    (payload: BackupSettingsForm) =>
      apiClient.put('/settings/backups', payload),
    {
      invalidateKeys: [queryKeys.settings.backups()],
      onSuccess: () =>
        toast({ title: 'Definições de backup guardadas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const runNow = useApiMutation(
    () => apiClient.post<BackupRunRow>('/settings/backups/run', {}),
    {
      invalidateKeys: [queryKeys.settings.backups()],
      onSuccess: (r) =>
        toast(
          r.status === 'SUCCESS'
            ? { title: 'Backup concluído', intent: 'success' }
            : { title: r.error ?? 'O backup falhou', intent: 'danger' },
        ),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const restore = useApiMutation(
    (id: number) =>
      apiClient.post<{ ok: boolean; error?: string }>(
        `/settings/backups/${id}/restore`,
        {
          confirmation,
        },
      ),
    {
      invalidateKeys: [queryKeys.settings.backups()],
      onSuccess: (r) => {
        setRestoreId(null);
        setConfirmation('');
        toast(
          r.ok
            ? { title: 'Base de dados restaurada', intent: 'success' }
            : { title: r.error ?? 'A restauração falhou', intent: 'danger' },
        );
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );
  if (isLoading || !data || !form) return <Skeleton rows={4} />;

  const set = <K extends keyof BackupSettingsForm>(
    k: K,
    v: BackupSettingsForm[K],
  ) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const health = HEALTH[data.health];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form) save.mutate(form);
  }

  return (
    <div className="space-y-4">
      {/* Cartão claro, o mesmo desenho da lista de sessões dos eventos */}
      <div className="overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="pointer-events-none flex cursor-default select-none items-center justify-between bg-brand/60 px-5 py-3">
          <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
            Estado
          </h3>
          <span
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
            style={{ color: HEALTH_COLORS[health.intent] ?? '#9CA3AF' }}
          >
            {health.label}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 px-6 pt-5 text-sm text-brand md:grid-cols-4">
          <div>
            <dt className="text-xs text-brand-muted">
              Último backup com sucesso
            </dt>
            <dd className="font-display font-bold">
              {fmtDate(data.lastSuccessAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-muted">Próximo agendado</dt>
            <dd className="font-display font-bold">
              {fmtDate(data.nextRunAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-muted">Cópias guardadas</dt>
            <dd className="font-display font-bold">
              {data.storedCopies} ({fmtBytes(data.storedBytes)})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-muted">
              Ferramentas no servidor
            </dt>
            <dd className="font-display font-bold">
              pg_dump {data.tools.pgDump ? '✓' : '✗'} · pg_restore{' '}
              {data.tools.pgRestore ? '✓' : '✗'}
            </dd>
          </div>
        </dl>
        {!data.tools.pgDump && (
          <p className="px-6 pt-3 text-sm text-danger">
            pg_dump não foi encontrado no servidor. Instale o cliente PostgreSQL
            ou defina PG_DUMP_PATH.
          </p>
        )}
        <div className="px-6 pb-5 pt-4">
          <Button
            type="button"
            disabled={
              runNow.isPending ||
              !data.settings.destinationDir ||
              !data.tools.pgDump
            }
            onClick={() => runNow.mutate(undefined)}
          >
            {runNow.isPending ? 'A executar…' : 'Executar backup agora'}
          </Button>
          {!data.settings.destinationDir && (
            <span className="ml-3 text-xs text-brand-muted">
              Defina e guarde a pasta de destino primeiro.
            </span>
          )}
        </div>
      </div>

      <form onSubmit={submit}>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Configuração
          </div>
          <CardBody>
            <div className="space-y-4">
              <label
                htmlFor="bk-enabled"
                className="flex items-center gap-2 text-sm text-ink"
              >
                <Checkbox
                  id="bk-enabled"

                  checked={form.enabled}
                  onChange={(e) => set('enabled', e.target.checked)}
                />
                Backups agendados activos
              </label>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Periodicidade" htmlFor="bk-frequency">
                  <Select
                    className="w-full"
                    items={FREQUENCY_ITEMS}
                    value={form.frequency}
                    onValueChange={(v) =>
                      set('frequency', v as BackupFrequency)
                    }
                  />
                </FormField>
                <FormField label="Hora (0-23)" htmlFor="bk-hour">
                  <Input
                    id="bk-hour"
                    type="number"
                    min={0}
                    max={23}
                    className="w-full"
                    value={form.hour}
                    onChange={(e) => set('hour', Number(e.target.value))}
                  />
                </FormField>
                {form.frequency === 'WEEKLY' && (
                  <FormField label="Dia da semana" htmlFor="bk-weekday">
                    <Select
                      className="w-full"
                      items={WEEKDAYS.map((l, i) => ({
                        value: String(i),
                        label: l,
                      }))}
                      value={String(form.day)}
                      onValueChange={(v) => set('day', Number(v))}
                    />
                  </FormField>
                )}
                {form.frequency === 'MONTHLY' && (
                  <FormField label="Dia do mês (1-28)" htmlFor="bk-monthday">
                    <Input
                      id="bk-monthday"
                      type="number"
                      min={1}
                      max={28}
                      className="w-full"
                      value={form.day}
                      onChange={(e) => set('day', Number(e.target.value))}
                    />
                  </FormField>
                )}
              </div>
              <FormField
                label="Pasta de destino"
                htmlFor="bk-dir"
                hint="Caminho absoluto no servidor, ex.: /var/backups/innova ou D:\Backups\innova. Monte aqui o volume/partilha externa."
              >
                <Combobox
                  items={DESTINATION_SUGGESTIONS}
                  allowCustom
                  placeholder="Escolher ou escrever o caminho…"
                  searchPlaceholder="Escreva o caminho no servidor…"
                  value={form.destinationDir}
                  onValueChange={(v) => set('destinationDir', v)}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Retenção (dias)" htmlFor="bk-retention">
                  <Input
                    id="bk-retention"
                    type="number"
                    min={1}
                    className="w-full"
                    value={form.retentionDays}
                    onChange={(e) =>
                      set('retentionDays', Number(e.target.value))
                    }
                  />
                </FormField>
                <FormField
                  label="Cópias mínimas a manter"
                  htmlFor="bk-min"
                  hint="Nunca elimina abaixo deste número, mesmo que expiradas."
                >
                  <Input
                    id="bk-min"
                    type="number"
                    min={1}
                    className="w-full"
                    value={form.minCopies}
                    onChange={(e) => set('minCopies', Number(e.target.value))}
                  />
                </FormField>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'A guardar…' : 'Guardar alterações'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Histórico
        </div>
        <CardBody>
          {data.runs.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Ainda não foi executado nenhum backup"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="text-xs text-ink-faint">
                  <tr>
                    <th className="py-2 pr-3">Início</th>
                    <th className="pr-3">Origem</th>
                    <th className="pr-3">Estado</th>
                    <th className="pr-3">Tamanho</th>
                    <th className="pr-3">Ficheiro</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map((r) => {
                    const st = RUN_STATUS[r.status];
                    const canRestore =
                      r.status === 'SUCCESS' &&
                      !r.deletedAt &&
                      data.restoreEnabled &&
                      data.tools.pgRestore;
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-border align-top"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {fmtDate(r.startedAt)}
                        </td>
                        <td className="pr-3">{TRIGGER_LABEL[r.trigger]}</td>
                        <td className="pr-3">
                          <Badge intent={st.intent}>{st.label}</Badge>
                          {r.restoredAt && (
                            <div className="text-xs text-ink-faint">
                              Restaurado {fmtDate(r.restoredAt)}
                            </div>
                          )}
                        </td>
                        <td className="pr-3">{fmtBytes(r.sizeBytes)}</td>
                        <td className="max-w-[260px] break-all pr-3 text-xs text-ink-faint">
                          {r.error ??
                            (r.deletedAt
                              ? 'Eliminado pela retenção'
                              : r.filePath)}
                        </td>
                        <td>
                          {canRestore && (
                            <Button
                              type="button"
                              intent="ghost"
                              onClick={() => setRestoreId(r.id)}
                            >
                              Restaurar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!data.restoreEnabled && (
            <p className="mt-3 text-xs text-ink-faint">
              A restauração a partir da aplicação está desactivada neste
              ambiente (defina BACKUP_RESTORE_ENABLED=true no servidor para a
              permitir).
            </p>
          )}
        </CardBody>
      </Card>

      {restoreId !== null && (
        <Card>
          <CardBody>
            <h3 className="mb-2 text-base font-bold text-danger">
              Restaurar o backup #{restoreId}
            </h3>
            <p className="mb-4 text-sm text-ink">
              Esta acção substitui TODOS os dados actuais pelos do backup. É
              criada primeiro uma cópia de segurança do estado actual. A
              plataforma pode ficar indisponível durante o processo.
            </p>
            <FormField
              label="Escreva RESTAURAR para confirmar"
              htmlFor="bk-confirm"
            >
              <Input
                id="bk-confirm"
                className="w-full"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </FormField>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                intent="ghost"
                onClick={() => {
                  setRestoreId(null);
                  setConfirmation('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                intent="danger"
                disabled={confirmation !== 'RESTAURAR' || restore.isPending}
                onClick={() => restore.mutate(restoreId)}
              >
                {restore.isPending ? 'A restaurar…' : 'Restaurar base de dados'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
