// src/app/(dashboard)/executive-reports/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType   = 'FLASH' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM' | 'AUDIT';
type ReportStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
type KpiStatus    = 'GREEN' | 'YELLOW' | 'RED';

interface Metric {
  id: number;
  label: string;
  value: number;
  unit: string | null;
  previousValue: number | null;
  target: number | null;
  status: KpiStatus | null;
  comment: string | null;
  sortOrder: number;
}

interface Report {
  id: number;
  title: string;
  subtitle: string | null;
  type: ReportType;
  status: ReportStatus;
  confidentiality: string;
  period: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  achievements: string[];
  risks: string[];
  recommendations: string[];
  nextSteps: string[];
  narrative: string | null;
  filePath: string;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  generatedBy: { id: number; fullName: string; avatarUrl: string | null };
  department: { id: number; name: string } | null;
  metrics: Metric[];
  approvals?: any[];
  _count?: { accessLogs: number };
}

interface ReportStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentReports: Report[];
}

type View = 'list' | 'detail' | 'generate';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<ReportType, { label: string; icon: string; cls: string }> = {
  FLASH:     { label: 'Flash (Semanal)',   icon: '⚡', cls: 'bg-amber-50 text-amber-700' },
  MONTHLY:   { label: 'Mensal',            icon: '📅', cls: 'bg-blue-50 text-blue-700' },
  QUARTERLY: { label: 'Trimestral',        icon: '📊', cls: 'bg-purple-50 text-purple-700' },
  ANNUAL:    { label: 'Anual',             icon: '📈', cls: 'bg-emerald-50 text-emerald-700' },
  CUSTOM:    { label: 'Personalizado',     icon: '✏️', cls: 'bg-gray-100 text-gray-600' },
  AUDIT:     { label: 'Auditoria',         icon: '🔍', cls: 'bg-red-50 text-red-700' },
};

const STATUS_CFG: Record<ReportStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Rascunho',         cls: 'bg-gray-100 text-gray-500' },
  IN_REVIEW: { label: 'Em revisão',       cls: 'bg-amber-50 text-amber-700' },
  APPROVED:  { label: 'Aprovado',         cls: 'bg-blue-50 text-blue-700' },
  PUBLISHED: { label: 'Publicado',        cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED:  { label: 'Arquivado',        cls: 'bg-gray-100 text-gray-400' },
};

const KPI_STATUS: Record<KpiStatus, { color: string; bg: string; icon: string }> = {
  GREEN:  { color: 'text-emerald-700', bg: 'bg-emerald-50',  icon: '🟢' },
  YELLOW: { color: 'text-amber-700',   bg: 'bg-amber-50',    icon: '🟡' },
  RED:    { color: 'text-red-700',     bg: 'bg-red-50',      icon: '🔴' },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ metric }: { metric: Metric }) {
  const statusCfg = metric.status ? KPI_STATUS[metric.status] : null;
  const variation = metric.previousValue && metric.previousValue !== 0
    ? Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100)
    : null;

  return (
    <div className={`rounded-xl p-4 border ${statusCfg ? statusCfg.bg + ' border-transparent' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-xs text-gray-500 leading-tight">{metric.label}</div>
        {statusCfg && <span className="text-sm flex-shrink-0">{statusCfg.icon}</span>}
      </div>
      <div className={`text-2xl font-bold font-mono ${statusCfg?.color ?? 'text-gray-900'}`}>
        {metric.value.toLocaleString('pt-PT')}
        {metric.unit && <span className="text-base ml-1 font-normal text-gray-400">{metric.unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-1">
        {variation !== null && (
          <span className={`text-xs font-medium ${variation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {variation >= 0 ? '↑' : '↓'} {Math.abs(variation)}% vs anterior
          </span>
        )}
        {metric.target && (
          <span className="text-xs text-gray-400">Target: {metric.target}{metric.unit}</span>
        )}
      </div>
      {metric.comment && <p className="text-xs text-gray-500 mt-1 italic">{metric.comment}</p>}
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ report, onClick }: { report: Report; onClick: () => void }) {
  const typeCfg   = TYPE_CFG[report.type];
  const statusCfg = STATUS_CFG[report.status];
  const redCount  = report.metrics.filter(m => m.status === 'RED').length;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>
              {typeCfg.icon} {typeCfg.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
            {report.confidentiality === 'CONFIDENTIAL' && (
              <span className="text-xs text-gray-400">🔒 Confidencial</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-900 line-clamp-1">{report.title}</div>
          {report.period && <div className="text-xs text-gray-400 mt-0.5">📅 {report.period}</div>}
        </div>
      </div>

      {/* Mini KPI overview */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span>📊 {report.metrics.length} KPIs</span>
        {redCount > 0 && <span className="text-red-600 font-medium">🔴 {redCount} em risco</span>}
        {report.risks.length > 0 && <span>⚠ {report.risks.length} risco(s)</span>}
        {report._count && <span>👁 {report._count.accessLogs} acessos</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Avatar name={report.generatedBy.fullName} avatarUrl={report.generatedBy.avatarUrl} size="sm" />
          <span>{report.generatedBy.fullName}</span>
        </div>
        <span>{fmtDate(report.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── View: List ───────────────────────────────────────────────────────────────

function ListView({ onSelect, onGenerate }: { onSelect: (id: number) => void; onGenerate: () => void }) {
  const [data, setData]     = useState<{ data: Report[]; total: number } | null>(null);
  const [stats, setStats]   = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter   ? { type:   typeFilter   } : {}),
      });
      const [reports, s] = await Promise.all([
        apiFetch<any>(`/executive-reports?${params}`),
        apiFetch<ReportStats>('/executive-reports/stats'),
      ]);
      setData(reports);
      setStats(s);
    } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',      value: stats.total },
            { label: 'Publicados', value: stats.byStatus['PUBLISHED'] ?? 0, color: 'text-emerald-600' },
            { label: 'Em revisão', value: stats.byStatus['IN_REVIEW'] ?? 0, color: 'text-amber-600' },
            { label: 'Rascunhos',  value: stats.byStatus['DRAFT']     ?? 0 },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{data?.total ?? 0} relatórios</span>
      </div>

      {/* Grid */}
      {loading ? <Skeleton rows={3} /> : (
        <div className="grid grid-cols-2 gap-4">
          {data?.data.map(r => (
            <ReportCard key={r.id} report={r} onClick={() => onSelect(r.id)} />
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <div className="text-4xl mb-3">📊</div>
              Sem relatórios criados ainda
              <div className="mt-3">
                <button onClick={onGenerate}
                  className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800">
                  Gerar primeiro relatório
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Detail ─────────────────────────────────────────────────────────────

function DetailView({ reportId, onBack }: { reportId: number; onBack: () => void }) {
  const [report, setReport]   = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab]   = useState<'kpis' | 'narrative' | 'actions'>('kpis');

  useEffect(() => {
    apiFetch<Report>(`/executive-reports/${reportId}`)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleWorkflow = async (action: string) => {
    setSubmitting(true);
    try {
      if (action === 'submit') {
        await apiFetch(`/executive-reports/${reportId}/submit`, { method: 'PATCH', body: '{}' });
      } else if (action === 'publish') {
        await apiFetch(`/executive-reports/${reportId}/publish`, { method: 'PATCH', body: '{}' });
      }
      const r = await apiFetch<Report>(`/executive-reports/${reportId}`);
      setReport(r);
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading || !report) return <Skeleton rows={6} />;

  const typeCfg   = TYPE_CFG[report.type];
  const statusCfg = STATUS_CFG[report.status];
  const greenKpis = report.metrics.filter(m => m.status === 'GREEN').length;
  const yellowKpis= report.metrics.filter(m => m.status === 'YELLOW').length;
  const redKpis   = report.metrics.filter(m => m.status === 'RED').length;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>
                {typeCfg.icon} {typeCfg.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span className="text-xs text-gray-400">🔒 {report.confidentiality}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
            {report.subtitle && <p className="text-sm text-gray-500 mt-0.5">{report.subtitle}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              {report.period && <span>📅 {report.period}</span>}
              {report.publishedAt && <span>Publicado: {fmtDate(report.publishedAt)}</span>}
              <span className="flex items-center gap-1">
                <Avatar name={report.generatedBy.fullName} size="sm" />
                {report.generatedBy.fullName}
              </span>
            </div>
          </div>

          {/* Workflow buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {report.status === 'DRAFT' && (
              <button onClick={() => handleWorkflow('submit')} disabled={submitting}
                className="px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
                Submeter para revisão →
              </button>
            )}
            {report.status === 'APPROVED' && (
              <button onClick={() => handleWorkflow('publish')} disabled={submitting}
                className="px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Publicar ✓
              </button>
            )}
          </div>
        </div>

        {/* Semáforo overview */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 font-medium">Estado dos KPIs:</div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700">🟢 {greenKpis} no target</span>
            <span className="flex items-center gap-1 text-amber-700">🟡 {yellowKpis} atenção</span>
            <span className="flex items-center gap-1 text-red-700">🔴 {redKpis} crítico</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['kpis', 'narrative', 'actions'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ kpis: '📊 KPIs', narrative: '📝 Narrativa', actions: '🎯 Plano de Acção' }[t]}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-3 gap-3">
          {report.metrics.map(m => <KpiCard key={m.id} metric={m} />)}
        </div>
      )}

      {/* Narrative */}
      {activeTab === 'narrative' && (
        <div className="space-y-4">
          {report.narrative && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Narrativa Executiva</div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report.narrative}</p>
            </div>
          )}

          {/* Conquistas, Riscos, Recomendações */}
          {[
            { label: '🏆 Conquistas do período', items: report.achievements, cls: 'bg-emerald-50 border-emerald-200' },
            { label: '⚠️ Riscos identificados',   items: report.risks,        cls: 'bg-red-50 border-red-200' },
            { label: '💡 Recomendações',           items: report.recommendations, cls: 'bg-blue-50 border-blue-200' },
          ].map(({ label, items, cls }) => items.length > 0 && (
            <div key={label} className={`border rounded-xl p-5 ${cls}`}>
              <div className="text-xs font-semibold text-gray-700 mb-3">{label}</div>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 mt-0.5 text-gray-400">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {report.nextSteps.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Próximos Passos</div>
              <div className="space-y-2">
                {report.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem próximos passos definidos
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Generate ───────────────────────────────────────────────────────────

function GenerateView({ onSuccess }: { onSuccess: (id: number) => void }) {
  const [type, setType]         = useState<ReportType>('MONTHLY');
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates]   = useState<any[]>([]);

  useEffect(() => {
    apiFetch<any[]>('/executive-reports/templates').then(setTemplates).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const report = await apiFetch<Report>(`/executive-reports/auto-generate?type=${type}`, {
        method: 'POST',
        body:   '{}',
      });
      onSuccess(report.id);
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="text-base font-semibold text-gray-900 mb-4">Geração automática de relatório</div>
        <p className="text-sm text-gray-500 mb-5">
          O sistema irá consolidar automaticamente todos os KPIs da plataforma e gerar um relatório executivo com narrativa incluída.
        </p>

        {/* Tipo de relatório */}
        <div className="mb-5">
          <div className="text-xs font-medium text-gray-700 mb-2">Tipo de relatório</div>
          <div className="grid grid-cols-3 gap-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.type)}
                className={`p-3 border rounded-xl text-left transition-all ${
                  type === t.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{TYPE_CFG[t.type as ReportType]?.icon}</div>
                <div className="text-xs font-semibold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Secções incluídas */}
        {templates.find(t => t.type === type) && (
          <div className="mb-5 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-2">Secções incluídas neste relatório:</div>
            <div className="flex flex-wrap gap-1.5">
              {templates.find(t => t.type === type)?.sections.map((s: string) => (
                <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {s.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-60"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              A gerar relatório…
            </span>
          ) : `⚡ Gerar ${TYPE_CFG[type]?.label} automaticamente`}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          O relatório incluirá narrativa executiva gerada automaticamente com base nos dados actuais da plataforma.
        </p>
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const TITLES: Record<View, string> = {
  list:     'Relatórios Executivos',
  detail:   'Detalhe do Relatório',
  generate: 'Gerar Relatório',
};

export default function ExecutiveReportsPage() {
  const [view, setView]         = useState<View>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect   = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack     = ()           => { setSelectedId(null); setView('list'); };
  const handleGenerated= (id: number) => { setSelectedId(id);  setView('detail'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Inteligência Executiva</p>
        </div>
        {view === 'list' && (
          <div className="flex gap-2">
            <button onClick={() => setView('generate')}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800">
              ⚡ Gerar automático
            </button>
          </div>
        )}
        {view !== 'list' && (
          <button onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
            ← Voltar
          </button>
        )}
      </div>

      {view === 'list'     && <ListView onSelect={handleSelect} onGenerate={() => setView('generate')} />}
      {view === 'detail' && selectedId !== null && <DetailView reportId={selectedId} onBack={handleBack} />}
      {view === 'generate' && <GenerateView onSuccess={handleGenerated} />}
    </div>
  );
}