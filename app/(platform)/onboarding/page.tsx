'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'ON_HOLD';
type TaskStatus       = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
type TaskCategory     = 'DOCUMENTS' | 'IT_ACCESS' | 'TRAINING' | 'SOCIAL' | 'BENEFITS' | 'ADMIN' | 'MEETING';
type TaskPhase        = 'PRE_BOARDING' | 'DAY_1' | 'WEEK_1' | 'DAY_30' | 'DAY_60' | 'DAY_90';
type DocStatus        = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TemplateTask {
  id: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  type: string;
  phase: TaskPhase;
  responsible: string;
  dueDayOffset: number | null;
  xpReward: number;
  requiresApproval: boolean;
  requiresEvidence: boolean;
  seq: number;
}

interface TaskInstance {
  id: number;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  evidenceComment: string | null;
  evidenceUrl: string | null;
  skipReason: string | null;
  templateTask: TemplateTask;
}

interface OnboardingPlan {
  id: number;
  userId: number;
  status: OnboardingStatus;
  startDate: string;
  expectedEndDate: string | null;
  completedAt: string | null;
  xpEarned: number;
  progress?: number;
  completedTasks?: number;
  totalTasks?: number;
  daysIn?: number;
  byPhase?: Record<TaskPhase, TaskInstance[]>;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null; department: { name: string } | null; position: { name: string } | null };
  template: { id: number; name: string; durationDays: number; welcomeVideoUrl: string | null };
  buddy: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null } | null;
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  hrResponsible: { id: number; fullName: string; avatarUrl: string | null } | null;
  taskInstances: TaskInstance[];
  documents: OnboardingDoc[];
  surveys: Survey[];
}

interface OnboardingDoc {
  id: number;
  documentType: string;
  fileUrl: string;
  status: DocStatus;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Survey {
  id: number;
  milestone: string;
  score: number;
  enps: number | null;
  comment: string | null;
  createdAt: string;
}

interface Dashboard {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    overdueTasks: number;
    avgSurveyScore: number;
  };
  active: Array<OnboardingPlan & { daysIn: number }>;
}

type View = 'my-plan' | 'dashboard' | 'templates';

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

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d: string | null): boolean {
  return !!d && new Date() > new Date(d);
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size];
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Badges & Labels ──────────────────────────────────────────────────────────

const STATUS_CFG: Record<OnboardingStatus, { label: string; cls: string }> = {
  NOT_STARTED: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-500' },
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
  COMPLETED:   { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-700' },
  ABANDONED:   { label: 'Abandonado',   cls: 'bg-red-50 text-red-700' },
  ON_HOLD:     { label: 'Em pausa',     cls: 'bg-amber-50 text-amber-700' },
};

const TASK_STATUS_CFG: Record<TaskStatus, { icon: string; cls: string }> = {
  PENDING:     { icon: '○', cls: 'text-gray-300' },
  IN_PROGRESS: { icon: '▶', cls: 'text-blue-500' },
  COMPLETED:   { icon: '✓', cls: 'text-emerald-500' },
  BLOCKED:     { icon: '🔒', cls: 'text-gray-400' },
  SKIPPED:     { icon: '⤷', cls: 'text-gray-400' },
};

const CATEGORY_CFG: Record<TaskCategory, { label: string; icon: string; cls: string }> = {
  DOCUMENTS: { label: 'Documentos',  icon: '📄', cls: 'bg-amber-50 text-amber-700' },
  IT_ACCESS: { label: 'TI & Acesso', icon: '💻', cls: 'bg-blue-50 text-blue-700' },
  TRAINING:  { label: 'Formação',    icon: '🎓', cls: 'bg-purple-50 text-purple-700' },
  SOCIAL:    { label: 'Social',      icon: '👥', cls: 'bg-emerald-50 text-emerald-700' },
  BENEFITS:  { label: 'Benefícios',  icon: '🎁', cls: 'bg-pink-50 text-pink-700' },
  ADMIN:     { label: 'Admin',       icon: '📋', cls: 'bg-gray-100 text-gray-600' },
  MEETING:   { label: 'Reunião',     icon: '📅', cls: 'bg-orange-50 text-orange-700' },
};

const PHASE_LABELS: Record<TaskPhase, string> = {
  PRE_BOARDING: 'Pré-boarding',
  DAY_1:        'Dia 1',
  WEEK_1:       'Semana 1',
  DAY_30:       'Dia 30',
  DAY_60:       'Dia 60',
  DAY_90:       'Dia 90',
};

const PHASE_ORDER: TaskPhase[] = ['PRE_BOARDING', 'DAY_1', 'WEEK_1', 'DAY_30', 'DAY_60', 'DAY_90'];

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 flex-shrink-0 w-8">{pct}%</span>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onComplete,
}: {
  task: TaskInstance;
  onComplete: (taskId: number) => void;
}) {
  const statusCfg  = TASK_STATUS_CFG[task.status];
  const catCfg     = CATEGORY_CFG[task.templateTask.category];
  const overdue    = isOverdue(task.dueDate) && task.status !== 'COMPLETED';

  return (
    <div className={`flex items-start gap-3 bg-white border rounded-xl p-4 transition-all ${
      task.status === 'COMPLETED' ? 'border-emerald-200 opacity-70' :
      task.status === 'BLOCKED'   ? 'border-gray-200 opacity-50' :
      overdue                     ? 'border-red-200' :
      'border-gray-200 hover:shadow-sm'
    }`}>
      <div className={`text-xl flex-shrink-0 mt-0.5 ${statusCfg.cls}`}>
        {statusCfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.templateTask.title}
            </div>
            {task.templateTask.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.templateTask.description}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${catCfg.cls}`}>
            {catCfg.icon} {catCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {task.dueDate && (
            <span className={overdue ? 'text-red-600 font-medium' : ''}>
              {overdue ? '⚠ ' : ''}Prazo: {fmtDate(task.dueDate)}
            </span>
          )}
          {task.templateTask.xpReward > 0 && (
            <span className="text-amber-600">⚡ {task.templateTask.xpReward} XP</span>
          )}
          {task.templateTask.requiresApproval && (
            <span className="text-blue-500">✎ Requer aprovação</span>
          )}
          {task.completedAt && (
            <span className="text-emerald-600">✓ {fmtDate(task.completedAt)}</span>
          )}
        </div>
      </div>

      {task.status === 'PENDING' || task.status === 'IN_PROGRESS' ? (
        <button
          onClick={() => onComplete(task.id)}
          disabled={(task.status as string) === 'BLOCKED'}
          className="flex-shrink-0 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 disabled:opacity-30"
        >
          Executar
        </button>
      ) : null}
    </div>
  );
}

// ─── View: My Plan ────────────────────────────────────────────────────────────

function MyPlanView() {
  const [plans, setPlans]         = useState<OnboardingPlan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [surveyScore, setSurveyScore] = useState(0);
  const [surveyComment, setSurveyComment] = useState('');
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'docs' | 'team' | 'survey'>('tasks');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<OnboardingPlan[]>('/onboarding/my');
      setPlans(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (taskId: number) => {
    setCompleting(taskId);
    try {
      await apiFetch('/onboarding/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ taskInstanceId: taskId }),
      });
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setCompleting(null); }
  };

  const handleSurvey = async (planId: number) => {
    if (!surveyScore) { alert('Seleccione uma nota'); return; }
    setSubmittingSurvey(true);
    try {
      await apiFetch('/onboarding/surveys', {
        method: 'POST',
        body: JSON.stringify({ planId, milestone: 'DAY_1', score: surveyScore, comment: surveyComment }),
      });
      await load();
      setSurveyScore(0); setSurveyComment('');
      alert('Pesquisa submetida! Obrigado pelo feedback.');
    } catch (e: any) { alert(e.message); }
    finally { setSubmittingSurvey(false); }
  };

  if (loading) return <Skeleton />;
  if (plans.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        <div className="text-4xl mb-3">🎉</div>
        Sem plano de onboarding atribuído ainda
      </div>
    );
  }

  const plan = plans[0];
  const pct  = plan.progress ?? 0;

  // Calcular tarefas por fase
  const tasksByPhase: Record<string, TaskInstance[]> = {};
  for (const t of plan.taskInstances) {
    const phase = t.templateTask.phase;
    if (!tasksByPhase[phase]) tasksByPhase[phase] = [];
    tasksByPhase[phase].push(t);
  }

  return (
    <div className="space-y-5">
      {/* Welcome */}
      {plan.template.welcomeVideoUrl && (
        <div className="bg-blue-700 text-white rounded-xl p-5 flex items-center gap-4">
          <div className="text-4xl">🎬</div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">Vídeo de boas-vindas</div>
            <div className="text-xs text-blue-200">Assiste ao vídeo de apresentação da empresa</div>
          </div>
          <a href={plan.template.welcomeVideoUrl} target="_blank" rel="noreferrer"
            className="px-4 py-2 bg-white text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-50">
            Assistir
          </a>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-0.5">Plano de integração</div>
            <div className="text-xl font-bold text-gray-900">{plan.template.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              Início: {fmtDate(plan.startDate)} · {plan.template.durationDays} dias
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold font-mono text-blue-700">{pct}%</div>
            <div className="text-xs text-gray-400">{plan.completedTasks}/{plan.totalTasks} tarefas</div>
            {plan.xpEarned > 0 && (
              <div className="text-xs text-amber-600 font-medium mt-1">⚡ {plan.xpEarned} XP ganho</div>
            )}
          </div>
        </div>
        <ProgressBar
          pct={pct}
          color={pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['tasks', 'docs', 'team', 'survey'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ tasks: '✅ Tarefas', docs: '📄 Documentos', team: '👥 Equipa', survey: '💬 Feedback' }[t]}
          </button>
        ))}
      </div>

      {/* Tarefas por fase */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          {PHASE_ORDER.map(phase => {
            const phaseTasks = tasksByPhase[phase] ?? [];
            if (!phaseTasks.length) return null;
            const phaseCompleted = phaseTasks.filter(t => t.status === 'COMPLETED').length;
            return (
              <div key={phase}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{PHASE_LABELS[phase]}</div>
                  <div className="text-xs text-gray-400">{phaseCompleted}/{phaseTasks.length}</div>
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${phaseTasks.length > 0 ? (phaseCompleted / phaseTasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documentos */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          {plan.documents.map(doc => (
            <div key={doc.id} className={`flex items-center gap-4 border rounded-xl p-4 ${
              doc.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50' :
              doc.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
              'border-gray-200 bg-white'
            }`}>
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{doc.documentType}</div>
                {doc.rejectionReason && (
                  <div className="text-xs text-red-600 mt-0.5">Motivo: {doc.rejectionReason}</div>
                )}
              </div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {{ APPROVED: '✓ Aprovado', REJECTED: '✗ Rejeitado', PENDING: '⏳ Pendente' }[doc.status]}
              </div>
            </div>
          ))}
          {plan.documents.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem documentos submetidos
            </div>
          )}
        </div>
      )}

      {/* Equipa de apoio */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gestor directo', person: plan.manager },
            { label: 'Buddy / Mentor',  person: plan.buddy },
            { label: 'RH Responsável',  person: plan.hrResponsible },
          ].map(({ label, person }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-3">{label}</div>
              {person ? (
                <div className="flex flex-col items-center gap-2">
                  <Avatar name={person.fullName} avatarUrl={person.avatarUrl} size="lg" />
                  <div className="text-sm font-medium text-gray-900">{person.fullName}</div>
                  {(person as any).position && (
                    <div className="text-xs text-gray-400">{(person as any).position.name}</div>
                  )}
                  <button className="text-xs text-blue-600 hover:underline mt-1">💬 Enviar mensagem</button>
                </div>
              ) : (
                <div className="text-xs text-gray-300 mt-4">Não atribuído</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pesquisa de feedback */}
      {activeTab === 'survey' && (
        <div className="space-y-4">
          {/* Pesquisas anteriores */}
          {plan.surveys.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-3">Feedbacks anteriores</div>
              {plan.surveys.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s.milestone}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-sm ${i < s.score ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  {s.comment && <p className="text-xs text-gray-500 truncate">{s.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Nova pesquisa */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-4">Como está a ser a tua experiência?</div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setSurveyScore(s)}
                  className={`text-3xl transition-transform hover:scale-110 ${s <= surveyScore ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={surveyComment} onChange={e => setSurveyComment(e.target.value)}
              rows={3} placeholder="Comentário opcional…"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={() => handleSurvey(plan.id)}
              disabled={!surveyScore || submittingSurvey}
              className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50"
            >
              {submittingSurvey ? 'A submeter…' : 'Enviar feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Dashboard RH/Gestor ────────────────────────────────────────────────

function DashboardView() {
  const [data, setData]     = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Dashboard>('/onboarding/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Skeleton rows={4} />;

  const { summary, active } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total planos',       value: summary.total },
          { label: 'Em progresso',       value: summary.byStatus['IN_PROGRESS'] ?? 0, color: 'text-blue-600' },
          { label: 'Tarefas atrasadas',  value: summary.overdueTasks, color: summary.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Satisfação média',   value: summary.avgSurveyScore > 0 ? `${summary.avgSurveyScore}/5` : '—', color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div key={status} className={`rounded-xl px-3 py-2 text-center ${cfg.cls.replace('text-', 'bg-').replace('-700', '-50').replace('-500', '-50')}`}>
            <div className="text-lg font-bold font-mono">{summary.byStatus[status] ?? 0}</div>
            <div className={`text-xs font-medium ${cfg.cls.split(' ')[1]}`}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Colaboradores activos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Onboardings activos
        </div>
        {active.map(plan => (
          <div key={plan.id} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <Avatar name={plan.user.fullName} avatarUrl={plan.user.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{plan.user.fullName}</div>
              <div className="text-xs text-gray-400">{plan.user.position?.name ?? '—'} · {plan.user.department?.name}</div>
              <div className="mt-1">
                <ProgressBar pct={plan.progress ?? 0} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400">Dia {plan.daysIn ?? 0}</div>
              <div className="text-sm font-mono font-medium text-gray-800">{plan.progress}%</div>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CFG[plan.status].cls}`}>
                {STATUS_CFG[plan.status].label}
              </span>
            </div>
          </div>
        ))}
        {active.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400">Sem onboardings activos</div>
        )}
      </div>
    </div>
  );
}

// ─── View: Templates ──────────────────────────────────────────────────────────

function TemplatesView() {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any[]>('/onboarding/templates')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map(t => (
        <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">{t.name}</div>
              {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${t.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              {t.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
            <span>📅 {t.durationDays} dias</span>
            <span>📋 {t._count?.tasks ?? 0} tarefas</span>
            <span>👥 {t._count?.plans ?? 0} planos</span>
            {t.position  && <span>💼 {t.position.name}</span>}
            {t.department && <span>🏢 {t.department.name}</span>}
          </div>

          {t.tasks && t.tasks.length > 0 && (
            <div className="space-y-1">
              {t.tasks.slice(0, 3).map((task: any) => {
                const catCfg = CATEGORY_CFG[task.category as TaskCategory];
                return (
                  <div key={task.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{catCfg?.icon ?? '•'}</span>
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-amber-500">+{task.xpReward}xp</span>
                  </div>
                );
              })}
              {t.tasks.length > 3 && (
                <div className="text-xs text-gray-400">+{t.tasks.length - 3} mais tarefas…</div>
              )}
            </div>
          )}
        </div>
      ))}
      {data.length === 0 && (
        <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem templates configurados
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'my-plan',   label: '🚀 O meu onboarding' },
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'templates', label: '📋 Templates' },
];

const TITLES: Record<View, string> = {
  'my-plan':  'O meu Plano de Onboarding',
  dashboard:  'Dashboard de Onboarding',
  templates:  'Templates de Onboarding',
};

export default function OnboardingPage() {
  const [view, setView] = useState<View>('my-plan');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Integração de Colaboradores</p>
        </div>
        {view === 'templates' && (
          <button
            onClick={() => alert('Abrir formulário de criação de template')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo template
          </button>
        )}
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

      {view === 'my-plan'   && <MyPlanView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'templates' && <TemplatesView />}
    </div>
  );
}
