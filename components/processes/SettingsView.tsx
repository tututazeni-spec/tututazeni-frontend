// components/processes/SettingsView.tsx
// Aba «Configurações» (docs/Modulo_Processes.md §14 e §15): as 16 secções do
// módulo, com edição validada pelo servidor, versionamento (histórico +
// restauro) e registo de alterações; e a matriz de integração com os módulos.
// Só ADMIN altera; RH e Auditor consultam.

'use client';

import { useState } from 'react';
import { CheckCircle2, History, Settings2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { IntegrationsView } from './IntegrationsView';
import { SettingForm } from './SettingForm';
import { SETTING_SCHEMAS } from './setting-schemas';
import { Skeleton } from './Skeleton';
import type { ProcessSettingSection, ProcessSettingVersion } from './types';

export interface SettingsViewProps {
  canEdit: boolean;
  canRetry: boolean;
  onOpenInstance: (instanceId: number) => void;
}

type Mode = 'settings' | 'integrations';

function SectionEditor({
  section,
  canEdit,
  onClose,
}: {
  section: ProcessSettingSection;
  canEdit: boolean;
  onClose: () => void;
}) {
  const notify = useToast();
  const [value, setValue] = useState<unknown>(section.value);
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const schema = SETTING_SCHEMAS[section.key];

  const history = useApiQuery<ProcessSettingVersion[]>(
    queryKeys.processes.settingHistory(section.key),
    `/processes/settings/${section.key}/history`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: showHistory },
  );

  const save = useApiMutation(
    () =>
      apiClient.put(`/processes/settings/${section.key}`, {
        value,
        reason: reason.trim() || undefined,
        expectedVersion: section.version,
      }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Configuração guardada', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const restore = useApiMutation(
    (v: { version: number } | 'reset') =>
      v === 'reset'
        ? apiClient.post(`/processes/settings/${section.key}/reset`, {})
        : apiClient.post(`/processes/settings/${section.key}/restore/${v.version}`, {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Nova versão criada', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={section.title}
        description={section.description}
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-xs text-ink-muted">
          <span
            className={`rounded-control px-2 py-0.5 ${
              section.enforced ? 'bg-success-subtle text-success-ink' : 'bg-surface-sunken text-ink-muted'
            }`}
          >
            {section.enforced ? 'Aplicada pelo motor' : 'Política de referência (ainda não aplicada pelo motor)'}
          </span>
          <span>
            {section.isDefault ? 'Valores por omissão' : `Versão ${section.version}`}
            {section.updatedAt ? ` · ${formatDateTime(section.updatedAt)}` : ''}
            {section.updatedBy ? ` · ${section.updatedBy}` : ''}
          </span>
        </div>

        <div className="mt-5">
          {schema ? (
            <SettingForm schema={schema} value={value} onChange={setValue} disabled={!canEdit} />
          ) : (
            <p className="font-body text-sm text-ink-muted">Sem editor para esta secção.</p>
          )}
        </div>

        {canEdit && (
          <div className="mt-5">
            <FormField label="Motivo da alteração (opcional)" htmlFor="setting-reason">
              <Input
                id="setting-reason"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button intent="ghost" size="sm" onClick={() => setShowHistory((s) => !s)}>
              <History size={14} strokeWidth={1.75} />
              {showHistory ? 'Esconder versões' : 'Ver versões'}
            </Button>
            {canEdit && !section.isDefault && (
              <Button intent="ghost" size="sm" onClick={() => restore.mutate('reset')} loading={restore.isPending}>
                Repor valores por omissão
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button intent="ghost" onClick={onClose}>
              {canEdit ? 'Cancelar' : 'Fechar'}
            </Button>
            {canEdit && (
              <Button onClick={() => save.mutate(undefined)} loading={save.isPending}>
                Guardar
              </Button>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="mt-4 rounded-card border border-border">
            {history.isLoading && <div className="p-3"><Skeleton rows={2} /></div>}
            {history.data && history.data.length === 0 && (
              <p className="p-3 font-body text-sm text-ink-faint">Ainda não há versões guardadas.</p>
            )}
            {history.data?.map((v) => (
              <div key={v.version} className="flex items-start justify-between gap-3 border-b border-border p-3 last:border-0">
                <div className="font-body text-sm text-ink">
                  <div className="font-medium">
                    Versão {v.version}
                    {v.version === section.version && (
                      <span className="ml-2 rounded-control bg-primary-subtle px-1.5 py-0.5 text-xs text-primary">actual</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatDateTime(v.createdAt)} · {v.changedBy.fullName}
                    {v.reason ? ` · ${v.reason}` : ''}
                  </div>
                </div>
                {canEdit && v.version !== section.version && (
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => restore.mutate({ version: v.version })}
                    loading={restore.isPending}
                  >
                    Restaurar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

export function SettingsView({ canEdit, canRetry, onOpenInstance }: SettingsViewProps) {
  const [mode, setMode] = useState<Mode>('settings');
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error } = useApiQuery<ProcessSettingSection[]>(
    queryKeys.processes.settings(),
    '/processes/settings',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const section = data?.find((s) => s.key === open) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['settings', 'Configurações gerais'],
          ['integrations', 'Integração com os módulos'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'integrations' && <IntegrationsView canRetry={canRetry} onOpenInstance={onOpenInstance} />}

      {mode === 'settings' && (
        <>
          {!canEdit && (
            <p className="font-body text-xs text-ink-muted">
              Modo de consulta — apenas administradores podem alterar as configurações.
            </p>
          )}
          {isLoading && <Skeleton rows={6} />}
          {error && <div className="font-body text-sm text-danger">{error.message}</div>}
          {data && data.length === 0 && (
            <EmptyState icon={Settings2} title="Sem configurações" description="Não foi possível carregar as secções." />
          )}
          {data && (
            <div className="grid gap-3 md:grid-cols-2">
              {data.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setOpen(s.key)}
                  className="rounded-card border border-border bg-surface p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-body text-sm font-semibold text-ink">{s.title}</div>
                    {s.enforced && (
                      <span title="Aplicada pelo motor" className="shrink-0 text-success-ink">
                        <CheckCircle2 size={16} strokeWidth={1.75} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-body text-xs text-ink-muted">{s.description}</p>
                  <div className="mt-2 font-body text-xs text-ink-faint">
                    {s.isDefault ? 'Valores por omissão' : `Versão ${s.version} · ${formatDateTime(s.updatedAt)}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {section && <SectionEditor key={section.key} section={section} canEdit={canEdit} onClose={() => setOpen(null)} />}
    </div>
  );
}
