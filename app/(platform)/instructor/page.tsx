// src/app/(dashboard)/instructor/page.tsx
'use client';

import { useState } from 'react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstructorProfile {
  id: number;
  expertiseArea: string;
  instructorType: string;
  ratingAverage: number;
  totalCourses: number;
  approved: boolean;
  bio: string | null;
  specialties: string[];
  availableForMentoring: boolean;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

interface DashboardData {
  profile: { id: number; fullName: string; expertiseArea: string; ratingAverage: number; totalCourses: number; instructorType: string };
  metrics: { activeCohorts: number; totalStudents: number; avgCompletionRate: number; totalAtRisk: number; totalReviews: number; ratingAverage: number };
  cohorts: CohortSummary[];
  recentReviews: any[];
}

interface CohortSummary {
  id: number;
  name: string;
  course: { id: number; title: string };
  status: string;
  startDate: string;
  endDate: string | null;
  modalidade: string;
  totalStudents: number;
  completed: number;
  atRisk: number;
  avgProgress: number;
  completionRate: number;
}

interface CohortDetail {
  id: number;
  name: string;
  course: { id: number; title: string; workloadHours: number | null };
  status: string;
  modalidade: string;
  maxParticipants: number;
  startDate: string;
  endDate: string | null;
  atRiskCount: number;
  atRisk: number[];
  participants: Participant[];
}

interface Participant {
  id: number;
  userId: number;
  status: string;
  progress: number;
  enrolledAt: string;
  enrollmentProgress: number;
  enrollmentStatus: string;
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
}

interface AtRiskStudent {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  cohortName: string;
  course: { id: number; title: string };
  progress: number;
  daysSinceEnroll: number;
}

type View = 'dashboard' | 'cohorts' | 'cohort-detail' | 'at-risk' | 'profile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0`}>
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

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8">{pct}%</span>
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  OPEN:     { label: 'Aberta',   cls: 'bg-blue-50 text-blue-700' },
  ACTIVE:   { label: 'Activa',   cls: 'bg-emerald-50 text-emerald-700' },
  CLOSED:   { label: 'Encerrada',cls: 'bg-gray-100 text-gray-400' },
  CANCELLED:{ label: 'Cancelada',cls: 'bg-red-50 text-red-600' },
};

const MODALITY_CFG: Record<string, { icon: string; label: string }> = {
  ONLINE:     { icon: '💻', label: 'Online' },
  PRESENCIAL: { icon: '🏢', label: 'Presencial' },
  HYBRID:     { icon: '🔀', label: 'Híbrido' },
};

const STUDENT_STATUS: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: 'bg-emerald-50 text-emerald-700', label: 'Activo' },
  COMPLETED: { cls: 'bg-blue-50 text-blue-700',       label: 'Concluído' },
  AT_RISK:   { cls: 'bg-red-50 text-red-700',         label: 'Em risco' },
  DROPPED:   { cls: 'bg-gray-100 text-gray-400',      label: 'Desistiu' },
};

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`text-sm ${n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  );
}

// ─── View: Dashboard ──────────────────────────────────────────────────────────

function DashboardView({ onSelectCohort }: { onSelectCohort: (id: number) => void }) {
  const { data, isLoading } = useApiQuery<DashboardData>(
    queryKeys.instructor.dashboard(), '/instructors/my/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { metrics, cohorts, recentReviews } = data;

  return (
    <div className="space-y-5">
      {/* Alerta de risco */}
      {metrics.totalAtRisk > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-red-700">
              {metrics.totalAtRisk} aluno(s) em risco nas tuas turmas activas
            </div>
            <div className="text-xs text-red-500">Sem actividade há mais de 7 dias ou progresso abaixo de 20%</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Turmas activas',    value: metrics.activeCohorts },
          { label: 'Total de alunos',   value: metrics.totalStudents },
          { label: 'Taxa de conclusão', value: `${metrics.avgCompletionRate}%`, color: 'text-emerald-600' },
          { label: 'Avaliação média',   value: metrics.ratingAverage.toFixed(1), color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Turmas activas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Turmas activas
        </div>
        {cohorts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Sem turmas activas</div>
        ) : (
          cohorts.map(c => {
            const statusCfg   = STATUS_CFG[c.status]   ?? STATUS_CFG.DRAFT;
            const modalityCfg = MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <div key={c.id}
                onClick={() => onSelectCohort(c.id)}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
                    <span className="text-xs text-gray-400">{modalityCfg.icon} {modalityCfg.label}</span>
                  </div>
                  <div className="text-xs text-gray-400">{c.course.title}</div>
                  <div className="mt-1.5 max-w-xs">
                    <ProgressBar pct={c.avgProgress} color={c.avgProgress > 60 ? 'bg-emerald-500' : 'bg-blue-500'} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{c.totalStudents} alunos</div>
                  {c.atRisk > 0 && (
                    <div className="text-xs text-red-600">⚠ {c.atRisk} em risco</div>
                  )}
                  <div className="text-xs text-gray-400">{fmtDate(c.startDate)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reviews recentes */}
      {recentReviews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Avaliações recentes</div>
          <div className="space-y-3">
            {recentReviews.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={r.user?.fullName ?? 'A'} avatarUrl={r.user?.avatarUrl} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{r.user?.fullName}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-xs text-gray-500">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Cohorts ────────────────────────────────────────────────────────────

function CohortsView({ onSelectCohort }: { onSelectCohort: (id: number) => void }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating]         = useState(false);
  const [form, setForm]                 = useState({ name: '', courseId: '', startDate: '', modalidade: 'ONLINE', maxParticipants: '30' });

  const params = statusFilter ? { status: statusFilter } : {};
  const { data, isLoading: loading, refetch } = useApiQuery<{ data: CohortSummary[] }>(
    queryKeys.instructor.cohorts(statusFilter), '/instructors/my/cohorts',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const handleCreate = async () => {
    if (!form.name || !form.courseId || !form.startDate) { alert('Nome, curso e data de início obrigatórios'); return; }
    try {
      await apiClient.post('/instructors/my/cohorts', {
        name: form.name, courseId: parseInt(form.courseId), startDate: form.startDate,
        modalidade: form.modalidade, maxParticipants: parseInt(form.maxParticipants),
      });
      setCreating(false);
      setForm({ name: '', courseId: '', startDate: '', modalidade: 'ONLINE', maxParticipants: '30' });
      refetch();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['', 'OPEN', 'ACTIVE', 'CLOSED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === '' ? 'Todas' : STATUS_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <button onClick={() => setCreating(c => !c)}
          className="px-3 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800">
          {creating ? '✕ Cancelar' : '+ Nova turma'}
        </button>
      </div>

      {/* Formulário de criação */}
      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Nova turma</div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nome da turma" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2" />
            <input type="number" placeholder="ID do curso" value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.modalidade} onChange={e => setForm(f => ({ ...f, modalidade: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(MODALITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input type="number" placeholder="Máx. participantes" value={form.maxParticipants}
              onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleCreate} className="mt-3 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800">
            Criar turma
          </button>
        </div>
      )}

      {loading ? <Skeleton /> : (
        <div className="grid grid-cols-2 gap-3">
          {(data?.data ?? []).map(c => {
            const statusCfg   = STATUS_CFG[c.status]      ?? STATUS_CFG.DRAFT;
            const modalityCfg = MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <div key={c.id} onClick={() => onSelectCohort(c.id)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
                      <span className="text-xs text-gray-400">{modalityCfg.icon}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.course.title}</div>
                  </div>
                </div>
                <ProgressBar pct={c.avgProgress} />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>👥 {c.totalStudents} alunos</span>
                  {c.atRisk > 0 && <span className="text-red-600">⚠ {c.atRisk} em risco</span>}
                  <span>{fmtDate(c.startDate)}</span>
                </div>
              </div>
            );
          })}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2 py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem turmas criadas
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Cohort Detail ──────────────────────────────────────────────────────

function CohortDetailView({ cohortId, onBack }: { cohortId: number; onBack: () => void }) {
  const [tab, setTab]     = useState<'students' | 'atrisk'>('students');

  const { data, isLoading } = useApiQuery<CohortDetail>(
    queryKeys.instructor.cohortDetail(cohortId), `/instructors/my/cohorts/${cohortId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  const atRiskSet   = new Set(data.atRisk);
  const statusCfg   = STATUS_CFG[data.status]      ?? STATUS_CFG.DRAFT;
  const modalityCfg = MODALITY_CFG[data.modalidade] ?? MODALITY_CFG.ONLINE;
  const atRiskList  = data.participants.filter(p => atRiskSet.has(p.userId));
  const activeList  = data.participants.filter(p => !atRiskSet.has(p.userId));

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span className="text-xs text-gray-400">{modalityCfg.icon} {modalityCfg.label}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{data.name}</h2>
            <p className="text-sm text-gray-500">{data.course.title}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{data.participants.length}</div>
            <div className="text-xs text-gray-400">/ {data.maxParticipants} alunos</div>
            {data.atRiskCount > 0 && <div className="text-xs text-red-600 mt-1">⚠ {data.atRiskCount} em risco</div>}
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mt-3">
          <span>📅 Início: {fmtDate(data.startDate)}</span>
          {data.endDate && <span>📅 Fim: {fmtDate(data.endDate)}</span>}
          {data.course.workloadHours && <span>⏱ {data.course.workloadHours}h</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {([
          { id: 'students', label: `👥 Todos (${data.participants.length})` },
          { id: 'atrisk',   label: `⚠ Em risco (${data.atRiskCount})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Participant list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {(tab === 'students' ? data.participants : atRiskList).map(p => {
          const isAtRisk = atRiskSet.has(p.userId);
          return (
            <div key={p.userId} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${isAtRisk ? 'bg-red-50' : ''}`}>
              <Avatar name={p.user.fullName} avatarUrl={p.user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{p.user.fullName}</span>
                  {isAtRisk && <span className="text-xs text-red-600 font-medium">⚠ Em risco</span>}
                </div>
                <div className="text-xs text-gray-400">{p.user.position?.name ?? '—'}</div>
                <div className="mt-1 max-w-xs">
                  <ProgressBar
                    pct={p.enrollmentProgress}
                    color={p.enrollmentProgress > 60 ? 'bg-emerald-500' : p.enrollmentProgress > 30 ? 'bg-blue-500' : 'bg-red-400'}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs px-1.5 py-0.5 rounded ${STUDENT_STATUS[p.enrollmentStatus]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                  {STUDENT_STATUS[p.enrollmentStatus]?.label ?? p.enrollmentStatus}
                </span>
                <div className="text-xs text-gray-400 mt-0.5">Inscrito: {fmtDate(p.enrolledAt)}</div>
              </div>
            </div>
          );
        })}
        {(tab === 'students' ? data.participants : atRiskList).length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {tab === 'atrisk' ? '✅ Sem alunos em risco' : 'Sem participantes inscritos'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: At-Risk ────────────────────────────────────────────────────────────

function AtRiskView() {
  const { data, isLoading } = useApiQuery<{ count: number; students: AtRiskStudent[] }>(
    queryKeys.instructor.atRisk(), '/instructors/my/at-risk-students',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div>
      <div className={`flex items-center gap-3 mb-5 p-4 border rounded-xl ${data.count > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <span className="text-3xl">{data.count > 0 ? '⚠️' : '✅'}</span>
        <div>
          <div className={`text-sm font-semibold ${data.count > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {data.count > 0 ? `${data.count} aluno(s) em risco` : 'Nenhum aluno em risco'}
          </div>
          <div className="text-xs text-gray-500">Progresso abaixo de 20% após 7 dias de inscrição</div>
        </div>
      </div>

      {data.students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.students.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
              <Avatar name={s.fullName} avatarUrl={s.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{s.fullName}</div>
                <div className="text-xs text-gray-400">{s.cohortName} · {s.course.title}</div>
                <div className="mt-1 max-w-xs">
                  <ProgressBar pct={s.progress} color="bg-red-400" />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-red-600 font-medium">Inscrito há {s.daysSinceEnroll} dias</div>
                <div className="text-xs text-gray-400">Progresso: {s.progress}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'cohorts',   label: '👥 Turmas' },
  { id: 'at-risk',   label: '⚠ Em risco' },
];

const TITLES: Record<View, string> = {
  dashboard:     'Painel do Instrutor',
  cohorts:       'As minhas Turmas',
  'cohort-detail':'Detalhe da Turma',
  'at-risk':     'Alunos em Risco',
  profile:       'Perfil do Instrutor',
};

export default function InstructorPage() {
  const [view, setView]         = useState<View>('dashboard');
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);

  const handleSelectCohort = (id: number) => { setSelectedCohort(id); setView('cohort-detail'); };
  const handleBack         = () => { setSelectedCohort(null); setView('cohorts'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Instrutores</p>
        </div>
        {view === 'cohort-detail' && (
          <button onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
            ← Voltar
          </button>
        )}
      </div>

      {view !== 'cohort-detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'dashboard'     && <DashboardView onSelectCohort={handleSelectCohort} />}
      {view === 'cohorts'       && <CohortsView   onSelectCohort={handleSelectCohort} />}
      {view === 'at-risk'       && <AtRiskView />}
      {view === 'cohort-detail' && selectedCohort !== null && (
        <CohortDetailView cohortId={selectedCohort} onBack={handleBack} />
      )}
    </div>
  );
}