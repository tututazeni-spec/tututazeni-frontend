// components/settings/TabSistema.tsx
// Tab "Sistema" (ADMIN): modo de manutenção, paginação, uploads, retenção de
// jobs e operação de cache/filas — GET/PUT /settings/system, GET
// /settings/system/status e acções em /settings/system/* (docs/modulo_settings.md §15).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { SystemSettingsForm, SystemSettingsView, SystemStatus } from './types';

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TabSistema() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<SystemSettingsView>(
    queryKeys.settings.systemSettings(),
    '/settings/system',
  );
  const status = useApiQuery<SystemStatus>(queryKeys.settings.systemStatus(), '/settings/system/status', {
    refetchInterval: 10_000,
  });
  const [form, setForm] = useState<SystemSettingsForm | null>(null);

  useEffect(() => {
    if (data) setForm(data.settings);
  }, [data]);

  const onError = (e: Error) => toast({ title: e.message, intent: 'danger' });
  const refreshStatus = [queryKeys.settings.systemStatus()];

  const save = useApiMutation(
    (payload: SystemSettingsForm) => apiClient.put('/settings/system', payload),
    {
      invalidateKeys: [queryKeys.settings.systemSettings()],
      onSuccess: () => toast({ title: 'Parâmetros de sistema guardados', intent: 'success' }),
      onError,
    },
  );

  const flush = useApiMutation(
    (namespace: string) =>
      apiClient.post<{ removed: number }>('/settings/system/cache/flush', { namespace }),
    {
      invalidateKeys: refreshStatus,
      onSuccess: (r) => toast({ title: `Cache limpa (${r.removed} chaves)`, intent: 'success' }),
      onError,
    },
  );

  const queueAction = useApiMutation(
    ({ name, action }: { name: string; action: 'pause' | 'resume' | 'clean' | 'retry-failed' }) =>
      apiClient.post<Record<string, unknown>>(`/settings/system/queues/${name}/${action}`, {}),
    {
      invalidateKeys: refreshStatus,
      onSuccess: () => toast({ title: 'Acção executada', intent: 'success' }),
      onError,
    },
  );

  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;
  if (isLoading || !data || !form)
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;

  const st = status.data;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form) save.mutate(form);
  }

  function toggleMime(m: string, on: boolean) {
    setForm((f) =>
      f
        ? {
            ...f,
            uploads: {
              ...f.uploads,
              allowedMimeTypes: on
                ? [...f.uploads.allowedMimeTypes, m]
                : f.uploads.allowedMimeTypes.filter((x) => x !== m),
            },
          }
        : f,
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Estado do sistema</h3>
          {!st ? (
            <p className="text-sm text-ink-faint">A carregar estado…</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm text-ink md:grid-cols-4">
              <div>
                <dt className="text-xs text-ink-faint">Base de dados</dt>
                <dd>
                  <Badge intent={st.db.connected ? 'success' : 'danger'}>
                    {st.db.connected ? 'Ligada' : 'Sem ligação'}
                  </Badge>
                  {st.db.connected && (
                    <span className="ml-2 text-xs text-ink-faint">
                      {st.db.latencyMs} ms · {st.db.sizeMb} MB · pool {st.db.poolMax}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Cache (Redis)</dt>
                <dd>
                  <Badge intent={st.cache.connected ? 'success' : 'danger'}>
                    {st.cache.connected ? 'Ligada' : 'Indisponível'}
                  </Badge>
                  {st.cache.connected && (
                    <span className="ml-2 text-xs text-ink-faint">
                      {st.cache.keys} chaves · {st.cache.usedMemoryMb ?? '?'} MB
                      {st.cache.enabled === false && ' · desactivada (CACHE_ENABLED)'}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Processo</dt>
                <dd>
                  {fmtUptime(st.process.uptimeSeconds)} · {st.process.memoryMb} MB
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Ambiente</dt>
                <dd>
                  {st.process.env} · Node {st.process.nodeVersion}
                </dd>
              </div>
            </dl>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {data.cacheNamespaces.map((ns) => (
              <Button
                key={ns}
                type="button"
                intent="secondary"
                disabled={flush.isPending || !st?.cache.connected}
                onClick={() => flush.mutate(ns)}
              >
                Limpar cache “{ns}”
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Filas */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Filas e jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="text-xs text-ink-faint">
                <tr>
                  <th className="py-2 pr-3">Fila</th>
                  <th className="pr-3">Estado</th>
                  <th className="pr-3">Espera</th>
                  <th className="pr-3">Activos</th>
                  <th className="pr-3">Falhados</th>
                  <th className="pr-3">Concluídos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(st?.queues ?? []).map((q) => (
                  <tr key={q.name} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium">{q.name}</td>
                    <td className="pr-3">
                      <Badge intent={q.paused ? 'warning' : 'success'}>{q.paused ? 'Em pausa' : 'Activa'}</Badge>
                    </td>
                    <td className="pr-3">{q.counts?.waiting ?? '—'}</td>
                    <td className="pr-3">{q.counts?.active ?? '—'}</td>
                    <td className="pr-3">{q.counts?.failed ?? '—'}</td>
                    <td className="pr-3">{q.counts?.completed ?? '—'}</td>
                    <td className="space-x-1 whitespace-nowrap py-1 text-right">
                      <Button
                        type="button"
                        intent="ghost"
                        disabled={queueAction.isPending}
                        onClick={() => queueAction.mutate({ name: q.name, action: q.paused ? 'resume' : 'pause' })}
                      >
                        {q.paused ? 'Retomar' : 'Pausar'}
                      </Button>
                      <Button
                        type="button"
                        intent="ghost"
                        disabled={queueAction.isPending || !q.counts?.failed}
                        onClick={() => queueAction.mutate({ name: q.name, action: 'retry-failed' })}
                      >
                        Repetir falhados
                      </Button>
                      <Button
                        type="button"
                        intent="ghost"
                        disabled={queueAction.isPending}
                        onClick={() => queueAction.mutate({ name: q.name, action: 'clean' })}
                      >
                        Limpar antigos
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={submit} className="space-y-4">
        {/* Manutenção */}
        <Card>
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Manutenção</h3>
            <div className="space-y-4">
              <label htmlFor="sys-maint" className="flex items-center gap-2 text-sm text-ink">
                <input
                  id="sys-maint"
                  type="checkbox"
                  checked={form.maintenance.enabled}
                  onChange={(e) =>
                    setForm({ ...form, maintenance: { ...form.maintenance, enabled: e.target.checked } })
                  }
                />
                Modo de manutenção (só administradores acedem; os restantes recebem 503)
              </label>
              <FormField label="Mensagem mostrada aos utilizadores" htmlFor="sys-maint-msg">
                <Textarea
                  id="sys-maint-msg"
                  className="w-full"
                  rows={2}
                  value={form.maintenance.message}
                  onChange={(e) =>
                    setForm({ ...form, maintenance: { ...form.maintenance, message: e.target.value } })
                  }
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* Limites */}
        <Card>
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Limites e parâmetros técnicos</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Paginação — máximo por página"
                htmlFor="sys-page"
                hint={`10–${data.limits.maxPageSizeCeiling}; reduz qualquer ?limit= superior`}
              >
                <Input
                  id="sys-page"
                  type="number"
                  min={10}
                  max={data.limits.maxPageSizeCeiling}
                  className="w-full"
                  value={form.pagination.maxPageSize}
                  onChange={(e) =>
                    setForm({ ...form, pagination: { maxPageSize: Number(e.target.value) } })
                  }
                />
              </FormField>
              <FormField
                label="Uploads — tamanho máximo (MB)"
                htmlFor="sys-upload"
                hint={`1–${data.limits.maxUploadMbCeiling}`}
              >
                <Input
                  id="sys-upload"
                  type="number"
                  min={1}
                  max={data.limits.maxUploadMbCeiling}
                  className="w-full"
                  value={form.uploads.maxFileSizeMb}
                  onChange={(e) =>
                    setForm({ ...form, uploads: { ...form.uploads, maxFileSizeMb: Number(e.target.value) } })
                  }
                />
              </FormField>
              <FormField label="Jobs — retenção (dias)" htmlFor="sys-jobs" hint="Usado por “Limpar antigos”">
                <Input
                  id="sys-jobs"
                  type="number"
                  min={1}
                  className="w-full"
                  value={form.jobs.retentionDays}
                  onChange={(e) => setForm({ ...form, jobs: { retentionDays: Number(e.target.value) } })}
                />
              </FormField>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-ink">Tipos de ficheiro permitidos</legend>
              <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
                {data.mimeTypeOptions.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={form.uploads.allowedMimeTypes.includes(m)}
                      onChange={(e) => toggleMime(m, e.target.checked)}
                    />
                    <span className="break-all">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'A guardar…' : 'Guardar alterações'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
