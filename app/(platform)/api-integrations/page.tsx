'use client';
// src/app/(dashboard)/api-integrations/page.tsx

import { useState } from 'react';
import {
  Plug, Key, Zap, BarChart2, Activity, CheckCircle, AlertTriangle,
  RefreshCw, Plus, Trash2, Play, Pause, RotateCcw, Copy, Eye, EyeOff,
  Clock, TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'integrations' | 'webhooks' | 'api-keys' | 'monitoring';

function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-16" />)}</div>;
}

const HEALTH_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  OK:       { color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  ERROR:    { color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500' },
  DEGRADED: { color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  STALE:    { color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  INACTIVE: { color: 'text-slate-500',   bg: 'bg-slate-100',   dot: 'bg-slate-300' },
  UNKNOWN:  { color: 'text-slate-400',   bg: 'bg-slate-100',   dot: 'bg-slate-300' },
};

// ─── Integrations Tab ────────────────────────────────────────────

function IntegrationsTab() {
  const [testing, setTesting] = useState<number | null>(null);

  const { data: list = [], isLoading: loading, refetch } = useApiQuery<any[]>(
    queryKeys.apiIntegrations.list(), '/api-integrations', { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => { void refetch(); };

  const testIntegration = async (id: number) => {
    setTesting(id);
    const r = await apiClient.post<any>(`/api-integrations/${id}/test`, {}).catch(() => null);
    setTesting(null);
    if (r) alert(r.success ? `✅ ${r.message}` : `❌ ${r.message}`);
    load();
  };

  const toggle = async (id: number) => { await apiClient.patch(`/api-integrations/${id}/toggle`, {}); load(); };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{list.length} integração(ões)</span>
        <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={13} />Nova Integração
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((i: any) => {
          const hc = HEALTH_CONFIG[i.health] ?? HEALTH_CONFIG.UNKNOWN;
          return (
            <div key={i.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${hc.bg}`}>
                <Plug size={18} className={hc.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${hc.bg} ${hc.color}`}>{i.health}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${i.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {i.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">{i.endpoint}</p>
                {i.lastTested && <p className="text-[9px] text-slate-300 mt-0.5">Testado: {new Date(i.lastTested).toLocaleString('pt')}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => testIntegration(i.id)} disabled={testing === i.id}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Testar">
                  {testing === i.id ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                </button>
                <button onClick={() => toggle(i.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Toggle">
                  {i.active ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Plug size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem integrações configuradas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Webhooks Tab ─────────────────────────────────────────────────

function WebhooksTab() {
  const { data: list = [], isLoading: loading, refetch } = useApiQuery<any[]>(
    queryKeys.apiIntegrations.webhooks(), '/api-integrations/webhooks/list', { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => { void refetch(); };

  const confirm = useConfirm();
  const remove = async (id: number) => { if (await confirm({ title: 'Remover webhook?', confirmLabel: 'Remover', destructive: true })) { await apiClient.delete(`/api-integrations/webhooks/${id}`); load(); } };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{list.length} webhook(s)</span>
        <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={13} />Novo Webhook
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((h: any) => (
          <div key={h.id} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${h.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {h.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{h.url}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => remove(h.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(h.events ?? []).map((e: string, i: number) => (
                <span key={i} className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">{e}</span>
              ))}
            </div>

            {/* Stats */}
            {h.stats && (
              <div className="flex gap-3 text-[10px] text-slate-400">
                <span className="text-emerald-600 font-medium">✅ {h.stats.delivered} entregues</span>
                <span className="text-red-500 font-medium">❌ {h.stats.failed} falhas</span>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-12 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem webhooks configurados</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────

function ApiKeysTab() {
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data: keys = [], isLoading: loading, refetch } = useApiQuery<any[]>(
    queryKeys.apiIntegrations.apiKeys(), '/api-integrations/api-keys/list', { staleTime: STALE_TIME.DYNAMIC },
  );
  const load = () => { void refetch(); };

  const create = async () => {
    const name = prompt('Nome da API Key:');
    if (!name) return;
    const r = await apiClient.post<any>('/api-integrations/api-keys', { name, scopes: ['read'] });
    if (r.key) { setNewKey(r.key); load(); }
  };

  const confirm = useConfirm();
  const revoke = async (id: number) => {
    if (await confirm({ title: 'Revogar esta API Key?', confirmLabel: 'Revogar', destructive: true })) { await apiClient.post(`/api-integrations/api-keys/${id}/revoke`, {}); load(); }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* New key alert */}
      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-bold text-emerald-700 mb-1">⚠️ Copia esta chave — não será exibida novamente</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-300">
            <code className="text-xs font-mono text-slate-800 flex-1 break-all">{newKey}</code>
            <button onClick={() => navigator.clipboard.writeText(newKey)} className="shrink-0">
              <Copy size={14} className="text-slate-500" />
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-emerald-700 underline">Confirmar que guardei</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{keys.length} API Key(s)</span>
        <button onClick={create} className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={13} />Nova API Key
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {keys.map((k: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${k.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{k.name}</p>
                <p className="text-[10px] font-mono text-slate-400">{k.preview}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(k.scopes ?? []).map((s: string, j: number) => (
                  <span key={j} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>
                ))}
              </div>
              {k.expiresAt && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  <Clock size={10} className="inline" /> {new Date(k.expiresAt).toLocaleDateString('pt')}
                </span>
              )}
              <div className="flex gap-1 shrink-0">
                <button onClick={async () => { const r = await apiClient.post<any>(`/api-integrations/api-keys/${k.id}/rotate`, {}); if (r.key) setNewKey(r.key); load(); }}
                  className="p-1 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Rotacionar">
                  <RotateCcw size={12} />
                </button>
                <button onClick={() => revoke(k.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="Revogar">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Key size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem API Keys criadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Monitoring Tab ───────────────────────────────────────────────

function MonitoringTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.apiIntegrations.stats(), '/api-integrations/stats', { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;
  const s = data?.summary ?? {};

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Integrações Activas', value: s.activeIntegrations ?? 0, icon: Plug,     color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Chamadas (24h)',       value: s.totalLogs24h ?? 0,       icon: Activity, color: 'text-teal-600',   bg: 'bg-teal-50' },
          { label: 'Taxa de Erro',         value: `${s.errorRate24h ?? 0}%`, icon: AlertTriangle, color: s.errorRate24h > 5 ? 'text-red-600' : 'text-emerald-600', bg: s.errorRate24h > 5 ? 'bg-red-50' : 'bg-emerald-50' },
          { label: 'Latência Média',       value: s.avgLatencyMs ? `${s.avgLatencyMs}ms` : '–', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className={`p-2 rounded-lg ${k.bg} w-fit mb-2`}><k.icon size={16} className={k.color} /></div>
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Integration health grid */}
      {(data?.integrationHealth ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Saúde das Integrações</h4>
          <div className="grid gap-2">
            {(data.integrationHealth as any[]).map((i: any, idx: number) => {
              const hc = HEALTH_CONFIG[i.health] ?? HEALTH_CONFIG.UNKNOWN;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hc.dot}`} />
                  <span className="text-sm text-slate-700 flex-1">{i.name}</span>
                  <span className="text-xs text-slate-400">{i.logs7d} calls/7d</span>
                  <span className={`text-xs font-bold ${i.errorRate > 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {i.errorRate}% err
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${hc.bg} ${hc.color} font-medium`}>{i.health}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400 text-right">Actualizado: {new Date(data?.generatedAt).toLocaleString('pt')}</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'webhooks',     label: 'Webhooks',    icon: Zap },
  { id: 'api-keys',     label: 'API Keys',    icon: Key },
  { id: 'monitoring',   label: 'Monitoramento', icon: BarChart2 },
];

export default function ApiIntegrationsPage() {
  const [tab, setTab] = useState<Tab>('integrations');

  const PANELS: Record<Tab, JSX.Element> = {
    integrations: <IntegrationsTab />,
    webhooks:     <WebhooksTab />,
    'api-keys':   <ApiKeysTab />,
    monitoring:   <MonitoringTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg"><Plug size={18} className="text-indigo-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">API Integrations</h1>
          </div>
          <p className="text-sm text-slate-400">Integrações · Webhooks · API Keys · Monitoramento</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {PANELS[tab]}
      </div>
    </div>
  );
}


















