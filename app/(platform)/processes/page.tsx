'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { useConfirm } from '../../../providers/ConfirmProvider';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import { useDebounce } from '../../../hooks/useDebounce';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'ARCHIVED';
type RiskLevel     = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type StepType      = 'START' | 'END' | 'TASK' | 'DECISION' | 'GATEWAY' | 'REVIEW';
type InstanceStatus= 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
type TaskStatus    = 'WAITING' | 'PENDING' | 'COMPLETED' | 'REJECTED' | 'ESCALATED' | 'SKIPPED';

interface ProcessStep {
  id: number;
  type: StepType;
  title: string;
  description: string | null;
  order: number;
  responsibleRole: string | null;
  slaHours: number | null;
  estimatedMinutes: number | null;
  requiresUpload: boolean;
  checklist: string[];
  responsible: { id: number; fullName: string } | null;
}

interface Process {
  id: number;
  code: string;
  title: string;
  description: string | null;
  objective: string | null;
  scope: string | null;
  version: string;
  status: ProcessStatus;
  riskLevel: RiskLevel;
  category: string | null;
  tags: string[];
  defaultSlaHours: number | null;
  estimatedMinutes: number | null;
  nextReviewDate: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: number; fullName: string };
  department: { id: number; name: string } | null;
  steps: ProcessStep[];
  _count: { instances: number };
}

interface StepProgress {
  id: number;
  stepId: number;
  stepOrder: number;
  status: TaskStatus;
  notes: string | null;
  completedAt: string | null;
  slaDeadline: string | null;
  duration: number | null;
  step: ProcessStep;
  completedBy: { id: number; fullName: string } | null;
}

interface ProcessInstance {
  id: number;
  processId: number;
  processVersion: string;
  status: InstanceStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  slaDeadline: string | null;
  process: { id: number; title: string; code: string; riskLevel: RiskLevel };
  initiatedBy: { id: number; fullName: string };
  targetUser: { id: number; fullName: string };
  stepProgress: StepProgress[];
  _count?: { stepProgress: number };
}

interface PaginatedProcesses {
  data: Process[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Dashboard {
  processes: { active: number; draft: number; inReview: number };
  instances: { inProgress: number; completed: number };
  compliance: { overdueSteps: number; slaComplianceRate: number | null };
  recentInstances: ProcessInstance[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

// ─── Badge components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProcessStatus }) {
  const cfg: Record<ProcessStatus, { label: string; cls: string }> = {
    DRAFT:     { label: 'Rascunho',  cls: 'bg-gray-100 text-gray-600' },
    IN_REVIEW: { label: 'Em revisão',cls: 'bg-amber-50 text-amber-700' },
    ACTIVE:    { label: 'Activo',    cls: 'bg-emerald-50 text-emerald-700' },
    ARCHIVED:  { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg: Record<RiskLevel, { label: string; cls: string }> = {
    LOW:      { label: 'Baixo',    cls: 'bg-emerald-50 text-emerald-700' },
    MEDIUM:   { label: 'Médio',    cls: 'bg-amber-50 text-amber-700' },
    HIGH:     { label: 'Alto',     cls: 'bg-orange-50 text-orange-700' },
    CRITICAL: { label: 'Crítico',  cls: 'bg-red-50 text-red-700' },
  };
  const { label, cls } = cfg[level];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  const cfg: Record<InstanceStatus, { label: string; cls: string }> = {
    IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
    COMPLETED:   { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-700' },
    CANCELLED:   { label: 'Cancelado',    cls: 'bg-gray-100 text-gray-500' },
    ON_HOLD:     { label: 'Suspenso',     cls: 'bg-amber-50 text-amber-700' },
  };
  const { label, cls } = cfg[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function StepTypeBadge({ type }: { type: StepType }) {
  const cfg: Record<StepType, { label: string; cls: string }> = {
    START:    { label: 'Início',   cls: 'bg-emerald-100 text-emerald-800' },
    END:      { label: 'Fim',      cls: 'bg-gray-100 text-gray-600' },
    TASK:     { label: 'Tarefa',   cls: 'bg-blue-50 text-blue-700' },
    DECISION: { label: 'Decisão',  cls: 'bg-purple-50 text-purple-700' },
    GATEWAY:  { label: 'Gateway',  cls: 'bg-amber-50 text-amber-700' },
    REVIEW:   { label: 'Revisão',  cls: 'bg-orange-50 text-orange-700' },
  };
  const { label, cls } = cfg[type];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// ─── View: Library (lista de processos) ──────────────────────────────────────

function LibraryView({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page, limit: 15,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(risk   ? { riskLevel: risk } : {}),
  };
  const { data, isLoading: loading, error } = useApiQuery<PaginatedProcesses>(
    queryKeys.processes.library(params), '/processes',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, código, tag…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="DRAFT">Rascunho</option>
          <option value="IN_REVIEW">Em revisão</option>
          <option value="ACTIVE">Activo</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <select
          value={risk}
          onChange={e => { setRisk(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os riscos</option>
          <option value="LOW">Baixo</option>
          <option value="MEDIUM">Médio</option>
          <option value="HIGH">Alto</option>
          <option value="CRITICAL">Crítico</option>
        </select>
        <span className="text-sm text-gray-400">{data?.total ?? 0} processos</span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_100px_120px_90px_100px_90px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Processo</div>
          <div>Versão</div>
          <div>Departamento</div>
          <div>Risco</div>
          <div>Estado</div>
          <div>Instâncias</div>
        </div>

        {loading && <div className="p-4"><Skeleton /></div>}
        {error && <div className="px-4 py-8 text-center text-sm text-red-500">{error.message}</div>}

        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Nenhum processo encontrado</div>
        )}

        {!loading && data?.data.map(p => (
          <div
            key={p.id}
            className="grid grid-cols-[2fr_100px_120px_90px_100px_90px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
            onClick={() => onSelect(p.id)}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{p.title}</span>
                {p.tags.slice(0, 2).map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 font-mono">{p.code}</div>
            </div>
            <div className="text-xs font-mono text-gray-500">v{p.version}</div>
            <div className="text-xs text-gray-500">{p.department?.name ?? '—'}</div>
            <div><RiskBadge level={p.riskLevel} /></div>
            <div><StatusBadge status={p.status} /></div>
            <div className="text-sm text-gray-500">{p._count.instances}</div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">Página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Process Viewer ─────────────────────────────────────────────────────

function ProcessViewer({
  processId,
  onBack,
  onStartInstance,
}: {
  processId: number;
  onBack: () => void;
  onStartInstance: (instanceId: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'flow' | 'info' | 'history'>('flow');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: process, isLoading: loading, error, refetch } = useApiQuery<Process>(
    queryKeys.processes.detail(processId), `/processes/${processId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const handleSubmitReview = async () => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/processes/${processId}/submit-review`, {});
      await refetch();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    const comment = action === 'reject' ? prompt('Motivo da rejeição:') : undefined;
    if (action === 'reject' && !comment) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/processes/${processId}/approval`, { action, comment });
      await refetch();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInstance = async () => {
    const targetUserIdStr = prompt('ID do colaborador alvo:');
    if (!targetUserIdStr) return;
    setActionLoading(true);
    try {
      const inst = await apiClient.post<ProcessInstance>(`/processes/${processId}/start`, { targetUserId: parseInt(targetUserIdStr) });
      onStartInstance(inst.id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirm = useConfirm();
  const handleNewVersion = async () => {
    if (!(await confirm({ title: 'Criar nova versão?', message: 'O processo voltará a DRAFT.', confirmLabel: 'Criar versão' }))) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/processes/${processId}/new-version`, {});
      await refetch();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-4"><Skeleton rows={6} /></div>;
  if (error || !process) return (
    <div className="py-12 text-center">
      <p className="text-sm text-red-500 mb-4">{error?.message ?? 'Processo não encontrado'}</p>
      <button onClick={onBack} className="text-sm text-blue-600 underline">← Voltar</button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar à biblioteca
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-mono text-sm text-gray-400">{process.code}</span>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">v{process.version}</span>
              <StatusBadge status={process.status} />
              <RiskBadge level={process.riskLevel} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{process.title}</h2>
            {process.description && (
              <p className="text-sm text-gray-500 mt-1">{process.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
              <span>Responsável: <strong className="text-gray-700">{process.owner.fullName}</strong></span>
              {process.department && <span>Depto: <strong className="text-gray-700">{process.department.name}</strong></span>}
              {process.estimatedMinutes && <span>Duração est.: <strong className="text-gray-700">{fmtDuration(process.estimatedMinutes)}</strong></span>}
              {process.defaultSlaHours && <span>SLA: <strong className="text-gray-700">{process.defaultSlaHours}h</strong></span>}
              <span>Instâncias: <strong className="text-gray-700">{process._count.instances}</strong></span>
            </div>
            {process.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {process.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            {process.status === 'ACTIVE' && (
              <button
                onClick={handleStartInstance}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                ▶ Iniciar instância
              </button>
            )}
            {process.status === 'DRAFT' && (
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? 'A submeter…' : '→ Submeter para revisão'}
              </button>
            )}
            {process.status === 'IN_REVIEW' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval('approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  ✓ Aprovar
                </button>
                <button
                  onClick={() => handleApproval('reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  ✗ Rejeitar
                </button>
              </div>
            )}
            {process.status === 'ACTIVE' && (
              <button
                onClick={handleNewVersion}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                + Nova versão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['flow', 'info', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ flow: 'Fluxo', info: 'Detalhes', history: 'Versões' }[tab]}
          </button>
        ))}
      </div>

      {/* Flow tab */}
      {activeTab === 'flow' && (
        <div className="space-y-2">
          {process.steps.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem etapas definidas. Edite o processo para adicionar etapas.
            </div>
          )}
          {process.steps.map((step, idx) => (
            <div key={step.id} className="flex gap-3 items-start">
              {/* Connector */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                  step.type === 'START' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' :
                  step.type === 'END'   ? 'bg-gray-100 border-gray-400 text-gray-600' :
                  'bg-blue-50 border-blue-300 text-blue-700'
                }`}>
                  {idx + 1}
                </div>
                {idx < process.steps.length - 1 && (
                  <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                )}
              </div>

              {/* Step card */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StepTypeBadge type={step.type} />
                      <span className="text-sm font-medium text-gray-900">{step.title}</span>
                    </div>
                    {step.description && (
                      <p className="text-xs text-gray-500 mb-2">{step.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {step.responsible && (
                        <span>Responsável: <strong className="text-gray-700">{step.responsible.fullName}</strong></span>
                      )}
                      {step.responsibleRole && (
                        <span>Role: <strong className="text-gray-700">{step.responsibleRole}</strong></span>
                      )}
                      {step.slaHours && <span>SLA: <strong className="text-gray-700">{step.slaHours}h</strong></span>}
                      {step.estimatedMinutes && <span>Tempo est.: <strong className="text-gray-700">{fmtDuration(step.estimatedMinutes)}</strong></span>}
                    </div>
                    {step.checklist.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {step.checklist.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-3.5 h-3.5 border border-gray-300 rounded flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {step.requiresUpload && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded flex-shrink-0">
                      📎 Upload obrigatório
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Objetivo e âmbito</div>
            {process.objective && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Objetivo</div>
                <p className="text-sm text-gray-700">{process.objective}</p>
              </div>
            )}
            {process.scope && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Âmbito</div>
                <p className="text-sm text-gray-700">{process.scope}</p>
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Datas e SLA</div>
            {[
              ['Criado em', fmtDate(process.createdAt)],
              ['Actualizado', fmtDate(process.updatedAt)],
              ['Publicado', fmtDate(process.publishedAt)],
              ['Próxima revisão', fmtDate(process.nextReviewDate)],
              ['SLA padrão', process.defaultSlaHours ? `${process.defaultSlaHours}h` : '—'],
              ['Duração estimada', fmtDuration(process.estimatedMinutes)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Histórico de versões
          </div>
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Versão actual: <strong>v{process.version}</strong>
            <br />
            <span className="text-xs mt-1 block">Versões anteriores guardadas no servidor. Use a API para comparar.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Task Runner (Executor) ─────────────────────────────────────────────

function TaskRunner({ instanceId, onBack }: { instanceId: number; onBack: () => void }) {
  const [activeStep, setActiveStep] = useState<StepProgress | null>(null);
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const { data: instance, isLoading: loading, error, refetch } = useApiQuery<ProcessInstance>(
    queryKeys.processes.instance(instanceId), `/processes/instances/${instanceId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  // Auto-selecciona a próxima etapa pendente sempre que a instância é (re)carregada.
  useEffect(() => {
    if (instance) {
      const nextPending = instance.stepProgress.find(sp => sp.status === 'PENDING');
      if (nextPending) setActiveStep(nextPending);
    }
  }, [instance]);

  const completeStep = async () => {
    if (!activeStep) return;
    setCompleting(true);
    try {
      await apiClient.post(`/processes/instances/${instanceId}/steps/${activeStep.stepId}/complete`, { notes });
      setNotes('');
      await refetch();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const rejectStep = async () => {
    if (!activeStep) return;
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    try {
      await apiClient.post(`/processes/instances/${instanceId}/steps/${activeStep.stepId}/reject`, { reason });
      await refetch();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="p-4"><Skeleton rows={4} /></div>;
  if (error || !instance) return (
    <div className="py-12 text-center">
      <p className="text-sm text-red-500 mb-4">{error?.message ?? 'Instância não encontrada'}</p>
      <button onClick={onBack} className="text-sm text-blue-600 underline">← Voltar</button>
    </div>
  );

  const completedCount = instance.stepProgress.filter(s => s.status === 'COMPLETED').length;
  const totalCount     = instance.stepProgress.length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar
      </button>

      {/* Instance header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-400">{instance.process.code}</span>
              <InstanceStatusBadge status={instance.status} />
              <RiskBadge level={instance.process.riskLevel} />
            </div>
            <div className="text-base font-semibold text-gray-900">{instance.process.title}</div>
            <div className="text-xs text-gray-400 mt-1">
              Colaborador: <strong>{instance.targetUser.fullName}</strong>
              &nbsp;·&nbsp; Iniciado por: <strong>{instance.initiatedBy.fullName}</strong>
              &nbsp;·&nbsp; {fmtDate(instance.startedAt)}
            </div>
          </div>
          {instance.slaDeadline && (
            <div className={`text-xs px-3 py-1 rounded-lg font-medium ${isOverdue(instance.slaDeadline) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
              {isOverdue(instance.slaDeadline) ? '⚠ SLA expirado' : `SLA: ${fmtDate(instance.slaDeadline)}`}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500">{completedCount}/{totalCount} etapas</span>
          <span className="text-xs font-medium text-gray-700">{progressPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Etapas
          </div>
          {instance.stepProgress.map((sp, idx) => {
            const isActive = activeStep?.id === sp.id;
            const isDone   = sp.status === 'COMPLETED';
            const isRejected = sp.status === 'REJECTED';

            return (
              <div
                key={sp.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => { if (!isDone) setActiveStep(sp); }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isDone     ? 'bg-emerald-100 text-emerald-700' :
                  isRejected ? 'bg-red-100 text-red-700' :
                  isActive   ? 'bg-blue-600 text-white' :
                               'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? '✓' : isRejected ? '✗' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                    {sp.step.title}
                  </div>
                  {sp.completedAt && (
                    <div className="text-xs text-gray-400">{fmtDate(sp.completedAt)}</div>
                  )}
                  {sp.slaDeadline && sp.status === 'PENDING' && isOverdue(sp.slaDeadline) && (
                    <div className="text-xs text-red-500">⚠ SLA expirado</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Executar etapa activa */}
        <div>
          {activeStep && activeStep.status === 'PENDING' ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <StepTypeBadge type={activeStep.step.type} />
                <span className="text-base font-semibold text-gray-900">{activeStep.step.title}</span>
              </div>
              {activeStep.step.description && (
                <p className="text-sm text-gray-500 mb-4">{activeStep.step.description}</p>
              )}

              {/* SLA */}
              {activeStep.slaDeadline && (
                <div className={`mb-4 px-3 py-2 rounded-lg text-xs ${isOverdue(activeStep.slaDeadline) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  SLA: {fmtDate(activeStep.slaDeadline)}
                  {isOverdue(activeStep.slaDeadline) && ' — EXPIRADO'}
                </div>
              )}

              {/* Checklist */}
              {activeStep.step.checklist.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Checklist</div>
                  <div className="space-y-2">
                    {activeStep.step.checklist.map((item, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer group">
                        <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600 group-has-[:checked]:line-through group-has-[:checked]:text-gray-400">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload obrigatório */}
              {activeStep.step.requiresUpload && (
                <div className="mb-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <div className="text-2xl mb-2">📎</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Upload de evidência obrigatório</div>
                  <button className="text-xs text-blue-600 underline">Seleccionar ficheiro</button>
                </div>
              )}

              {/* Notas */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Notas / Observações
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Adicione observações sobre a execução desta etapa…"
                />
              </div>

              {/* Acções */}
              <div className="flex gap-3">
                <button
                  onClick={completeStep}
                  disabled={completing}
                  className="flex-1 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {completing ? 'A concluir…' : '✓ Marcar como concluída'}
                </button>
                <button
                  onClick={rejectStep}
                  className="px-4 py-2.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50"
                >
                  ✗ Rejeitar
                </button>
              </div>
            </div>
          ) : instance.status === 'COMPLETED' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">✅</div>
              <div className="text-base font-semibold text-emerald-800">Processo concluído!</div>
              <div className="text-sm text-emerald-600 mt-1">
                Todas as etapas foram executadas com sucesso.
              </div>
              {instance.completedAt && (
                <div className="text-xs text-emerald-500 mt-2">Concluído em {fmtDate(instance.completedAt)}</div>
              )}
            </div>
          ) : activeStep ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
              Seleccione uma etapa pendente para executar
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── View: My Tasks ───────────────────────────────────────────────────────────

function MyTasksView({ onOpenInstance }: { onOpenInstance: (id: number) => void }) {
  const { data: tasks = [], isLoading, error } = useApiQuery<StepProgress[]>(
    queryKeys.processes.myTasks(), '/processes/my-tasks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={4} />;
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;

  if (tasks.length === 0) return (
    <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
      Sem tarefas pendentes 🎉
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_160px_100px_120px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div>Tarefa / Processo</div>
        <div>Colaborador</div>
        <div>Tipo</div>
        <div>SLA</div>
      </div>
      {tasks.map((t: any) => (
        <div
          key={t.id}
          className="grid grid-cols-[1fr_160px_100px_120px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-0"
          onClick={() => onOpenInstance(t.instance.id)}
        >
          <div>
            <div className="text-sm font-medium text-gray-900">{t.step.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t.instance.process.code} — {t.instance.process.title}
            </div>
          </div>
          <div className="text-sm text-gray-600">{t.instance.targetUser.fullName}</div>
          <div><StepTypeBadge type={t.step.type} /></div>
          <div>
            {t.slaDeadline ? (
              <span className={`text-xs font-medium ${isOverdue(t.slaDeadline) ? 'text-red-600' : 'text-amber-700'}`}>
                {isOverdue(t.slaDeadline) ? '⚠ Expirado' : fmtDate(t.slaDeadline)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── View: Dashboard ─────────────────────────────────────────────────────────

function DashboardView({ onOpenInstance }: { onOpenInstance: (id: number) => void }) {
  const { data, isLoading, error } = useApiQuery<Dashboard>(
    queryKeys.processes.dashboard(), '/processes/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (error)     return <div className="text-sm text-red-500">{error.message}</div>;
  if (!data)     return null;

  const MetricCard = ({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) => (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${accent ?? 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Métricas de processos */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Biblioteca de processos</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Activos"      value={data.processes.active}   sub="Em uso"        accent="text-emerald-600" />
          <MetricCard label="Em revisão"   value={data.processes.inReview} sub="Aguardam aprovação" accent="text-amber-600" />
          <MetricCard label="Rascunhos"    value={data.processes.draft}    sub="Em construção" />
        </div>
      </div>

      {/* Métricas de instâncias */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Execuções</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Em progresso" value={data.instances.inProgress} accent="text-blue-600" />
          <MetricCard label="Concluídas"   value={data.instances.completed}  accent="text-emerald-600" />
          <MetricCard label="SLA expirados" value={data.compliance.overdueSteps} accent={data.compliance.overdueSteps > 0 ? 'text-red-600' : 'text-gray-900'} />
        </div>
      </div>

      {/* Instâncias recentes */}
      {data.recentInstances.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Instâncias recentes</div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {data.recentInstances.map(inst => (
              <div
                key={inst.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => onOpenInstance(inst.id)}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{inst.process.title}</div>
                  <div className="text-xs text-gray-400">{inst.targetUser.fullName} · {fmtDate(inst.startedAt)}</div>
                </div>
                <InstanceStatusBadge status={inst.status} />
                <RiskBadge level={inst.process.riskLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

type View = 'library' | 'viewer' | 'runner' | 'tasks' | 'dashboard';

const NAV: Array<{ id: View; label: string }> = [
  { id: 'library',   label: 'Biblioteca' },
  { id: 'tasks',     label: 'Minhas tarefas' },
  { id: 'dashboard', label: 'Dashboard' },
];

export default function ProcessStandardPage() {
  const [view, setView] = useState<View>('library');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  const handleSelectProcess = (id: number) => {
    setSelectedProcessId(id);
    setView('viewer');
  };

  const handleStartInstance = (instanceId: number) => {
    setSelectedInstanceId(instanceId);
    setView('runner');
  };

  const handleOpenInstance = (instanceId: number) => {
    setSelectedInstanceId(instanceId);
    setView('runner');
  };

  const handleBack = () => {
    if (view === 'runner' && selectedProcessId) {
      setView('viewer');
    } else {
      setSelectedProcessId(null);
      setSelectedInstanceId(null);
      setView('library');
    }
  };

  const titles: Record<View, string> = {
    library:   'Biblioteca de Processos',
    viewer:    'Visualizar Processo',
    runner:    'Executar Processo',
    tasks:     'Minhas Tarefas',
    dashboard: 'Dashboard Operacional',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{titles[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Process Standard (BPM/SOP)</p>
        </div>
        {view === 'library' && (
          <button
            onClick={() => alert('Abrir formulário de criação de processo')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo processo
          </button>
        )}
      </div>

      {/* Tabs (não mostrar em viewer/runner) */}
      {view !== 'viewer' && view !== 'runner' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {view === 'library' && (
        <LibraryView onSelect={handleSelectProcess} />
      )}
      {view === 'viewer' && selectedProcessId !== null && (
        <ProcessViewer
          processId={selectedProcessId}
          onBack={handleBack}
          onStartInstance={handleStartInstance}
        />
      )}
      {view === 'runner' && selectedInstanceId !== null && (
        <TaskRunner instanceId={selectedInstanceId} onBack={handleBack} />
      )}
      {view === 'tasks' && (
        <MyTasksView onOpenInstance={handleOpenInstance} />
      )}
      {view === 'dashboard' && (
        <DashboardView onOpenInstance={handleOpenInstance} />
      )}
    </div>
  );
}
