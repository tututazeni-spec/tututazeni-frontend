// components/processes/AutomationsView.tsx
// Aba «Automações» (docs/Modulo_Processes.md §9): regras do módulo de
// Automações aplicadas aos processos — lista com estado, última execução e
// resultado; criar (do zero ou de um modelo de exemplo), editar, activar,
// clonar, remover, ver execuções e testar.

'use client';

import { useState } from 'react';
import { Copy, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { AutomationFormModal } from './AutomationFormModal';
import { AutomationPanel } from './AutomationPanel';
import { EXECUTION_STATUS_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type {
  AutomationCatalog,
  AutomationList,
  AutomationRule,
  AutomationTemplate,
} from './automation-types';

export interface AutomationsViewProps {
  canManage: boolean;
}

export function AutomationsView({ canManage }: AutomationsViewProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [state, setState] = useState('ALL');
  const [form, setForm] = useState<{ initial?: AutomationRule; template?: AutomationTemplate } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AutomationRule | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const debounced = useDebounce(search, 300);
  const params = {
    ...(debounced ? { search: debounced } : {}),
    ...(state !== 'ALL' ? { state } : {}),
  };

  const { data, isLoading, error } = useApiQuery<AutomationList>(
    queryKeys.processes.automations(params),
    '/processes/automations',
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: canManage },
  );
  const { data: catalog } = useApiQuery<AutomationCatalog>(
    queryKeys.processes.automationCatalog(),
    '/processes/automations/catalog',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: canManage },
  );

  const act = useApiMutation(
    (v: { path: string; method: 'post' | 'patch' | 'delete'; ok: string }) =>
      v.method === 'delete'
        ? apiClient.delete(`/processes/automations/${v.path}`)
        : apiClient[v.method](`/processes/automations/${v.path}`, {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (_d, v) => notify({ title: v.ok, intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (!canManage) {
    return (
      <EmptyState
        title="Sem acesso"
        description="Só ADMIN e RH podem gerir as automações dos processos."
        className="mx-auto max-w-xl"
      />
    );
  }

  const k = data?.kpis;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <KpiCard label="Regras" value={k?.total ?? '—'} intent="primary" />
        <KpiCard label="Activas" value={k?.active ?? '—'} intent="success" />
        <KpiCard label="Execuções (24 h)" value={k?.executions24h ?? '—'} intent="info" />
        <KpiCard
          label="Falhas (24 h)"
          value={k?.failed24h ?? '—'}
          intent={k && k.failed24h > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código ou descrição…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[160px] flex-1"
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'inactive', label: 'Inactivas' },
          ]}
          value={state}
          onValueChange={setState}
          className="w-40"
        />
        <Button intent="secondary" onClick={() => setShowTemplates((s) => !s)}>
          Modelos de regras
        </Button>
        <Button onClick={() => catalog && setForm({})} disabled={!catalog}>
          <Plus size={16} strokeWidth={1.75} />
          Nova regra
        </Button>
      </div>

      {showTemplates && catalog && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {catalog.templates.map((t) => (
            <div key={t.key} className="rounded-card border border-border bg-surface p-3">
              <div className="font-body text-sm font-medium text-ink">{t.name}</div>
              <p className="mt-0.5 font-body text-xs text-ink-muted">{t.description}</p>
              <Button intent="ghost" size="sm" className="mt-2" onClick={() => setForm({ template: t })}>
                Usar este modelo
              </Button>
            </div>
          ))}
        </div>
      )}

      {isLoading && <Skeleton rows={4} />}
      {error && <p className="font-body text-sm text-danger">{error.message}</p>}
      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="Sem regras"
          description="Crie uma regra ou comece por um dos modelos de exemplo."
        />
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[1.8fr_1.4fr_1.2fr_1.3fr_120px_150px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              <div>Regra</div>
              <div>Evento</div>
              <div>Acção</div>
              <div>Última execução</div>
              <div>Estado</div>
              <div />
            </div>
            {data.data.map((r) => (
              <div
                key={r.id}
                className="grid cursor-pointer grid-cols-[1.8fr_1.4fr_1.2fr_1.3fr_120px_150px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
                onClick={() => setOpenId(r.id)}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">{r.name}</div>
                  <div className="font-mono text-xs text-ink-faint">{r.code ?? `#${r.id}`}</div>
                </div>
                <div className="font-body text-xs text-ink-muted">
                  <div>{r.triggerLabel}</div>
                  {r.conditions && <div className="text-ink-faint">{r.conditions.rows.length} condição(ões)</div>}
                </div>
                <div className="font-body text-xs text-ink-muted">{r.actionLabel}</div>
                <div className="font-body text-xs text-ink-muted">
                  {r.lastRunAt ? (
                    <>
                      <div>{formatDateTime(r.lastRunAt)}</div>
                      {r.lastRunStatus && <StatusBadge value={r.lastRunStatus} map={EXECUTION_STATUS_MAP} />}
                    </>
                  ) : (
                    'Nunca'
                  )}
                  <div className="text-ink-faint">
                    {r.stats.success} ok · {r.stats.failed} falhas
                  </div>
                </div>
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${
                      r.active ? 'bg-success-subtle text-success-ink' : 'bg-surface-sunken text-ink-faint'
                    }`}
                  >
                    {r.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button type="button" title="Editar" className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken" onClick={() => setForm({ initial: r })}>
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title={r.active ? 'Desactivar' : 'Activar'} className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken" onClick={() => act.mutate({ path: `${r.id}/toggle`, method: 'patch', ok: r.active ? 'Regra desactivada' : 'Regra activada' })}>
                    <Power size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title="Clonar" className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken" onClick={() => act.mutate({ path: `${r.id}/clone`, method: 'post', ok: 'Regra clonada (inactiva)' })}>
                    <Copy size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title="Remover" className="rounded p-1.5 text-ink-muted hover:bg-danger-subtle hover:text-danger" onClick={() => setToDelete(r)}>
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {form && catalog && (
        <AutomationFormModal
          key={form.initial?.id ?? form.template?.key ?? 'new'}
          catalog={catalog}
          initial={form.initial}
          template={form.template}
          onClose={() => setForm(null)}
        />
      )}
      {openId !== null && (
        <AutomationPanel id={openId} canManage={canManage} onClose={() => setOpenId(null)} />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Remover regra"
          message={`Remover «${toDelete.name}»? Regras com histórico de execuções não podem ser removidas — desactive-as.`}
          confirmLabel="Remover"
          destructive
          onConfirm={() => {
            act.mutate({ path: String(toDelete.id), method: 'delete', ok: 'Regra removida' });
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
