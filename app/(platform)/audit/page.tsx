// src/app/(dashboard)/audit/page.tsx
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Status   = 'SUCCESS' | 'FAILED' | 'DENIED';

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  entityName: string | null;
  before: string | null;
  after: string | null;
  changes: string | null;
  status: Status;
  severity: Severity;
  ip: string | null;
  userAgent: string | null;
  reason: string | null;
  hash: string | null;
  timestamp: string;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null } | null;
}

interface AuditStats {
  totals: { total: number; today: number; critical: number; failedLoginsToday: number };
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  bySeverity: Record<string, number>;
  byStatus:   Record<string, number>;
  recentCritical: AuditLog[];
}

interface Anomalies {
  suspiciousLogins: Array<{ userId: number; count: number }>;
  massExports:      Array<{ userId: number; count: number }>;
  massDeletes:      Array<{ userId: number; count: number }>;
  totalAlerts: number;
}

interface Timeline {
  entity: string; entityId: number;
  events: Array<{
    id: number; action: string; severity: string; status: string;
    user: any; timestamp: string; changes: any; reason: string | null; ip: string | null;
  }>;
}

type View = 'logs' | 'stats' | 'anomalies' | 'timeline';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(d: string): string {
  return new Date(d).toLocaleString('pt-AO', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit',
  });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return avatarUrl ? (
    <Image src={avatarUrl} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials(name)}
    </div>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<Severity, { cls: string; dot: string }> = {
  LOW:      { cls: 'text-gray-400',  dot: 'bg-gray-300' },
  MEDIUM:   { cls: 'text-blue-600',  dot: 'bg-blue-400' },
  HIGH:     { cls: 'text-amber-600', dot: 'bg-amber-400' },
  CRITICAL: { cls: 'text-red-600',   dot: 'bg-red-500' },
};

const STATUS_CFG: Record<Status, { label: string; cls: string }> = {
  SUCCESS: { label: 'Sucesso',  cls: 'bg-emerald-50 text-emerald-700' },
  FAILED:  { label: 'Falhou',   cls: 'bg-red-50 text-red-700' },
  DENIED:  { label: 'Negado',   cls: 'bg-amber-50 text-amber-700' },
};

const ACTION_ICONS: Record<string, string> = {
  CREATE:  '➕', UPDATE: '✏️', DELETE: '🗑️',
  LOGIN:   '🔑', LOGOUT:'🚪', FAILED:'🚫',
  EXPORT:  '📥', SEND:  '📤', READ:  '👁',
  APPROVE: '✅', REJECT:'❌', DENIED:'🔒',
};

// ─── Diff viewer ──────────────────────────────────────────────────────────────

function DiffViewer({ changes }: { changes: Record<string, { from: any; to: any }> }) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs font-mono">
      {Object.entries(changes).map(([key, { from, to }]) => (
        <div key={key} className="border-b border-gray-100 last:border-0">
          <div className="px-3 py-1 bg-gray-50 text-gray-600 font-semibold">{key}</div>
          <div className="px-3 py-1 bg-red-50 text-red-700">− {JSON.stringify(from)}</div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700">+ {JSON.stringify(to)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const sevCfg    = SEVERITY_CFG[log.severity] ?? SEVERITY_CFG.LOW;
  const statusCfg = STATUS_CFG[log.status]     ?? STATUS_CFG.SUCCESS;
  const actionIcon= ACTION_ICONS[log.action]   ?? '📋';
  const changes   = log.changes ? JSON.parse(log.changes) : null;

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        className={`cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${expanded ? 'bg-blue-50' : ''}`}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sevCfg.dot}`} />
            <span className="text-xs font-mono text-gray-400">{log.id}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtTs(log.timestamp)}</td>
        <td className="px-3 py-2.5">
          {log.user ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={log.user.fullName} avatarUrl={log.user.avatarUrl} />
              <span className="text-xs text-gray-700">{log.user.fullName}</span>
            </div>
          ) : <span className="text-xs text-gray-300 italic">Sistema</span>}
        </td>
        <td className="px-3 py-2.5">
          <span className="text-xs font-medium">{actionIcon} {log.action}</span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">{log.entity} {log.entityId ? `#${log.entityId}` : ''}</td>
        <td className="px-3 py-2.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-400 font-mono">{log.ip ?? '—'}</td>
        <td className="px-3 py-2.5">
          <span className={`text-xs font-medium ${sevCfg.cls}`}>{log.severity}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                {log.reason && (
                  <div className="mb-2"><span className="font-medium text-gray-600">Motivo:</span> {log.reason}</div>
                )}
                {log.ip && (
                  <div className="mb-1"><span className="font-medium text-gray-600">IP:</span> {log.ip}</div>
                )}
                {log.userAgent && (
                  <div className="mb-1 truncate text-gray-400"><span className="font-medium text-gray-600">UA:</span> {log.userAgent}</div>
                )}
                {log.hash && (
                  <div className="mt-2 text-gray-300 font-mono text-xs truncate">Hash: {log.hash.slice(0, 32)}…</div>
                )}
              </div>
              <div>
                {changes && <DiffViewer changes={changes} />}
                {!changes && log.after && (
                  <pre className="text-xs bg-white rounded p-2 max-h-32 overflow-auto">{JSON.stringify(JSON.parse(log.after), null, 2)}</pre>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── View: Logs ───────────────────────────────────────────────────────────────

function LogsView() {
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState({ action: '', severity: '', status: '', entity: '', criticalOnly: false });
  const params = {
    page, limit: 50,
    action: filters.action, severity: filters.severity, status: filters.status,
    entity: filters.entity, criticalOnly: filters.criticalOnly ? 'true' : undefined,
  };

  const { data, isLoading: loading } = useApiQuery<{ data: AuditLog[]; total: number; totalPages: number }>(
    queryKeys.audit.list(params), '/audit',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" placeholder="Entidade (ex: User, PDI)"
          value={filters.entity} onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
        <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as acções</option>
          {['CREATE','UPDATE','DELETE','LOGIN','FAILED','EXPORT','APPROVE','REJECT','DENIED'].map(a => (
            <option key={a} value={a}>{ACTION_ICONS[a]} {a}</option>
          ))}
        </select>
        <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Severidade</option>
          {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Estado</option>
          {['SUCCESS','FAILED','DENIED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={filters.criticalOnly}
            onChange={e => setFilters(f => ({ ...f, criticalOnly: e.target.checked }))}
            className="rounded" />
          Só críticos
        </label>
        <span className="ml-auto text-xs text-gray-400 self-center">{data?.total ?? 0} registos</span>
      </div>

      {loading ? <Skeleton rows={10} /> : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['#', 'Timestamp', 'Utilizador', 'Acção', 'Entidade', 'Estado', 'IP', 'Severidade'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map(log => <LogRow key={log.id} log={log} />)}
                {data?.data.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">Sem logs encontrados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <span className="self-center text-xs text-gray-400">Pág. {page} / {data?.totalPages}</span>
              <button disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Seguinte →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── View: Stats ──────────────────────────────────────────────────────────────

function StatsView() {
  const { data, isLoading: loading } = useApiQuery<AuditStats>(
    queryKeys.audit.stats(), '/audit/stats', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de eventos', value: data.totals.total },
          { label: 'Hoje',             value: data.totals.today },
          { label: 'Críticos',         value: data.totals.critical,          color: data.totals.critical > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Logins falhados hoje', value: data.totals.failedLoginsToday, color: data.totals.failedLoginsToday > 0 ? 'text-amber-600' : 'text-gray-900' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Por acção */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por acção</div>
          {data.byAction.map(a => (
            <div key={a.action} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <span>{ACTION_ICONS[a.action] ?? '📋'}</span>
              <span className="text-xs text-gray-700 flex-1">{a.action}</span>
              <span className="text-xs font-mono font-bold text-gray-900">{a.count}</span>
            </div>
          ))}
        </div>

        {/* Por entidade */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por entidade</div>
          {data.byEntity.map(e => (
            <div key={e.entity} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-700 flex-1">{e.entity}</span>
              <span className="text-xs font-mono font-bold text-gray-900">{e.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos críticos recentes */}
      {data.recentCritical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-100 text-xs font-semibold text-red-700">
            🔴 Eventos críticos recentes
          </div>
          {data.recentCritical.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-red-100 last:border-0">
              <span className="text-sm">{ACTION_ICONS[log.action] ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-800">{log.action}</span>
                <span className="text-xs text-gray-500"> em {log.entity}</span>
                {(log as any).user && <span className="text-xs text-gray-400"> por {(log as any).user.fullName}</span>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{fmtTs(log.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Anomalies ──────────────────────────────────────────────────────────

function AnomaliesView() {
  const dataQ = useApiQuery<Anomalies>(queryKeys.audit.anomalies(), '/audit/anomalies', { staleTime: STALE_TIME.DYNAMIC });
  const integrityQ = useApiQuery<any>(
    queryKeys.audit.integrity(), '/audit/integrity/verify',
    { params: { limit: 200 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = dataQ.data ?? null;
  const integrity = integrityQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className={`flex items-center gap-3 p-4 border rounded-xl ${data.totalAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <span className="text-3xl">{data.totalAlerts > 0 ? '🚨' : '✅'}</span>
        <div>
          <div className={`text-sm font-semibold ${data.totalAlerts > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {data.totalAlerts > 0 ? `${data.totalAlerts} anomalia(s) detectada(s)` : 'Nenhuma anomalia detectada'}
          </div>
          <div className="text-xs text-gray-500">Última verificação: agora mesmo</div>
        </div>
      </div>

      {/* Integridade */}
      {integrity && (
        <div className={`flex items-center gap-3 p-4 border rounded-xl ${integrity.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <span className="text-2xl">{integrity.valid ? '🔒' : '⚠️'}</span>
          <div>
            <div className={`text-sm font-semibold ${integrity.valid ? 'text-emerald-700' : 'text-red-700'}`}>
              {integrity.valid ? `Hash chain íntegra (${integrity.checked} registos verificados)` : `⚠️ ${integrity.broken.length} registo(s) com hash inválida`}
            </div>
            {!integrity.valid && (
              <div className="text-xs text-red-600 mt-0.5">IDs afectados: {integrity.broken.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* Anomalias por tipo */}
      {[
        { label: '🔑 Logins suspeitos (>3 falhas/hora)',   items: data.suspiciousLogins, color: 'text-red-700' },
        { label: '📥 Exportações em massa (>3/hora)',       items: data.massExports,      color: 'text-amber-700' },
        { label: '🗑️ Deleções em massa (>5/dia)',           items: data.massDeletes,      color: 'text-red-700' },
      ].map(({ label, items, color }) => (
        <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className={`text-sm font-semibold mb-3 ${color}`}>{label}</div>
          {items.length === 0 ? (
            <div className="text-xs text-gray-400">Nenhuma anomalia deste tipo</div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-700">User ID: {item.userId}</span>
                  <span className={`text-xs font-bold font-mono ${color}`}>{item.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── View: Timeline ───────────────────────────────────────────────────────────

function TimelineView() {
  const [entity, setEntity]     = useState('');
  const [entityId, setEntityId] = useState('');
  const [data, setData]         = useState<Timeline | null>(null);
  const [loading, setLoading]   = useState(false);

  const load = async () => {
    if (!entity.trim() || !entityId.trim()) return;
    setLoading(true);
    try {
      setData(await apiClient.get<Timeline>(`/audit/timeline/${entity}/${entityId}`));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <input type="text" placeholder="Entidade (ex: PDI, User, Course)"
          value={entity} onChange={e => setEntity(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="ID"
          value={entityId} onChange={e => setEntityId(e.target.value)}
          className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={load} disabled={loading || !entity || !entityId}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50">
          {loading ? '…' : 'Ver timeline'}
        </button>
      </div>

      {data && (
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-4">
            Timeline: {data.entity} #{data.entityId} — {data.events.length} eventos
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3 pl-10">
              {data.events.map(e => {
                const sevCfg = SEVERITY_CFG[e.severity as Severity] ?? SEVERITY_CFG.LOW;
                return (
                  <div key={e.id} className="relative">
                    <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-white ${sevCfg.dot}`} />
                    <div className={`bg-white border rounded-xl p-3 ${e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'border-red-200' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{ACTION_ICONS[e.action] ?? '📋'}</span>
                          <span className="text-sm font-medium text-gray-900">{e.action}</span>
                          <span className={`text-xs font-medium ${sevCfg.cls}`}>{e.severity}</span>
                        </div>
                        <span className="text-xs text-gray-400">{fmtTs(e.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {e.user && <span>por {e.user.fullName}</span>}
                        {e.ip   && <span>· IP: {e.ip}</span>}
                        {e.reason && <span>· &quot;{e.reason}&quot;</span>}
                      </div>
                      {e.changes && <DiffViewer changes={e.changes} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Introduz uma entidade e ID para ver a timeline completa
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'logs',      label: '📋 Logs' },
  { id: 'stats',     label: '📊 Estatísticas' },
  { id: 'anomalies', label: '🚨 Anomalias' },
  { id: 'timeline',  label: '⏱ Timeline' },
];

const TITLES: Record<View, string> = {
  logs:      'Audit Logs',
  stats:     'Estatísticas de Auditoria',
  anomalies: 'Detecção de Anomalias',
  timeline:  'Timeline por Recurso',
};

export default function AuditPage() {
  const [view, setView] = useState<View>('logs');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Rastreabilidade e Compliance</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {view === 'logs'      && <LogsView />}
      {view === 'stats'     && <StatsView />}
      {view === 'anomalies' && <AnomaliesView />}
      {view === 'timeline'  && <TimelineView />}
    </div>
  );
}