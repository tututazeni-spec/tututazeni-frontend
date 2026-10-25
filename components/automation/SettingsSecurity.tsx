// components/automation/SettingsSecurity.tsx
// Painéis de Configurações (§10): Repetição e falhas (dead letter) e Segurança
// (publicações críticas pendentes, ligações/segredos, auditoria de alterações).

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  KeyRound,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { downloadCsv } from './downloadCsv';
import type {
  AuditRow,
  AutomationConnection,
  ConnectionAuth,
  ConnectionType,
  CsvExport,
  DeadLetter,
  DeadLetterSummary,
  Paginated,
  PendingPublication,
} from './types';
import { formatDateTimeNumeric } from '@/lib/format';

const fmt = (iso?: string | null) =>
  iso ? formatDateTimeNumeric(iso) : '–';

const section =
  'rounded-card border border-border bg-surface p-4 shadow-resting';

// ─── Repetição e falhas ───────────────────────────────────────────

const DL_STATUS: Record<
  DeadLetter['status'],
  { label: string; intent: BadgeProps['intent'] }
> = {
  OPEN: { label: 'Por tratar', intent: 'danger' },
  REPROCESSED: { label: 'Reprocessada', intent: 'success' },
  DISCARDED: { label: 'Descartada', intent: 'neutral' },
};

export function DeadLettersPanel() {
  const notify = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('OPEN');
  const params = { status: status || undefined, limit: 30 };
  const { data, isLoading } = useApiQuery<Paginated<DeadLetter>>(
    queryKeys.automation.deadLetters(params),
    '/automation/dead-letters',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: summary } = useApiQuery<DeadLetterSummary>(
    queryKeys.automation.deadLetterSummary(),
    '/automation/dead-letters/summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const invalidateKeys = [
    queryKeys.automation.deadLetters(),
    queryKeys.automation.deadLetterSummary(),
  ];
  const act = useApiMutation(
    ({ id, verb }: { id: string; verb: 'reprocess' | 'discard' }) =>
      verb === 'reprocess'
        ? apiClient.post(`/automation/dead-letters/${id}/reprocess`, {})
        : apiClient.patch(`/automation/dead-letters/${id}/discard`, {
            note: 'Descartada pelo administrador',
          }),
    {
      invalidateKeys,
      onSuccess: (_d, v) =>
        notify({
          title:
            v.verb === 'reprocess'
              ? 'Execução reprocessada'
              : 'Falha descartada',
          intent: 'success',
        }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const discard = async (d: DeadLetter) => {
    const ok = await confirm({
      title: 'Descartar falha',
      message: `Fica registado que “${d.ruleName ?? `#${d.ruleId}`}” foi descartada, sem nova tentativa.`,
      confirmLabel: 'Descartar',
      destructive: true,
    });
    if (ok) act.mutate({ id: d.id, verb: 'discard' });
  };
  const exportCsv = async () => {
    try {
      downloadCsv(
        await apiClient.get<CsvExport>('/automation/dead-letters/export', {
          params,
        }),
      );
    } catch (e) {
      reportError(e, { source: 'SettingsSecurity.deadLettersExport' });
      notify({ title: 'Não foi possível exportar', intent: 'danger' });
    }
  };

  const rows = data?.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-sm text-ink-muted">
        Execuções que falharam depois de esgotadas as tentativas automáticas. O
        número de tentativas e o intervalo definem-se em cada automação; aqui
        trata-se o que ficou por resolver.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NavyStatCard
          icon={AlertCircle}
          tone="orange"
          iconTone="yellow"
          label="Por tratar"
          value={summary?.open ?? '…'}
        />
        <NavyStatCard
          icon={RotateCcw}
          tone="green"
          label="Reprocessadas"
          value={summary?.reprocessed ?? '…'}
        />
        <NavyStatCard
          icon={Trash2}
          tone="red"
          label="Descartadas"
          value={summary?.discarded ?? '…'}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          items={[
            { value: '', label: 'Todas' },
            ...Object.entries(DL_STATUS).map(([value, m]) => ({
              value,
              label: m.label,
            })),
          ]}
          value={status}
          onValueChange={setStatus}
          className="min-w-[180px]"
        />
        <Button
          className="ml-auto"
          size="sm"
          intent="secondary"
          onClick={exportCsv}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar
        </Button>
      </div>
      {isLoading ? (
        <Skeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sem falhas definitivas"
          description="Nenhuma execução esgotou as tentativas neste filtro."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((d) => {
            const st = DL_STATUS[d.status];
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <p className="truncate font-display text-sm font-bold text-brand">
                    {d.ruleName ?? `Automação #${d.ruleId}`}
                  </p>
                  <p
                    className="truncate font-body text-xs text-ink-muted"
                    title={d.errorMessage ?? undefined}
                  >
                    {d.errorCode ? `${d.errorCode} · ` : ''}
                    {d.errorMessage ?? 'Sem detalhe do erro'}
                  </p>
                </div>
                <span className="font-body text-xs text-ink-muted">
                  {d.attempts} tentativa{d.attempts === 1 ? '' : 's'} ·{' '}
                  {fmt(d.createdAt)}
                </span>
                <Badge intent={st.intent}>{st.label}</Badge>
                {d.status === 'OPEN' && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      intent="secondary"
                      disabled={act.isPending}
                      onClick={() =>
                        act.mutate({ id: d.id, verb: 'reprocess' })
                      }
                    >
                      <RotateCcw size={14} strokeWidth={1.75} />
                      Reprocessar
                    </Button>
                    <Button
                      size="sm"
                      intent="ghost"
                      disabled={act.isPending}
                      onClick={() => void discard(d)}
                    >
                      Descartar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Segurança ────────────────────────────────────────────────────

export function SecurityPanel() {
  return (
    <div className="flex flex-col gap-5">
      <PublicationsSection />
      <ConnectionsSection />
      <AuditSection />
    </div>
  );
}

function PublicationsSection() {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<PendingPublication[]>(
    queryKeys.automation.publications(),
    '/automation/publications/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const [rejecting, setRejecting] = useState<PendingPublication | null>(null);
  const [note, setNote] = useState('');

  const decide = useApiMutation(
    ({
      id,
      verb,
      note: n,
    }: {
      id: number;
      verb: 'approve' | 'reject';
      note?: string;
    }) =>
      apiClient.post(`/automation/rules/${id}/publication/${verb}`, {
        ...(n ? { note: n } : {}),
      }),
    {
      invalidateKeys: [
        queryKeys.automation.publications(),
        queryKeys.automation.rules(),
      ],
      onSuccess: (_d, v) => {
        notify({
          title:
            v.verb === 'approve'
              ? 'Publicação aprovada'
              : 'Publicação recusada',
          intent: 'success',
        });
        setRejecting(null);
        setNote('');
      },
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <section className={section}>
      <h3 className="font-display text-sm font-bold text-brand">
        Publicações críticas pendentes
      </h3>
      <p className="mb-3 font-body text-xs text-ink-muted">
        Automações críticas só ficam activas depois de aprovadas por um
        administrador diferente de quem pediu.
      </p>
      {isLoading ? (
        <Skeleton rows={2} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          variant="inline"
          title="Nenhuma publicação à espera de aprovação"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-card bg-surface-sunken px-3 py-2"
            >
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-body text-sm font-semibold text-brand">
                  {p.name}{' '}
                  <span className="font-normal text-ink-muted">
                    · versão {p.version}
                  </span>
                </p>
                <p className="font-body text-xs text-ink-muted">
                  Pedida por {p.requestedByName ?? 'desconhecido'} ·{' '}
                  {fmt(p.publishRequestedAt)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ id: p.id, verb: 'approve' })}
              >
                <CheckCircle2 size={14} strokeWidth={1.75} />
                Aprovar
              </Button>
              <Button
                size="sm"
                intent="danger"
                disabled={decide.isPending}
                onClick={() => setRejecting(p)}
              >
                <XCircle size={14} strokeWidth={1.75} />
                Recusar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {rejecting && (
        <Modal open onOpenChange={(o) => !o && setRejecting(null)}>
          <ModalContent
            title="Recusar publicação"
            description={`“${rejecting.name}” volta a rascunho. Indique o motivo.`}
          >
            <div className="mt-4">
              <FormField label="Motivo *" htmlFor="pub-note">
                <Input
                  id="pub-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button intent="ghost" onClick={() => setRejecting(null)}>
                Cancelar
              </Button>
              <Button
                intent="danger"
                disabled={!note.trim()}
                loading={decide.isPending}
                onClick={() =>
                  decide.mutate({
                    id: rejecting.id,
                    verb: 'reject',
                    note: note.trim(),
                  })
                }
              >
                Recusar publicação
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: 'HTTP', label: 'API HTTP' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'SMTP', label: 'Email (SMTP)' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'OTHER', label: 'Outra' },
];
const AUTH_TYPES: { value: ConnectionAuth; label: string }[] = [
  { value: 'NONE', label: 'Sem autenticação' },
  { value: 'BEARER', label: 'Token (Bearer)' },
  { value: 'BASIC', label: 'Utilizador e palavra-passe' },
  { value: 'API_KEY_HEADER', label: 'Chave num cabeçalho' },
];

function ConnectionsSection() {
  const notify = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useApiQuery<Paginated<AutomationConnection>>(
    queryKeys.automation.connections(),
    '/automation/connections',
    { params: { limit: 50 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const rows = data?.data ?? [];

  const act = useApiMutation(
    ({
      id,
      verb,
    }: {
      id: string;
      verb: 'test' | 'toggle' | 'delete';
      status?: 'ACTIVE' | 'DISABLED';
    }) => {
      if (verb === 'test')
        return apiClient.post(`/automation/connections/${id}/test`, {});
      if (verb === 'delete')
        return apiClient.delete(`/automation/connections/${id}`);
      return Promise.reject(new Error('Acção inválida'));
    },
    {
      invalidateKeys: [queryKeys.automation.connections()],
      onSuccess: (r: unknown, v) => {
        const res = r as { status?: string; error?: string };
        notify({
          title:
            v.verb === 'test'
              ? res.status === 'OK' || res.status === 'SUCCESS'
                ? 'Ligação testada com sucesso'
                : `Teste da ligação: ${res.status ?? 'sem resposta'}${res.error ? ` — ${res.error}` : ''}`
              : 'Ligação removida',
          intent: v.verb === 'test' && res.error ? 'danger' : 'success',
        });
      },
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const setStatus = useApiMutation(
    ({ id, status }: { id: string; status: 'ACTIVE' | 'DISABLED' }) =>
      apiClient.put(`/automation/connections/${id}`, { status }),
    {
      invalidateKeys: [queryKeys.automation.connections()],
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = async (c: AutomationConnection) => {
    const ok = await confirm({
      title: 'Remover ligação',
      message: `“${c.name}” e o seu segredo são apagados. As automações que a usam deixam de funcionar.`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) act.mutate({ id: c.id, verb: 'delete' });
  };

  return (
    <section className={section}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-brand">
            Ligações e segredos
          </h3>
          <p className="font-body text-xs text-ink-muted">
            Credenciais de APIs e serviços externos. O segredo é cifrado e nunca
            volta a ser mostrado.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Nova ligação
        </Button>
      </div>
      {isLoading ? (
        <Skeleton rows={2} />
      ) : rows.length === 0 ? (
        <EmptyState variant="inline" title="Sem ligações configuradas" />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-card bg-surface-sunken px-3 py-2"
            >
              <KeyRound size={16} strokeWidth={1.75} aria-hidden />
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-body text-sm font-semibold text-brand">
                  {c.name}
                </p>
                <p className="truncate font-body text-xs text-ink-muted">
                  {CONNECTION_TYPES.find((t) => t.value === c.type)?.label ??
                    c.type}
                  {c.baseUrl ? ` · ${c.baseUrl}` : ''}
                  {c.hasSecret ? ' · segredo guardado' : ''}
                </p>
              </div>
              <Badge intent={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {c.status === 'ACTIVE' ? 'Activa' : 'Desactivada'}
              </Badge>
              <Button
                size="sm"
                intent="secondary"
                disabled={act.isPending}
                onClick={() => act.mutate({ id: c.id, verb: 'test' })}
              >
                Testar
              </Button>
              <Button
                size="sm"
                intent="ghost"
                disabled={setStatus.isPending}
                onClick={() =>
                  setStatus.mutate({
                    id: c.id,
                    status: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                  })
                }
              >
                {c.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                size="sm"
                intent="ghost"
                aria-label={`Remover ${c.name}`}
                onClick={() => void remove(c)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {creating && <ConnectionModal onClose={() => setCreating(false)} />}
    </section>
  );
}

function ConnectionModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<ConnectionType>('HTTP');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<ConnectionAuth>('NONE');
  const [headerName, setHeaderName] = useState('');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const save = useApiMutation(
    () =>
      apiClient.post('/automation/connections', {
        name: name.trim(),
        type,
        authType,
        ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
        ...(authType === 'API_KEY_HEADER'
          ? { headerName: headerName.trim() }
          : {}),
        ...(authType === 'BASIC' ? { username: username.trim() } : {}),
        ...(authType !== 'NONE' && secret ? { secret } : {}),
      }),
    {
      invalidateKeys: [queryKeys.automation.connections()],
      onSuccess: () => {
        notify({ title: 'Ligação criada', intent: 'success' });
        onClose();
      },
      onError: (e: Error) => setError(e.message || 'Erro ao guardar.'),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Nova ligação"
        description="O segredo é cifrado em repouso e não pode ser consultado depois."
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-4 flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink"
            >
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Nome *" htmlFor="cn-name">
            <Input
              id="cn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tipo" htmlFor="cn-type">
              <Select
                items={CONNECTION_TYPES}
                value={type}
                onValueChange={(v) => setType(v as ConnectionType)}
                className="w-full"
              />
            </FormField>
            <FormField label="Autenticação" htmlFor="cn-auth">
              <Select
                items={AUTH_TYPES}
                value={authType}
                onValueChange={(v) => setAuthType(v as ConnectionAuth)}
                className="w-full"
              />
            </FormField>
          </div>
          <FormField
            label="Endereço base"
            htmlFor="cn-url"
            hint="Tem de começar por http:// ou https://"
          >
            <Input
              id="cn-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </FormField>
          {authType === 'BASIC' && (
            <FormField label="Utilizador *" htmlFor="cn-user">
              <Input
                id="cn-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormField>
          )}
          {authType === 'API_KEY_HEADER' && (
            <FormField label="Nome do cabeçalho *" htmlFor="cn-header">
              <Input
                id="cn-header"
                value={headerName}
                onChange={(e) => setHeaderName(e.target.value)}
                placeholder="X-API-Key"
              />
            </FormField>
          )}
          {authType !== 'NONE' && (
            <FormField label="Segredo *" htmlFor="cn-secret">
              <Input
                id="cn-secret"
                type="password"
                autoComplete="new-password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </FormField>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!name.trim()}
            loading={save.isPending}
            onClick={() => {
              setError('');
              save.mutate(undefined);
            }}
          >
            Criar ligação
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

const AUDIT_ENTITY: { value: string; label: string }[] = [
  { value: '', label: 'Todas as entidades' },
  { value: 'RULE', label: 'Automações' },
  { value: 'SETTINGS', label: 'Definições' },
  { value: 'PERMISSION', label: 'Permissões' },
  { value: 'CONNECTION', label: 'Ligações' },
  { value: 'DEAD_LETTER', label: 'Falhas definitivas' },
  { value: 'RETENTION', label: 'Retenção' },
];

function AuditSection() {
  const notify = useToast();
  const [entity, setEntity] = useState('');
  const params = { entity: entity || undefined, limit: 20 };
  const { data, isLoading } = useApiQuery<Paginated<AuditRow>>(
    queryKeys.automation.audit(params),
    '/automation/audit',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const rows = data?.data ?? [];

  const exportCsv = async () => {
    try {
      downloadCsv(
        await apiClient.get<CsvExport>('/automation/audit/export', { params }),
      );
    } catch (e) {
      reportError(e, { source: 'SettingsSecurity.auditExport' });
      notify({
        title: 'Não foi possível exportar a auditoria',
        intent: 'danger',
      });
    }
  };

  return (
    <section className={section}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h3 className="font-display text-sm font-bold text-brand">
            Auditoria de alterações
          </h3>
          <p className="font-body text-xs text-ink-muted">
            Quem alterou cada configuração e quando. Segredos e dados sensíveis
            aparecem ocultados.
          </p>
        </div>
        <Select
          items={AUDIT_ENTITY}
          value={entity}
          onValueChange={setEntity}
          className="min-w-[200px]"
        />
        <Button size="sm" intent="secondary" onClick={exportCsv}>
          <Download size={14} strokeWidth={1.75} />
          Exportar
        </Button>
      </div>
      {isLoading ? (
        <Skeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState variant="inline" title="Sem registos" />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-card bg-surface-sunken px-3 py-2 font-body text-xs"
            >
              <p className="text-brand">
                <span className="font-semibold">{r.action}</span>
                {' · '}
                {r.entity}
                {r.entityId ? ` ${r.entityId}` : ''}
                <span className="text-ink-muted">
                  {' · '}
                  {r.userName ?? (r.userId ? `#${r.userId}` : 'sistema')}
                  {' · '}
                  {fmt(r.createdAt)}
                </span>
              </p>
              {(r.before != null || r.after != null || r.note) && (
                <details className="mt-1 text-ink-muted">
                  <summary className="cursor-pointer">Ver alteração</summary>
                  {r.note && <p className="mt-1">{r.note}</p>}
                  {r.before != null && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-data">
                      Antes: {JSON.stringify(r.before, null, 1)}
                    </pre>
                  )}
                  {r.after != null && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-data">
                      Depois: {JSON.stringify(r.after, null, 1)}
                    </pre>
                  )}
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
