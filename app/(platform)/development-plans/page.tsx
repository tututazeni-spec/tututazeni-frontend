// src/app/(dashboard)/development-plans/page.tsx
'use client';

import { useState } from 'react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStatus   = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
type ActionType   = 'COURSE' | 'MENTORING' | 'COACHING' | 'READING' | 'PROJECT' | 'JOB_ROTATION' | 'MICROLEARNING' | 'WORKSHOP' | 'CERTIFICATION' | 'OTHER';
type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
type Priority     = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Plan {
  id: number;
  name: string;
  goal: string;
  status: PlanStatus;
  priority: Priority;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  overallProgress: number;
  actionProgress?: number;
  avgGoalProgress?: number;
  overdueActions?: number;
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  actions?: Action[];
  goals?: Goal[];
  checkpoints?: Checkpoint[];
  certificates?: any[];
  _count: { actions: number; goals: number; checkpoints: number };
}

interface Action {
  id: number;
  title: string;
  description: string | null;
  type: ActionType;
  status: ActionStatus;
  progress: number;
  xpReward: number;
  dueDate: string | null;
  completedAt: string | null;
  mandatory: boolean;
  workloadHours: number | null;
  evidence?: Evidence[];
}

interface Evidence {
  id: number;
  title: string;
  url: string | null;
  notes: string | null;
  evidenceType: string;
  createdAt: string;
}

interface Goal {
  id: number;
  title: string;
  description: string | null;
  successIndicator: string | null;
  progress: number;
  weight: number;
  dueDate: string | null;
  completedAt: string | null;
}

interface Checkpoint {
  id: number;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  selfScore: number | null;
}

interface MyStats {
  plans: { total: number; active: number; completed: number; cancelled: number };
  actions: Record<string, number>;
  completionRate: number;
  totalXp: number;
}

type View = 'my-plans' | 'detail' | 'team' | 'create';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d: string | null, status: string): boolean {
  return !!d && new Date(d) < new Date() && status !== 'COMPLETED' && status !== 'CANCELLED';
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <div className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}>
      <Image src={avatarUrl} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PlanStatus, { label: string; cls: string }> = {
  DRAFT:            { label: 'Rascunho',       cls: 'bg-gray-100 text-gray-500' },
  PENDING_APPROVAL: { label: 'Ag. aprovação',  cls: 'bg-amber-50 text-amber-700' },
  ACTIVE:           { label: 'Activo',          cls: 'bg-emerald-50 text-emerald-700' },
  COMPLETED:        { label: 'Concluído',       cls: 'bg-blue-50 text-blue-700' },
  CANCELLED:        { label: 'Cancelado',       cls: 'bg-red-50 text-red-500' },
  OVERDUE:          { label: 'Atrasado',        cls: 'bg-red-100 text-red-700' },
};

const ACTION_CFG: Record<ActionType, { icon: string; label: string; cls: string }> = {
  COURSE:       { icon: '🎓', label: 'Curso',           cls: 'bg-blue-50 text-blue-700' },
  MENTORING:    { icon: '👥', label: 'Mentoria',        cls: 'bg-purple-50 text-purple-700' },
  COACHING:     { icon: '🎯', label: 'Coaching',        cls: 'bg-amber-50 text-amber-700' },
  READING:      { icon: '📚', label: 'Leitura',         cls: 'bg-emerald-50 text-emerald-700' },
  PROJECT:      { icon: '🚀', label: 'Projecto',        cls: 'bg-red-50 text-red-700' },
  JOB_ROTATION: { icon: '🔄', label: 'Job Rotation',   cls: 'bg-orange-50 text-orange-700' },
  MICROLEARNING:{ icon: '⚡', label: 'Micro-Learning',  cls: 'bg-pink-50 text-pink-700' },
  WORKSHOP:     { icon: '🛠', label: 'Workshop',        cls: 'bg-teal-50 text-teal-700' },
  CERTIFICATION:{ icon: '🏆', label: 'Certificação',    cls: 'bg-gold-50 text-yellow-700' },
  OTHER:        { icon: '📌', label: 'Outro',           cls: 'bg-gray-100 text-gray-600' },
};

const ACTION_STATUS: Record<ActionStatus, { icon: string; cls: string; label: string }> = {
  TODO:        { icon: '○', cls: 'text-gray-400', label: 'A fazer' },
  IN_PROGRESS: { icon: '▶', cls: 'text-blue-500', label: 'Em progresso' },
  COMPLETED:   { icon: '✓', cls: 'text-emerald-500', label: 'Concluída' },
  BLOCKED:     { icon: '🔒', cls: 'text-gray-400', label: 'Bloqueada' },
  CANCELLED:   { icon: '✕', cls: 'text-red-400', label: 'Cancelada' },
};

const PRIORITY_CFG: Record<Priority, { label: string; cls: string }> = {
  LOW:    { label: 'Baixa',   cls: 'bg-gray-100 text-gray-500' },
  MEDIUM: { label: 'Média',   cls: 'bg-blue-50 text-blue-600' },
  HIGH:   { label: 'Alta',    cls: 'bg-amber-50 text-amber-700' },
  URGENT: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const statusCfg   = STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const pct         = plan.actionProgress ?? plan.overallProgress;
  const hasOverdue  = (plan.overdueActions ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all ${
        hasOverdue ? 'border-red-200' : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${priorityCfg.cls}`}>{priorityCfg.label}</span>
            {plan.period && <span className="text-xs text-gray-400">{plan.period}</span>}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">{plan.name}</div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.goal}</p>
        </div>
        <Avatar name={plan.user.fullName} avatarUrl={plan.user.avatarUrl} size="sm" />
      </div>

      <ProgressBar
        pct={pct}
        color={pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}
      />

      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
        </div>
        <div className="flex items-center gap-2">
          {hasOverdue && (
            <span className="text-red-600 font-medium">⚠ {plan.overdueActions} atrasada(s)</span>
          )}
          {plan.endDate && (
            <span className={isOverdue(plan.endDate, plan.status) ? 'text-red-600' : ''}>
              📅 {fmtDate(plan.endDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View: My Plans + Stats ───────────────────────────────────────────────────

function MyPlansView({ onSelect }: { onSelect: (id: number) => void }) {
  const plansQuery = useApiQuery<Plan[]>(
    queryKeys.developmentPlans.my(), '/development-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const statsQuery = useApiQuery<MyStats>(
    queryKeys.developmentPlans.myStats(), '/development-plans/my/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const plans = plansQuery.data ?? [];
  const stats = statsQuery.data ?? null;

  if (plansQuery.isLoading || statsQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total PDIs',      value: stats.plans.total },
            { label: 'Activos',         value: stats.plans.active,     color: 'text-emerald-600' },
            { label: 'Concluídos',      value: stats.plans.completed,  color: 'text-blue-600' },
            { label: 'XP ganho',        value: `${stats.totalXp}`,     color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
          <div className="text-4xl mb-3">🎯</div>
          Sem planos de desenvolvimento criados ainda
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map(p => <PlanCard key={p.id} plan={p} onClick={() => onSelect(p.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── View: Detail ─────────────────────────────────────────────────────────────

function DetailView({ planId, onBack }: { planId: number; onBack: () => void }) {
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'actions' | 'goals' | 'checkpoints'>('actions');

  const { data: plan, isLoading: loading, refetch } = useApiQuery<Plan>(
    queryKeys.developmentPlans.detail(planId), `/development-plans/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const handleCompleteAction = async (actionId: number, xpReward: number) => {
    setUpdatingAction(actionId);
    try {
      await apiClient.put(`/development-plans/actions/${actionId}`, { status: 'COMPLETED', progress: 100 });
      await refetch();
    } catch (e: any) { alert(e.message); }
    finally { setUpdatingAction(null); }
  };

  const handleGoalProgress = async (goalId: number, progress: number) => {
    setUpdatingGoal(goalId);
    try {
      await apiClient.patch('/development-plans/goals/progress', { goalId, progress });
      await refetch();
    } catch (e: any) { alert(e.message); }
    finally { setUpdatingGoal(null); }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.patch(`/development-plans/${planId}/submit`, {});
      await refetch();
    } catch (e: any) { alert(e.message); }
  };

  if (loading || !plan) return <Skeleton rows={5} />;

  const statusCfg   = STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const pct         = plan.actionProgress ?? plan.overallProgress;

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
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityCfg.cls}`}>{priorityCfg.label}</span>
              {plan.period && <span className="text-xs text-gray-400">{plan.period}</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h1>
            <p className="text-sm text-gray-600">{plan.goal}</p>
          </div>
          <div className="flex-shrink-0">
            {plan.status === 'DRAFT' && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
              >
                Submeter para aprovação →
              </button>
            )}
          </div>
        </div>

        {/* Progresso geral */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso geral</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <ProgressBar
            pct={pct}
            color={pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}
          />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <span>📅 Início: {fmtDate(plan.startDate)}</span>
          <span>📅 Fim: {fmtDate(plan.endDate)}</span>
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
          {plan.manager && (
            <span className="flex items-center gap-1">
              <Avatar name={plan.manager.fullName} size="sm" />
              Gestor: {plan.manager.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['actions', 'goals', 'checkpoints'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ actions: '✅ Acções', goals: '🎯 Metas', checkpoints: '📍 Checkpoints' }[t]}
          </button>
        ))}
      </div>

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {plan.actions?.map(action => {
            const typeCfg   = ACTION_CFG[action.type];
            const statusCfg = ACTION_STATUS[action.status];
            const overdue   = isOverdue(action.dueDate, action.status);
            return (
              <div
                key={action.id}
                className={`bg-white border rounded-xl p-4 ${overdue ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeCfg.cls}`}>
                    {typeCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg ${statusCfg.cls}`}>{statusCfg.icon}</span>
                      <span className={`text-sm font-medium ${action.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {action.title}
                      </span>
                      {action.mandatory && <span className="text-xs text-red-600">Obrigatória</span>}
                    </div>
                    {action.description && (
                      <p className="text-xs text-gray-500 mb-2">{action.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{typeCfg.label}</span>
                      {action.workloadHours && <span>⏱ {action.workloadHours}h</span>}
                      {action.dueDate && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {overdue ? '⚠ ' : ''}📅 {fmtDate(action.dueDate)}
                        </span>
                      )}
                      <span className="text-amber-600">+{action.xpReward} XP</span>
                      {action.evidence && action.evidence.length > 0 && (
                        <span className="text-blue-600">📎 {action.evidence.length} evidência(s)</span>
                      )}
                    </div>
                    {action.status !== 'COMPLETED' && (
                      <div className="mt-2">
                        <ProgressBar pct={action.progress} />
                      </div>
                    )}
                  </div>
                  {action.status !== 'COMPLETED' && action.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCompleteAction(action.id, action.xpReward)}
                      disabled={updatingAction === action.id}
                      className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingAction === action.id ? '…' : 'Concluir'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(!plan.actions || plan.actions.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem acções adicionadas
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {plan.goals?.map(goal => (
            <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-0.5">{goal.title}</div>
                  {goal.successIndicator && (
                    <div className="text-xs text-gray-500">📊 {goal.successIndicator}</div>
                  )}
                  {goal.dueDate && <div className="text-xs text-gray-400 mt-0.5">📅 {fmtDate(goal.dueDate)}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold font-mono text-blue-700">{goal.progress}%</div>
                  {goal.completedAt && <div className="text-xs text-emerald-600">✓ Concluída</div>}
                </div>
              </div>
              <ProgressBar pct={goal.progress} />
              {goal.progress < 100 && (
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => handleGoalProgress(goal.id, v)}
                      disabled={updatingGoal === goal.id || goal.progress >= v}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        goal.progress >= v ? 'bg-gray-100 text-gray-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      } disabled:opacity-50`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!plan.goals || plan.goals.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem metas adicionadas
            </div>
          )}
        </div>
      )}

      {/* Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-3">
          {plan.checkpoints?.map(cp => (
            <div key={cp.id} className={`flex items-center gap-4 bg-white border rounded-xl p-4 ${
              cp.status === 'COMPLETED' ? 'border-emerald-200' : 'border-gray-200'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                cp.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-blue-50'
              }`}>
                {cp.status === 'COMPLETED' ? '✅' : cp.type === 'STRUCTURED' ? '📋' : '💬'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{cp.title}</div>
                <div className="text-xs text-gray-400">
                  📅 {fmtDate(cp.scheduledAt)}
                  {cp.selfScore && <span className="ml-2">⭐ {cp.selfScore}/5</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                cp.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {cp.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
              </span>
            </div>
          ))}
          {(!plan.checkpoints || plan.checkpoints.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem checkpoints agendados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Team ────────────────────────────────────────────────────────────────

function TeamView({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: plans = [], isLoading } = useApiQuery<any[]>(
    queryKeys.developmentPlans.teamDashboard(), '/development-plans/team/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">{plans.length} planos activos na equipa</div>
      <div className="space-y-3">
        {plans.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm"
          >
            <Avatar name={p.user.fullName} avatarUrl={p.user.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
              <div className="text-xs text-gray-400">{p.user.fullName} · {p.user.position?.name ?? '—'}</div>
              <div className="mt-1">
                <ProgressBar pct={p.progress} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold font-mono text-blue-700">{p.progress}%</div>
              {p.overdueActions > 0 && (
                <div className="text-xs text-red-600">⚠ {p.overdueActions} atrasadas</div>
              )}
              {p.pendingApproval && (
                <div className="text-xs text-amber-600 font-medium">Ag. aprovação</div>
              )}
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem PDIs activos na equipa
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV = [
  { id: 'my-plans', label: '🎯 Os meus PDIs' },
  { id: 'team',     label: '👥 Equipa' },
] as const;

const TITLES: Record<View, string> = {
  'my-plans': 'Planos de Desenvolvimento',
  detail:     'Detalhe do PDI',
  team:       'PDIs da Equipa',
  create:     'Novo PDI',
};

export default function DevelopmentPlansPage() {
  const [view, setView]         = useState<View>('my-plans');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('my-plans'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Planos de Desenvolvimento Individual</p>
        </div>
        {view !== 'detail' && (
          <button
            onClick={() => alert('Abrir formulário de criação de PDI')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo PDI
          </button>
        )}
      </div>

      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id as View)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'my-plans' && <MyPlansView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <DetailView planId={selectedId} onBack={handleBack} />
      )}
      {view === 'team' && <TeamView onSelect={handleSelect} />}
    </div>
  );
}