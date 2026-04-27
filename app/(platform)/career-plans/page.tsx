'use client';

// ─── app/(dashboard)/career-plans/page.tsx ───────────────────────────────────
// INNOVA — Módulo de Planos de Carreira
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Star, Target, CheckCircle2, Clock, ChevronRight,
  Plus, RefreshCcw, ArrowUpRight, Users, BarChart3, Briefcase,
  BookOpen, Zap, Award, AlertCircle, Loader2, X, Check,
  ChevronDown, Flame, MapPin, Compass,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadinessLevel = 'READY' | 'DEVELOPING' | 'STARTING';
type GoalStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type GoalType = 'COURSE' | 'PROJECT' | 'MENTORING' | 'CERTIFICATION' | 'SKILL' | 'OTHER';

interface SkillGap {
  skillId: number; skillName: string; skillType: string;
  currentLevel: number; requiredLevel: number; gap: number;
  weight: number; mandatory: boolean;
}

interface Readiness {
  score: number; readinessLevel: ReadinessLevel; readinessEmoji: string;
  targetRoleName: string; skillGaps: SkillGap[]; missingSkills: SkillGap[];
  metRequirements: number; totalRequirements: number;
  recommendedCourses: Array<{ id: number; title: string }>;
}

interface CareerGoal {
  id: number; title: string; type: GoalType; status: GoalStatus;
  progress: number; dueDate?: string; skillId?: number;
}

interface CareerPlan {
  id: number; userId: number; title: string; status: string;
  targetDate?: string; readiness?: Readiness;
  currentRole?: { id: number; name: string; level: number };
  targetRole?: { id: number; name: string; level: number };
  careerPath?: { id: number; name: string; type: string; steps: Array<{ order: number; role: { id: number; name: string; level: number } }> };
  goals: CareerGoal[];
  mentor?: { id: number; name: string };
}

interface Role {
  id: number; name: string; department: string; level: number; seniority?: string;
  skillRequirements?: Array<{ skill: { name: string; type: string }; requiredLevel: number; mandatory: boolean }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const READINESS_CONFIG: Record<ReadinessLevel, { label: string; color: string; bg: string; bar: string }> = {
  READY:      { label: 'Pronto',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
  DEVELOPING: { label: 'Em Desenvolvimento',color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   bar: 'bg-amber-500'   },
  STARTING:   { label: 'Início',           color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       bar: 'bg-red-400'     },
};

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  COURSE: 'Curso', PROJECT: 'Projecto', MENTORING: 'Mentoria',
  CERTIFICATION: 'Certificação', SKILL: 'Skill', OTHER: 'Outro',
};

const GOAL_TYPE_ICONS: Record<GoalType, any> = {
  COURSE: BookOpen, PROJECT: Briefcase, MENTORING: Users,
  CERTIFICATION: Award, SKILL: Zap, OTHER: Target,
};

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('innova_token') : null;
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  return res.json();
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function ReadinessBar({ score, level }: { score: number; level: ReadinessLevel }) {
  const cfg = READINESS_CONFIG[level];
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${score}%` }}/>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color = 'blue', sub }: {
  label: string; value: string|number; icon: any; color?: string; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}><Icon size={18}/></div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Career Roadmap ───────────────────────────────────────────────────────────

function CareerRoadmap({ plan }: { plan: CareerPlan }) {
  const steps = plan.careerPath?.steps ?? [];
  if (!steps.length) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
        <Compass size={16}/> Nenhuma trilha de carreira associada
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const isCurrent = plan.currentRole?.id === step.role.id;
        const isTarget  = plan.targetRole?.id === step.role.id;
        const isPast    = step.role.level < (plan.currentRole?.level ?? 0);

        return (
          <div key={step.order} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex flex-col items-center`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isCurrent ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' :
                isTarget  ? 'bg-emerald-100 text-emerald-700 border-emerald-400 border-dashed' :
                isPast    ? 'bg-gray-200 text-gray-500 border-gray-200' :
                'bg-white text-gray-400 border-gray-200'
              }`}>
                {isPast ? <Check size={14}/> : <span>{step.role.level}</span>}
              </div>
              <p className={`text-xs mt-1 font-medium text-center max-w-16 truncate ${isCurrent ? 'text-blue-600' : isTarget ? 'text-emerald-600' : 'text-gray-400'}`}>
                {step.role.name}
              </p>
              {(isCurrent || isTarget) && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {isCurrent ? 'Actual' : 'Alvo'}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-[-12px]"/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Gaps ───────────────────────────────────────────────────────────────

function SkillGapList({ gaps, mandatory }: { gaps: SkillGap[]; mandatory?: boolean }) {
  if (!gaps.length) return null;
  return (
    <div className="space-y-2">
      {gaps.map(g => (
        <div key={g.skillId} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-700 font-medium">{g.skillName}</span>
              <span className="text-xs text-gray-400">{g.currentLevel}/{g.requiredLevel}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${mandatory ? 'bg-red-400' : 'bg-amber-400'}`}
                style={{ width: `${(g.currentLevel / g.requiredLevel) * 100}%` }}/>
            </div>
          </div>
          <span className="text-xs text-gray-400 w-12 text-right">-{g.gap} nível{g.gap > 1 ? 'is' : ''}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onUpdateProgress }: {
  goal: CareerGoal; onUpdateProgress: (id: number, progress: number) => void;
}) {
  const Icon = GOAL_TYPE_ICONS[goal.type] ?? Target;
  const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && goal.status !== 'COMPLETED';

  const statusColors = {
    PENDING:     'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED:   'bg-emerald-100 text-emerald-700',
    CANCELLED:   'bg-red-100 text-red-500',
  };

  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${isOverdue ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl flex-shrink-0 ${goal.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
          {goal.status === 'COMPLETED' ? <CheckCircle2 size={15}/> : <Icon size={15}/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[goal.status]}`}>
              {goal.status === 'PENDING' ? 'Pendente' : goal.status === 'IN_PROGRESS' ? 'Em curso' : goal.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{GOAL_TYPE_LABELS[goal.type]}</span>
            {goal.dueDate && (
              <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                · {new Date(goal.dueDate).toLocaleDateString('pt-PT')}
                {isOverdue && ' ⚠️'}
              </span>
            )}
          </div>
          {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progresso</span><span>{goal.progress}%</span>
              </div>
              <input type="range" min="0" max="100" value={goal.progress}
                onChange={e => onUpdateProgress(goal.id, +e.target.value)}
                className="w-full h-1.5 rounded-full accent-blue-600"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simulate Modal ───────────────────────────────────────────────────────────

function SimulateModal({ userId, roles, onClose }: {
  userId: number; roles: Role[]; onClose: () => void;
}) {
  const [targetRoleId, setTargetRoleId] = useState(0);
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const simulate = async () => {
    if (!targetRoleId) { setError('Seleccione um cargo alvo'); return; }
    setLoading(true); setError('');
    try { setResult(await apiFetch('/career-plans/simulate', { method: 'POST', body: JSON.stringify({ userId, targetRoleId }) })); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const readinessCfg = result ? READINESS_CONFIG[result.readiness.readinessLevel as ReadinessLevel] : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Compass size={18} className="text-blue-600"/> Simulador de Carreira</h2>
            <p className="text-sm text-gray-500 mt-0.5">Veja o que é necessário para chegar ao próximo nível</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cargo Alvo</label>
            <select value={targetRoleId} onChange={e => { setTargetRoleId(+e.target.value); setResult(null); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value={0}>Seleccionar...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name} — {r.department} (Nível {r.level})</option>)}
            </select>
          </div>

          <button onClick={simulate} disabled={loading || !targetRoleId}
            className="w-full py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
            {loading ? <Loader2 size={15} className="animate-spin"/> : <Zap size={15}/>} Simular
          </button>

          {result && readinessCfg && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className={`p-4 rounded-2xl border ${readinessCfg.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{result.readiness.readinessEmoji} Prontidão para "{result.targetRole.name}"</p>
                  <span className={`text-xl font-bold ${readinessCfg.color}`}>{result.readiness.score}%</span>
                </div>
                <ReadinessBar score={result.readiness.score} level={result.readiness.readinessLevel}/>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-gray-400">Estimativa</p>
                    <p className="font-bold text-gray-900 mt-0.5">{result.estimatedMonths} meses</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-gray-400">Data prevista</p>
                    <p className="font-bold text-gray-900 mt-0.5">{new Date(result.estimatedDate).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {result.readiness.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 mb-2">Skills Obrigatórias em Falta</p>
                  <SkillGapList gaps={result.readiness.missingSkills} mandatory/>
                </div>
              )}

              {result.readiness.skillGaps.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-600 mb-2">Gaps a Desenvolver</p>
                  <SkillGapList gaps={result.readiness.skillGaps}/>
                </div>
              )}

              {result.recommendedActions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">Cursos Recomendados</p>
                  <div className="space-y-1.5">
                    {result.recommendedActions.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm text-blue-700 hover:underline cursor-pointer">
                        <BookOpen size={13}/>{c.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'my' | 'team' | 'analytics';

export default function CareerPlansPage() {
  const [tab, setTab]             = useState<TabKey>('my');
  const [myPlan, setMyPlan]       = useState<CareerPlan | null>(null);
  const [roles, setRoles]         = useState<Role[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plan, roleList] = await Promise.allSettled([
        apiFetch<CareerPlan | null>('/career-plans/my'),
        apiFetch<Role[]>('/career-plans/roles'),
      ]);
      if (plan.status === 'fulfilled')     setMyPlan(plan.value);
      if (roleList.status === 'fulfilled') setRoles(roleList.value);

      // Buscar userId do token
      const token = typeof window !== 'undefined' ? localStorage.getItem('innova_token') : null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.sub ?? 0);
        } catch {}
      }
    } finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try { setAnalytics(await apiFetch('/career-plans/analytics')); }
    catch {}
  }, []);

  useEffect(() => {
    loadData();
    if (tab === 'analytics') loadAnalytics();
  }, [loadData, loadAnalytics, tab]);

  const handleGoalProgress = async (goalId: number, progress: number) => {
    try {
      await apiFetch(`/career-plans/goals/${goalId}/progress`, {
        method: 'PATCH', body: JSON.stringify({ progress }),
      });
      loadData();
    } catch {}
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: 'my',        label: 'Minha Carreira', icon: Target     },
    { key: 'team',      label: 'Equipa',         icon: Users      },
    { key: 'analytics', label: 'Analytics',      icon: BarChart3  },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Planos de Carreira</h1>
            <p className="text-sm text-gray-500">Crescimento e mobilidade profissional</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSimulate(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Compass size={15}/> Simular Carreira
            </button>
            <button onClick={loadData} className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <t.icon size={15}/>{t.label}
            </button>
          ))}
        </div>

        {/* MY CAREER */}
        {tab === 'my' && (
          loading ? (
            <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : !myPlan ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Target size={48} className="mb-4 opacity-30"/>
              <p className="text-sm font-medium">Sem plano de carreira activo</p>
              <p className="text-xs mt-1">O teu gestor ou RH irá criar um plano para ti</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Plano Activo</p>
                    <h2 className="text-xl font-bold mt-1">{myPlan.title}</h2>
                    <div className="flex items-center gap-3 mt-1 text-blue-200 text-sm">
                      {myPlan.currentRole && <span>{myPlan.currentRole.name}</span>}
                      {myPlan.targetRole && <><ChevronRight size={14}/><span className="text-white font-medium">{myPlan.targetRole.name}</span></>}
                    </div>
                  </div>
                  {myPlan.readiness && (
                    <div className="text-right bg-white/10 rounded-2xl px-4 py-3">
                      <p className="text-3xl font-bold">{myPlan.readiness.score}%</p>
                      <p className="text-blue-200 text-xs mt-0.5">{myPlan.readiness.readinessEmoji} Prontidão</p>
                    </div>
                  )}
                </div>

                {myPlan.readiness && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-blue-200 mb-1">
                      <span>Progresso para "{myPlan.readiness.targetRoleName}"</span>
                      <span>{myPlan.readiness.metRequirements}/{myPlan.readiness.totalRequirements} requisitos</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${myPlan.readiness.score}%` }}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Roadmap */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Trilha de Carreira</h3>
                <CareerRoadmap plan={myPlan}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skill Gaps */}
                {myPlan.readiness && (myPlan.readiness.missingSkills.length > 0 || myPlan.readiness.skillGaps.length > 0) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Gaps a Desenvolver</h3>
                    {myPlan.readiness.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-red-600 font-semibold mb-2">Obrigatórias</p>
                        <SkillGapList gaps={myPlan.readiness.missingSkills} mandatory/>
                      </div>
                    )}
                    {myPlan.readiness.skillGaps.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-600 font-semibold mb-2">Complementares</p>
                        <SkillGapList gaps={myPlan.readiness.skillGaps.slice(0, 3)}/>
                      </div>
                    )}
                  </div>
                )}

                {/* Cursos recomendados */}
                {(myPlan.readiness?.recommendedCourses.length ?? 0) > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Cursos Recomendados</h3>
                    <div className="space-y-2">
                      {myPlan.readiness!.recommendedCourses.slice(0, 4).map(c => (
                        <div key={c.id} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                          <BookOpen size={14} className="text-blue-600 flex-shrink-0"/>
                          <span className="text-sm text-blue-800 font-medium">{c.title}</span>
                          <ArrowUpRight size={12} className="text-blue-500 ml-auto"/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Goals */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Metas do PDI</h3>
                  <div className="text-xs text-gray-400">
                    {myPlan.goals.filter(g => g.status === 'COMPLETED').length}/{myPlan.goals.length} concluídas
                  </div>
                </div>
                {myPlan.goals.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhuma meta adicionada</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myPlan.goals.map(g => (
                      <GoalCard key={g.id} goal={g} onUpdateProgress={handleGoalProgress}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TEAM */}
        {tab === 'team' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm font-medium">Vista de equipa disponível com role Gestor+</p>
            <p className="text-xs mt-1">Planos, readiness e pedidos de promoção da equipa</p>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && analytics && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Planos Activos"     value={analytics.plans.active}         icon={Target}    color="blue" />
              <KpiCard label="Concluídos"          value={analytics.plans.completed}       icon={CheckCircle2} color="emerald" />
              <KpiCard label="Promoções Aprovadas" value={analytics.promotions.approved}   icon={TrendingUp} color="violet" />
              <KpiCard label="Tempo Médio Promoção"value={`${analytics.avgPromotionDays}d`} icon={Clock} color="amber" />
            </div>
          </div>
        )}
      </div>

      {showSimulate && (
        <SimulateModal
          userId={currentUserId}
          roles={roles}
          onClose={() => setShowSimulate(false)}
        />
      )}
    </div>
  );
}