// components/processes/AutomationsView.tsx
// Aba «Automações» (docs/Modulo_Processes.md §9): regras do módulo de
// Automações aplicadas aos processos — lista com estado, última execução e
// resultado; criar (do zero ou de um modelo de exemplo), editar, activar,
// clonar, remover, ver execuções e testar.

'use client';

import { useState } from 'react';
import { Activity, AlertTriangle, Copy, Pencil, Plus, Power, Trash2, Zap } from 'lucide-react';
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

// Uma cor escura por modelo (texto branco legível em todas).
const TEMPLATE_CARD_COLORS = [
  '#1D4ED8', // azul
  '#0F766E', // verde-azulado
  '#7E22CE', // roxo
  '#B45309', // âmbar escuro
  '#BE123C', // carmim
  '#4D7C0F', // verde-lima escuro
  '#0E7490', // ciano escuro
];

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
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon={Zap} label="Regras" value={k?.total ?? '—'} intent="primary" />
        <KpiCard icon={Power} label="Activas" value={k?.active ?? '—'} intent="success" />
        <KpiCard icon={Activity} iconIntent="caution" label="Execuções (24 h)" value={k?.executions24h ?? '—'} intent="info" />
        <KpiCard
          icon={AlertTriangle}
          label="Falhas (24 h)"
          value={k?.failed24h ?? '—'}
          intent="danger"
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
          {catalog.templates.map((t, i) => (
            <div key={t.key} className="flex flex-col rounded-card border border-[#0F1F3D] p-3"
              style={{ backgroundColor: TEMPLATE_CARD_COLORS[i % TEMPLATE_CARD_COLORS.length] }}>
              <div className="font-body text-sm font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{t.name}</div>
              <p className="mt-0.5 mb-3 font-body text-[13px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{t.description}</p>
              <Button
                intent="ghost"
                size="sm"
                className="mt-auto self-start border border-[#0F1F3D] bg-black font-semibold text-white hover:bg-neutral-800 hover:text-white"
                onClick={() => setForm({ template: t })}
              >
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
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div>
            <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_80px_128px] gap-3 border-b border-border bg-[#0F1F3D]/60 px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-white cursor-default select-none pointer-events-none">
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
                className="relative grid cursor-pointer grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_80px_128px] items-center gap-3 border-b border-white/10 bg-[#0F1F3D] py-3 pl-5 pr-4 last:border-0"
                onClick={() => setOpenId(r.id)}
              >
                <span
                  className={`absolute inset-y-2 left-2 w-1 rounded-full ${r.active ? 'bg-success' : 'bg-ink-faint'}`}
                />
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                    <Zap size={16} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-body text-sm font-semibold text-white">{r.name}</div>
                    <div className="font-mono text-xs text-white">{r.code ?? `#${r.id}`}</div>
                  </div>
                </div>
                <div className="font-body text-xs text-white">
                  <div>{r.triggerLabel}</div>
                  {r.conditions && <div className="text-white">{r.conditions.rows.length} condição(ões)</div>}
                </div>
                <div className="font-body text-xs text-white">{r.actionLabel}</div>
                <div className="font-body text-xs text-white">
                  {r.lastRunAt ? (
                    <>
                      <div>{formatDateTime(r.lastRunAt)}</div>
                      {r.lastRunStatus && <StatusBadge value={r.lastRunStatus} map={EXECUTION_STATUS_MAP} variant="dot" />}
                    </>
                  ) : (
                    'Nunca'
                  )}
                  <div className="text-white">
                    {r.stats.success} ok · {r.stats.failed} falhas
                  </div>
                </div>
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${
                      r.active ? 'bg-success-subtle text-success-ink' : 'bg-white/15 text-white'
                    }`}
                  >
                    {r.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button type="button" title="Editar" className="rounded p-1.5 text-white hover:bg-white/10 hover:text-white" onClick={() => setForm({ initial: r })}>
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title={r.active ? 'Desactivar' : 'Activar'} className="rounded p-1.5 text-white hover:bg-white/10 hover:text-white" onClick={() => act.mutate({ path: `${r.id}/toggle`, method: 'patch', ok: r.active ? 'Regra desactivada' : 'Regra activada' })}>
                    <Power size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title="Clonar" className="rounded p-1.5 text-white hover:bg-white/10 hover:text-white" onClick={() => act.mutate({ path: `${r.id}/clone`, method: 'post', ok: 'Regra clonada (inactiva)' })}>
                    <Copy size={14} strokeWidth={1.75} />
                  </button>
                  <button type="button" title="Remover" className="rounded p-1.5 text-white hover:bg-white/10 hover:text-white" onClick={() => setToDelete(r)}>
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
