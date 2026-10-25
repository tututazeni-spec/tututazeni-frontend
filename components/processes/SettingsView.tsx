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

interface SectionEditorProps {
  section: ProcessSettingSection;
  canEdit: boolean;
  onClose: () => void;
}

function SectionEditor({ section, canEdit, onClose }: SectionEditorProps) {
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
        : apiClient.post(
            `/processes/settings/${section.key}/restore/${v.version}`,
            {},
          ),
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
        navyBanner
        className="left-[calc(50%+120px)] max-h-[90vh] w-[calc(100vw-240px-2rem)] max-w-4xl overflow-y-auto"
      >
        <div className="-mx-6 -mt-4 mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 bg-brand px-6 pb-4 font-body text-xs text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium ring-1 ring-white/20">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${section.enforced ? 'bg-emerald-400' : 'bg-amber-300'}`}
            />
            {section.enforced
              ? 'Aplicada pelo motor'
              : 'Política de referência (ainda não aplicada pelo motor)'}
          </span>
          <span className="text-white/80">
            {section.isDefault
              ? 'Valores por omissão'
              : `Versão ${section.version}`}
            {section.updatedAt ? ` · ${formatDateTime(section.updatedAt)}` : ''}
            {section.updatedBy ? ` · ${section.updatedBy}` : ''}
          </span>
        </div>

        <div className="mt-5">
          {schema ? (
            <SettingForm
              schema={schema}
              value={value}
              onChange={setValue}
              disabled={!canEdit}
            />
          ) : (
            <p className="font-body text-sm text-ink-muted">
              Sem editor para esta secção.
            </p>
          )}
        </div>

        {canEdit && (
          <div className="mt-5">
            <FormField
              label="Motivo da alteração (opcional)"
              htmlFor="setting-reason"
            >
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

        <div className="-mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-brand/15 bg-brand/5 px-6 pt-4">
          <div className="flex gap-2">
            <Button
              intent="ghost"
              size="sm"
              onClick={() => setShowHistory((s) => !s)}
            >
              <History size={14} strokeWidth={1.75} />
              {showHistory ? 'Esconder versões' : 'Ver versões'}
            </Button>
            {canEdit && !section.isDefault && (
              <Button
                intent="ghost"
                size="sm"
                onClick={() => restore.mutate('reset')}
                loading={restore.isPending}
              >
                Repor valores por omissão
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button intent="ghost" onClick={onClose}>
              {canEdit ? 'Cancelar' : 'Fechar'}
            </Button>
            {canEdit && (
              <Button
                onClick={() => save.mutate(undefined)}
                loading={save.isPending}
              >
                Guardar
              </Button>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="mt-4 overflow-hidden rounded-card border border-brand/30">
            <div className="bg-brand px-3 py-2 font-body text-xs font-medium text-white">
              Histórico de versões
            </div>
            {history.isLoading && (
              <div className="p-3">
                <Skeleton rows={2} />
              </div>
            )}
            {history.data && history.data.length === 0 && (
              <EmptyState
                variant="inline"
                title="Ainda não há versões guardadas"
              />
            )}
            {history.data?.map((v) => (
              <div
                key={v.version}
                className="flex items-start justify-between gap-3 border-b border-border p-3 last:border-0"
              >
                <div className="font-body text-sm text-ink">
                  <div className="font-medium">
                    Versão {v.version}
                    {v.version === section.version && (
                      <span className="ml-2 rounded-control bg-primary-subtle px-1.5 py-0.5 text-xs text-primary">
                        actual
                      </span>
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

export function SettingsView({
  canEdit,
  canRetry,
  onOpenInstance,
}: SettingsViewProps) {
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
        {(
          [
            ['settings', 'Configurações gerais'],
            ['integrations', 'Integração com os módulos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-control border px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === id
                ? 'border-brand bg-brand text-white'
                : 'border-brand bg-white text-brand'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'integrations' && (
        <IntegrationsView canRetry={canRetry} onOpenInstance={onOpenInstance} />
      )}

      {mode === 'settings' && (
        <>
          {!canEdit && (
            <p className="font-body text-xs text-ink-muted">
              Modo de consulta — apenas administradores podem alterar as
              configurações.
            </p>
          )}
          {isLoading && <Skeleton rows={6} />}
          {error && (
            <div className="font-body text-sm text-danger">{error.message}</div>
          )}
          {data && data.length === 0 && (
            <EmptyState
              icon={Settings2}
              title="Sem configurações"
              description="Não foi possível carregar as secções."
            />
          )}
          {data && (
            <div className="grid gap-3 md:grid-cols-2">
              {data.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setOpen(s.key)}
                  className="group cursor-pointer overflow-hidden rounded-card border border-border bg-surface text-left"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border bg-brand/60 px-4 py-3">
                    <div className="font-body text-sm font-semibold text-white">
                      {s.title}
                    </div>
                    {s.enforced && (
                      <span
                        title="Aplicada pelo motor"
                        className="shrink-0 text-white"
                      >
                        <CheckCircle2 size={16} strokeWidth={1.75} />
                      </span>
                    )}
                  </div>
                  <div className="p-4 transition-colors group-hover:bg-brand/10">
                    <p className="font-body text-xs text-brand">
                      {s.description}
                    </p>
                    <div className="mt-2 font-body text-xs text-brand">
                      {s.isDefault
                        ? 'Valores por omissão'
                        : `Versão ${s.version} · ${formatDateTime(s.updatedAt)}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {section && (
        <SectionEditor
          key={section.key}
          section={section}
          canEdit={canEdit}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
