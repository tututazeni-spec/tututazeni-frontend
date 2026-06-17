'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type EnrollmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'EXPIRED' | 'CANCELLED';
type EnrollmentOrigin = 'MANUAL' | 'SELF_ENROLL' | 'LEARNING_PATH' | 'ONBOARDING' | 'RULE_ENGINE' | 'CAMPAIGN';

interface Enrollment {
  id: number;
  courseId: number;
  userId: number;
  status: EnrollmentStatus;
  mandatory: boolean;
  origin: EnrollmentOrigin;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  isOverdue: boolean;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null; department: { name: string } | null };
  course: { id: number; title: string; thumbnailUrl: string | null; category: string | null; workloadHours: number | null };
  certificate: { id: number; code: string; issuedAt: string } | null;
}

interface MyEnrollmentsResponse {
  enrollments: Enrollment[];
  groups: {
    overdue:    Enrollment[];
    inProgress: Enrollment[];
    notStarted: Enrollment[];
    completed:  Enrollment[];
    cancelled:  Enrollment[];
  };
}

interface AdminDashboard {
  enrollments: { total: number; completed: number; inProgress: number; notStarted: number; overdue: number };
  mandatory:   number;
  completionRate: number;
  topCourses: Array<{ id: number; title: string; category: string | null; enrollments: number }>;
}

interface ComplianceDashboard {
  mandatory: { total: number; completed: number; overdue: number; notStarted: number };
  complianceRate: number;
  topOverdueCourses: Array<{ id: number; title: string; overdueCount: number }>;
}

type View = 'my' | 'admin' | 'compliance' | 'team';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function deadlineCountdown(deadline: string | null): string {
  if (!deadline) return '';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'Expirado';
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days} dias`;
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Badge components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg: Record<EnrollmentStatus, { label: string; cls: string; dot: string }> = {
    NOT_STARTED: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
    IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700',      dot: 'bg-blue-500' },
    COMPLETED:   { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-700',dot: 'bg-emerald-500' },
    OVERDUE:     { label: 'Atrasado',     cls: 'bg-red-50 text-red-700',        dot: 'bg-red-500' },
    EXPIRED:     { label: 'Expirado',     cls: 'bg-orange-50 text-orange-700',  dot: 'bg-orange-500' },
    CANCELLED:   { label: 'Cancelado',    cls: 'bg-gray-100 text-gray-400',     dot: 'bg-gray-300' },
  };
  const { label, cls, dot } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
    </span>
  );
}

function OriginBadge({ origin }: { origin: EnrollmentOrigin }) {
  const labels: Record<EnrollmentOrigin, string> = {
    MANUAL:        'Manual',
    SELF_ENROLL:   'Auto-inscrição',
    LEARNING_PATH: 'Trilha',
    ONBOARDING:    'Onboarding',
    RULE_ENGINE:   'Automático',
    CAMPAIGN:      'Campanha',
  };
  return <span className="text-xs text-gray-400">{labels[origin]}</span>;
}

function ProgressBar({ pct, overdue }: { pct: number; overdue: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${overdue ? 'bg-red-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function DeadlinePill({ deadline, isOverdue }: { deadline: string | null; isOverdue: boolean }) {
  if (!deadline) return null;
  const countdown = deadlineCountdown(deadline);
  const urgent    = !isOverdue && ['Hoje', 'Amanhã', '2 dias', '3 dias'].some(d => countdown.includes(d.split(' ')[0]));
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isOverdue ? 'bg-red-50 text-red-700' :
      urgent    ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-100 text-gray-500'
    }`}>
      {isOverdue ? '⚠ ' : '⏳ '}{countdown}
    </span>
  );
}

function Avatar({ user }: { user: { fullName: string; avatarUrl: string | null } }) {
  const initials = user.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── Enrollment Card (learner view) ──────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  onCancel,
}: {
  enrollment: Enrollment;
  onCancel?: (id: number) => void;
}) {
  const { course, status, mandatory, isOverdue, progressPercent, completedLessons, totalLessons, deadline } = enrollment;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
      isOverdue ? 'border-red-200' :
      status === 'COMPLETED' ? 'border-emerald-200' :
      status === 'IN_PROGRESS' ? 'border-blue-200' :
      'border-gray-200'
    }`}>
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📚</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {mandatory && <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0 rounded font-medium">Obrigatório</span>}
                {course.category && <span className="text-xs text-gray-400">{course.category}</span>}
              </div>
              <div className="text-sm font-medium text-gray-900 line-clamp-1">{course.title}</div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Progress */}
          {status !== 'NOT_STARTED' && status !== 'CANCELLED' && totalLessons > 0 && (
            <div className="mb-2">
              <ProgressBar pct={progressPercent} overdue={isOverdue} />
              <div className="text-xs text-gray-400 mt-0.5">{completedLessons}/{totalLessons} aulas</div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DeadlinePill deadline={deadline} isOverdue={isOverdue} />
              {enrollment.certificate && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">🏆 Certificado</span>
              )}
            </div>

            {/* CTA button */}
            <div>
              {status === 'NOT_STARTED' && (
                <a href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800">
                  Iniciar →
                </a>
              )}
              {status === 'IN_PROGRESS' && (
                <a href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800">
                  Continuar →
                </a>
              )}
              {status === 'OVERDUE' && (
                <a href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">
                  ⚠ Iniciar agora →
                </a>
              )}
              {status === 'COMPLETED' && (
                <span className="text-xs text-emerald-600 font-medium">✓ Concluído</span>
              )}
              {!mandatory && status !== 'COMPLETED' && status !== 'CANCELLED' && onCancel && (
                <button onClick={() => onCancel(enrollment.id)}
                  className="ml-2 text-xs text-gray-400 hover:text-red-500">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: My Enrollments ─────────────────────────────────────────────────────

function MyEnrollmentsView() {
  const [tab, setTab] = useState<'all' | 'overdue' | 'inProgress' | 'notStarted' | 'completed'>('all');

  const { data, isLoading } = useApiQuery<MyEnrollmentsResponse>(
    queryKeys.enrollments.my(), '/enrollments/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/enrollments/my/${id}/cancel`, {}),
    { invalidateKeys: [queryKeys.enrollments.my()], onError: (e) => alert(e.message) },
  );

  const handleCancel = (id: number) => {
    if (!confirm('Cancelar esta matrícula?')) return;
    cancel.mutate(id);
  };

  if (isLoading || !data) return <Skeleton rows={4} />;

  const tabs: Array<{ id: typeof tab; label: string; count: number }> = [
    { id: 'all',        label: 'Todos',          count: data.enrollments.length },
    { id: 'overdue',    label: 'Atrasados',      count: data.groups.overdue.length },
    { id: 'inProgress', label: 'Em progresso',   count: data.groups.inProgress.length },
    { id: 'notStarted', label: 'Não iniciados',  count: data.groups.notStarted.length },
    { id: 'completed',  label: 'Concluídos',     count: data.groups.completed.length },
  ];

  const displayed = tab === 'all' ? data.enrollments : (data.groups[tab] ?? []);

  return (
    <div>
      {/* Alertas de overdue */}
      {data.groups.overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠</span>
          <div>
            <div className="text-sm font-medium text-red-800">
              {data.groups.overdue.length} curso(s) com prazo expirado
            </div>
            <div className="text-xs text-red-600">
              {data.groups.overdue.filter(e => e.mandatory).length} obrigatório(s) — conclua o mais rapidamente possível
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0 rounded-full text-xs ${
                t.id === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem matrículas nesta categoria
          </div>
        ) : (
          displayed.map(e => (
            <EnrollmentCard key={e.id} enrollment={e} onCancel={handleCancel} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── View: Admin Enrollments Table ────────────────────────────────────────────

function AdminView() {
  const [status, setStatus]     = useState('');
  const [mandatory, setMandatory] = useState('');
  const [overdue, setOverdue]   = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDeadline, setBulkDeadline] = useState('');

  const params = {
    page, limit: 20,
    status, mandatory,
    overdue: overdue ? 'true' : undefined,
  };

  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.enrollments.list(params), '/enrollments',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  // Deadline em massa: dispara os PATCH em paralelo; ao concluir invalida as listas.
  const bulkDeadlineMut = useApiMutation(
    () => Promise.all(
      selected.map((id) =>
        apiClient.patch(`/enrollments/${id}/deadline`, { deadline: bulkDeadline }),
      ),
    ),
    {
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: () => { setSelected([]); setBulkDeadline(''); },
      onError: (e) => alert(e.message),
    },
  );
  const bulkLoading = bulkDeadlineMut.isPending;

  const handleBulkDeadline = () => {
    if (!bulkDeadline || selected.length === 0) return;
    bulkDeadlineMut.mutate(undefined);
  };

  const toggleSelect = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os estados</option>
          <option value="NOT_STARTED">Não iniciado</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="COMPLETED">Concluído</option>
          <option value="OVERDUE">Atrasado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select value={mandatory} onChange={e => { setMandatory(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={!!overdue} onChange={e => setOverdue(e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
          Apenas atrasados
        </label>
        <span className="text-sm text-gray-400 ml-auto">{data?.total ?? 0} matrículas</span>
      </div>

      {/* Bulk deadline */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-700">{selected.length} seleccionados</span>
          <input
            type="date"
            value={bulkDeadline}
            onChange={e => setBulkDeadline(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
          />
          <button
            onClick={handleBulkDeadline}
            disabled={!bulkDeadline || bulkLoading}
            className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {bulkLoading ? 'A aplicar…' : 'Actualizar deadline'}
          </button>
          <button onClick={() => setSelected([])} className="text-xs text-blue-600 ml-auto">Limpar</button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div/>
          <div>Colaborador / Curso</div>
          <div>Estado</div>
          <div>Progresso</div>
          <div>Origem</div>
          <div>Deadline</div>
          <div>Tipo</div>
        </div>

        {loading && <div className="p-4"><Skeleton /></div>}

        {!loading && data?.data?.map((e: any) => (
          <div key={e.id}
            className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 last:border-0">
            <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar user={e.user} />
                <div>
                  <div className="text-xs font-medium text-gray-900">{e.user?.fullName}</div>
                  <div className="text-xs text-gray-400">{e.user?.email}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 pl-10 truncate">{e.course?.title}</div>
            </div>
            <div><StatusBadge status={e.status} /></div>
            <div>
              <ProgressBar pct={e.progressPercent ?? 0} overdue={e.isOverdue} />
            </div>
            <div><OriginBadge origin={e.origin} /></div>
            <div className="text-xs">
              {e.deadline ? (
                <DeadlinePill deadline={e.deadline} isOverdue={e.isOverdue} />
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </div>
            <div>
              {e.mandatory
                ? <span className="text-xs text-red-600 font-medium">Obrigatório</span>
                : <span className="text-xs text-gray-400">Opcional</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">Página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ← Anterior
            </button>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Compliance Dashboard ───────────────────────────────────────────────

function ComplianceView() {
  // Duas queries independentes → correm em paralelo.
  const { data } = useApiQuery<ComplianceDashboard>(
    queryKeys.enrollments.compliance(), '/enrollments/compliance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: dashboard } = useApiQuery<AdminDashboard>(
    queryKeys.enrollments.adminDashboard(), '/enrollments/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (!data || !dashboard) return <Skeleton rows={3} />;

  const pctColor = data.complianceRate >= 80 ? 'text-emerald-600' : data.complianceRate >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Métricas globais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total matrículas',  value: dashboard.enrollments.total                                        },
          { label: 'Concluídas',        value: dashboard.enrollments.completed,   color: 'text-emerald-600'      },
          { label: 'Taxa conclusão',    value: `${dashboard.completionRate}%`,     color: 'text-blue-600'         },
          { label: 'Atrasadas',         value: dashboard.enrollments.overdue,      color: dashboard.enrollments.overdue > 0 ? 'text-red-600' : undefined },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Compliance de obrigatórios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Compliance — Cursos obrigatórios</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {data.mandatory.completed}/{data.mandatory.total} concluídos
            </div>
          </div>
          <div className={`text-3xl font-bold font-mono ${pctColor}`}>
            {data.complianceRate}%
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              data.complianceRate >= 80 ? 'bg-emerald-500' :
              data.complianceRate >= 50 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${data.complianceRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Concluídos',    value: data.mandatory.completed,  cls: 'text-emerald-600' },
            { label: 'Não iniciados', value: data.mandatory.notStarted, cls: 'text-gray-500'    },
            { label: 'Atrasados',     value: data.mandatory.overdue,    cls: 'text-red-600'     },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <div className={`text-xl font-bold font-mono ${cls}`}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top cursos com mais atrasos */}
      {data.topOverdueCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos com mais atrasos
          </div>
          {data.topOverdueCourses.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm font-bold font-mono text-gray-200 w-5">{idx + 1}</span>
              <div className="flex-1 text-sm text-gray-800">{c.title}</div>
              <span className="text-sm font-mono text-red-600">{c.overdueCount} atrasados</span>
            </div>
          ))}
        </div>
      )}

      {/* Top cursos por matrículas */}
      {dashboard.topCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos mais populares
          </div>
          {dashboard.topCourses.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm font-bold font-mono text-gray-200 w-5">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-sm text-gray-800">{c.title}</div>
                {c.category && <div className="text-xs text-gray-400">{c.category}</div>}
              </div>
              <span className="text-sm font-mono text-gray-500">{c.enrollments} matrículas</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Team Progress ──────────────────────────────────────────────────────

function TeamView() {
  const { data, isLoading } = useApiQuery<any>(
    queryKeys.enrollments.team(), '/enrollments/team',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  if (data.team.length === 0) return (
    <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
      Sem subordinados directos
    </div>
  );

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">{data.total} membros na equipa</div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div>
          <div>Total</div>
          <div>Concluídos</div>
          <div>Atrasados</div>
          <div>Compliance</div>
        </div>
        {data.team.map((member: any) => {
          const compliance = member.stats.total > 0
            ? Math.round((member.stats.completed / member.stats.total) * 100)
            : 100;
          return (
            <div key={member.id}
              className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar user={member} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                  <div className="text-xs text-gray-400">{member.email}</div>
                </div>
              </div>
              <div className="text-sm font-mono text-gray-500">{member.stats.total}</div>
              <div className="text-sm font-mono text-emerald-600">{member.stats.completed}</div>
              <div className={`text-sm font-mono ${member.stats.overdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                {member.stats.overdue}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${compliance >= 80 ? 'bg-emerald-500' : compliance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${compliance}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-8">{compliance}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'my',         label: 'As minhas matrículas' },
  { id: 'admin',      label: 'Gestão (Admin)' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'team',       label: 'Equipa' },
];

const TITLES: Record<View, string> = {
  my:         'As minhas matrículas',
  admin:      'Gestão de Matrículas',
  compliance: 'Dashboard de Compliance',
  team:       'Progresso da Equipa',
};

export default function EnrollmentsPage() {
  const [view, setView] = useState<View>('my');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Formação</p>
        </div>
        {view === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => alert('Abrir formulário de matrícula')}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
            >
              + Matricular
            </button>
            <button
              onClick={() => alert('Abrir modal de matrículas em massa')}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
            >
              ⚡ Em massa
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
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

      {view === 'my'         && <MyEnrollmentsView />}
      {view === 'admin'      && <AdminView />}
      {view === 'compliance' && <ComplianceView />}
      {view === 'team'       && <TeamView />}
    </div>
  );
}
