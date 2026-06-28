'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type CycleStatus   = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
type ReviewStatus  = 'DRAFT' | 'PENDING_SELF' | 'PENDING_MANAGER' | 'PENDING_360' | 'CALIBRATION' | 'PUBLISHED' | 'DISPUTE' | 'FINALIZED';
type ReviewType    = 'SELF' | 'MANAGER' | 'PEER' | 'R360';
type GoalStatus    = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETED';
type FeedbackType  = 'PRAISE' | 'IMPROVEMENT' | 'GENERAL';
type PerfCategory  = 'LOW' | 'MEDIUM' | 'HIGH';

interface Cycle {
  id: number;
  name: string;
  type: string;
  status: CycleStatus;
  startDate: string;
  endDate: string;
  selfEvalDeadline: string | null;
  managerEvalDeadline: string | null;
  goalsWeight: number;
  competenciesWeight: number;
  behaviorsWeight: number;
  scoreScale: number;
  _count: { reviews: number };
}

interface Review {
  id: number;
  userId: number;
  cycleId: number;
  type: ReviewType;
  status: ReviewStatus;
  score: number | null;
  potentialScore: number | null;
  feedback: string | null;
  category: PerfCategory | null;
  submittedAt: string | null;
  createdAt: string;
  user: { id: number; fullName: string; email: string; position: { name: string } | null };
  reviewer: { id: number; fullName: string } | null;
  cycle: { id: number; name: string; type: string };
}

interface Goal {
  id: number;
  userId: number;
  cycleId: number;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  progress: number;
  weight: number;
  unit: string | null;
  status: GoalStatus;
  dueDate: string | null;
}

interface Feedback {
  id: number;
  type: FeedbackType;
  message: string;
  visibleToUser: boolean;
  createdAt: string;
  giver: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
}

interface TeamMember {
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
  latestReview: Review | null;
  avgGoalProgress: number;
  goalCount: number;
  feedbackCount: number;
  pendingSelfReview: boolean;
  status: string;
}

interface Analytics {
  totalReviews: number;
  avgScore: number;
  minScore: number | null;
  maxScore: number | null;
  byCategory: Array<{ category: string; _count: number }>;
  byStatus:   Array<{ status:   string; _count: number }>;
  topPerformers: Review[];
  highDivergences: Array<{ userId: number; divergence: number }>;
}

interface NineBoxGrid {
  grid: Record<string, Array<{ user: any; placement: any }>>;
  cycleId: number | null;
}

type View = 'dashboard' | 'team' | 'matrix9box' | 'analytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d: string | null): boolean {
  return !!d && new Date() > new Date(d);
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReviewStatus }) {
  const cfg: Record<ReviewStatus, { label: string; cls: string }> = {
    DRAFT:            { label: 'Rascunho',        cls: 'bg-gray-100 text-gray-500' },
    PENDING_SELF:     { label: 'Autoavaliação',   cls: 'bg-amber-50 text-amber-700' },
    PENDING_MANAGER:  { label: 'Gestor pendente', cls: 'bg-blue-50 text-blue-700' },
    PENDING_360:      { label: '360° pendente',   cls: 'bg-purple-50 text-purple-700' },
    CALIBRATION:      { label: 'Calibração',      cls: 'bg-orange-50 text-orange-700' },
    PUBLISHED:        { label: 'Publicado',       cls: 'bg-emerald-50 text-emerald-700' },
    DISPUTE:          { label: 'Disputa',         cls: 'bg-red-50 text-red-700' },
    FINALIZED:        { label: 'Finalizado',      cls: 'bg-gray-100 text-gray-600' },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{label}
    </span>
  );
}

function CategoryBadge({ category }: { category: PerfCategory | null }) {
  if (!category) return null;
  const cfg: Record<PerfCategory, { label: string; cls: string }> = {
    HIGH:   { label: 'Alto desempenho', cls: 'bg-emerald-100 text-emerald-800' },
    MEDIUM: { label: 'Médio',           cls: 'bg-amber-100 text-amber-800' },
    LOW:    { label: 'Baixo',           cls: 'bg-red-100 text-red-800' },
  };
  const { label, cls } = cfg[category];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const cfg: Record<GoalStatus, { label: string; cls: string }> = {
    ON_TRACK:  { label: 'No prazo',    cls: 'bg-emerald-50 text-emerald-700' },
    AT_RISK:   { label: 'Em risco',    cls: 'bg-amber-50 text-amber-700' },
    OFF_TRACK: { label: 'Atrasado',    cls: 'bg-red-50 text-red-700' },
    COMPLETED: { label: 'Concluído',   cls: 'bg-blue-50 text-blue-700' },
  };
  const { label, cls } = cfg[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
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

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 flex-shrink-0">{pct}%</span>
    </div>
  );
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── View: My Dashboard ───────────────────────────────────────────────────────

function MyDashboard() {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const historyQ = useApiQuery<any>(queryKeys.performance.my(), '/performance/my', { staleTime: STALE_TIME.DYNAMIC });
  const cycleQ = useApiQuery<Cycle | null>(queryKeys.performance.currentCycle(), '/performance/cycles/current', { staleTime: STALE_TIME.SEMI_STATIC, retry: false });
  const history = historyQ.data ?? null;
  const cycle = cycleQ.data ?? null;
  const loading = historyQ.isLoading;

  const handleCreateGoal = async () => {
    if (!newGoalTitle || !newGoalTarget || !cycle) return;
    setCreatingGoal(true);
    try {
      await apiClient.post('/performance/goals', { userId: 0, cycleId: cycle.id, title: newGoalTitle, targetValue: parseFloat(newGoalTarget) });
      await historyQ.refetch();
      setNewGoalTitle(''); setNewGoalTarget('');
    } catch (e: any) { alert(e.message); }
    finally { setCreatingGoal(false); }
  };

  const handleUpdateProgress = async (goalId: number, currentValue: number) => {
    try {
      await apiClient.patch(`/performance/goals/${goalId}/progress`, { currentValue });
      await historyQ.refetch();
    } catch (e: any) { alert(e.message); }
  };

  const handleFeedback = async () => {
    if (!feedbackMsg || !feedbackTarget) return;
    setSendingFeedback(true);
    try {
      await apiClient.post('/performance/feedback', {
        targetUserId: parseInt(feedbackTarget),
        type: 'PRAISE', message: feedbackMsg,
        cycleId: cycle?.id,
      });
      setFeedbackMsg(''); setFeedbackTarget('');
      alert('Feedback enviado!');
    } catch (e: any) { alert(e.message); }
    finally { setSendingFeedback(false); }
  };

  if (loading) return <Skeleton />;
  if (!history) return null;

  const pendingReviews = history.reviews.filter((r: Review) => ['PENDING_SELF', 'PENDING_MANAGER'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Ciclo activo */}
      {cycle && (
        <div className="bg-blue-700 text-white rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-blue-200 mb-1">Ciclo activo</div>
              <div className="text-lg font-semibold">{cycle.name}</div>
              <div className="text-xs text-blue-200 mt-1">
                {fmtDate(cycle.startDate)} → {fmtDate(cycle.endDate)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200">Score médio</div>
              <div className="text-3xl font-bold">{history.avgScore}</div>
            </div>
          </div>
          {cycle.selfEvalDeadline && (
            <div className={`mt-3 text-xs px-3 py-1.5 rounded-lg inline-block ${isOverdue(cycle.selfEvalDeadline) ? 'bg-red-500' : 'bg-blue-600'}`}>
              {isOverdue(cycle.selfEvalDeadline) ? '⚠ Autoavaliação em atraso' : `Autoavaliação: ${fmtDate(cycle.selfEvalDeadline)}`}
            </div>
          )}
        </div>
      )}

      {/* Reviews pendentes */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">⏳ Avaliações pendentes</div>
          {pendingReviews.map((r: Review) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-amber-900">{r.cycle.name}</div>
                <StatusBadge status={r.status} />
              </div>
              <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700">
                Completar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Avaliações',         value: history.reviews.length },
          { label: 'Goals activos',      value: history.goals.length },
          { label: 'Score médio',        value: history.avgScore, color: 'text-blue-600' },
          { label: 'Feedbacks recebidos',value: history.feedback.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">Os meus Goals</div>
          </div>
          <div className="space-y-2">
            {history.goals.map((g: Goal) => (
              <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{g.title}</div>
                    <GoalStatusBadge status={g.status} />
                  </div>
                  <div className="text-xs text-gray-400">{g.currentValue}/{g.targetValue} {g.unit}</div>
                </div>
                <ProgressBar
                  pct={g.progress}
                  color={g.status === 'COMPLETED' ? 'bg-emerald-500' : g.status === 'OFF_TRACK' ? 'bg-red-500' : 'bg-blue-500'}
                />
                {g.dueDate && (
                  <div className={`text-xs mt-1 ${isOverdue(g.dueDate) ? 'text-red-600' : 'text-gray-400'}`}>
                    {isOverdue(g.dueDate) ? '⚠ Prazo expirado' : `Prazo: ${fmtDate(g.dueDate)}`}
                  </div>
                )}
              </div>
            ))}
            {/* Criar goal */}
            {cycle && (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-2">Novo goal</div>
                <input
                  type="text"
                  placeholder="Título do goal"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Valor alvo"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateGoal}
                    disabled={!newGoalTitle || !newGoalTarget || creatingGoal}
                    className="px-3 py-2 bg-blue-700 text-white text-xs rounded-lg disabled:opacity-50"
                  >
                    {creatingGoal ? '…' : 'Criar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback recebido */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">Feedback recebido</div>
          <div className="space-y-2">
            {history.feedback.map((f: Feedback) => (
              <div key={f.id} className={`border rounded-xl p-4 ${f.type === 'PRAISE' ? 'border-emerald-200 bg-emerald-50' : f.type === 'IMPROVEMENT' ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={f.giver.fullName} avatarUrl={f.giver.avatarUrl} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-800">{f.giver.fullName}</span>
                      <span className={`text-xs px-1.5 rounded ${f.type === 'PRAISE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {f.type === 'PRAISE' ? '👏 Reconhecimento' : '💡 Melhoria'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{f.message}</p>
                    <div className="text-xs text-gray-400 mt-1">{fmtDate(f.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Dar feedback */}
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-2">Dar feedback a colega</div>
              <input
                type="number"
                placeholder="ID do colega"
                value={feedbackTarget}
                onChange={e => setFeedbackTarget(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Escreva o feedback…"
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <button
                onClick={handleFeedback}
                disabled={!feedbackMsg || !feedbackTarget || sendingFeedback}
                className="w-full py-2 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {sendingFeedback ? 'A enviar…' : '📤 Enviar feedback'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Team Performance ───────────────────────────────────────────────────

function TeamView() {
  const dataQ = useApiQuery<{ team: TeamMember[]; total: number }>(queryKeys.performance.team(), '/performance/team', { staleTime: STALE_TIME.DYNAMIC });
  const cycleQ = useApiQuery<Cycle | null>(queryKeys.performance.currentCycle(), '/performance/cycles/current', { staleTime: STALE_TIME.SEMI_STATIC, retry: false });
  const data = dataQ.data ?? null;
  const cycle = cycleQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-gray-500">{data.total} membros na equipa</div>
        {cycle && <div className="text-xs text-gray-400">Ciclo: {cycle.name}</div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_100px_120px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div>
          <div>Goals (%)</div>
          <div>Score</div>
          <div>Estado</div>
          <div>Pendências</div>
        </div>

        {data.team.map(member => (
          <div key={member.user.id} className="grid grid-cols-[1fr_120px_120px_100px_120px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Avatar name={member.user.fullName} avatarUrl={member.user.avatarUrl} size="sm" />
              <div>
                <div className="text-sm font-medium text-gray-900">{member.user.fullName}</div>
                <div className="text-xs text-gray-400">{member.user.position?.name ?? '—'}</div>
              </div>
            </div>
            <div>
              <ProgressBar
                pct={member.avgGoalProgress}
                color={member.avgGoalProgress >= 75 ? 'bg-emerald-500' : member.avgGoalProgress >= 40 ? 'bg-amber-500' : 'bg-red-500'}
              />
            </div>
            <div className="text-sm font-mono font-medium text-gray-900">
              {member.latestReview?.score !== null && member.latestReview?.score !== undefined
                ? member.latestReview.score
                : '—'}
              {member.latestReview?.category && <CategoryBadge category={member.latestReview.category} />}
            </div>
            <div>
              <StatusBadge status={(member.latestReview?.status ?? 'DRAFT') as ReviewStatus} />
            </div>
            <div>
              {member.pendingSelfReview && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                  ⏳ Self pendente
                </span>
              )}
              {!member.pendingSelfReview && member.status === 'NOT_STARTED' && (
                <span className="text-xs text-gray-400">Não iniciado</span>
              )}
            </div>
          </div>
        ))}

        {data.team.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Sem membros de equipa</div>
        )}
      </div>
    </div>
  );
}

// ─── View: 9-Box Matrix ───────────────────────────────────────────────────────

const BOX_LABELS: Record<string, { label: string; cls: string; desc: string }> = {
  '3-3': { label: 'Estrela',          cls: 'bg-emerald-100 border-emerald-300', desc: 'Alto potencial, alto desempenho' },
  '3-2': { label: 'Alto Desempenho',  cls: 'bg-emerald-50 border-emerald-200',  desc: 'Alto desempenho, potencial médio' },
  '3-1': { label: 'Sólido',           cls: 'bg-blue-50 border-blue-200',        desc: 'Alto desempenho, baixo potencial' },
  '2-3': { label: 'Potencial',        cls: 'bg-amber-50 border-amber-200',      desc: 'Médio desempenho, alto potencial' },
  '2-2': { label: 'Núcleo',           cls: 'bg-gray-50 border-gray-200',        desc: 'Médio desempenho e potencial' },
  '2-1': { label: 'A Desenvolver',    cls: 'bg-orange-50 border-orange-200',    desc: 'Médio desempenho, baixo potencial' },
  '1-3': { label: 'Enigma',           cls: 'bg-purple-50 border-purple-200',    desc: 'Baixo desempenho, alto potencial' },
  '1-2': { label: 'Questionar',       cls: 'bg-red-50 border-red-200',          desc: 'Baixo desempenho, potencial médio' },
  '1-1': { label: 'Subutilizado',     cls: 'bg-red-100 border-red-300',         desc: 'Baixo desempenho e potencial' },
};

function NineBoxView() {
  const { data, isLoading: loading } = useApiQuery<NineBoxGrid>(
    queryKeys.performance.nineBox(), '/performance/9box', { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  return (
    <div>
      <div className="text-sm text-gray-500 mb-5">
        Matriz de desempenho × potencial. Eixo X = Performance (1-3), Eixo Y = Potencial (1-3).
      </div>

      {/* Eixo Y label */}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between items-center w-6 py-2">
          {['Alto', 'Médio', 'Baixo'].map(l => (
            <div key={l} className="text-xs text-gray-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{l} Potencial</div>
          ))}
        </div>

        <div className="flex-1">
          {/* Grid 3×3 — Y (potencial) decrescente, X (performance) crescente */}
          {[3, 2, 1].map(pot => (
            <div key={pot} className="flex gap-2 mb-2">
              {[1, 2, 3].map(perf => {
                const key  = `${perf}-${pot}`;
                const box  = BOX_LABELS[key];
                const items = data.grid[key] ?? [];
                return (
                  <div key={key} className={`flex-1 min-h-[140px] border rounded-xl p-3 ${box?.cls ?? 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs font-semibold text-gray-700 mb-1">{box?.label}</div>
                    <div className="text-xs text-gray-400 mb-2">{box?.desc}</div>
                    <div className="space-y-1">
                      {items.map((item: any) => (
                        <div key={item.user.id} className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm">
                          <Avatar name={item.user.fullName} avatarUrl={item.user.avatarUrl} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{item.user.fullName}</div>
                            <div className="text-xs text-gray-400 truncate">{item.user.position?.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-300 mt-2">{items.length} pessoas</div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Eixo X labels */}
          <div className="flex gap-2 mt-1">
            {['Baixo', 'Médio', 'Alto'].map(l => (
              <div key={l} className="flex-1 text-center text-xs text-gray-400">{l} Desempenho</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Analytics ─────────────────────────────────────────────────────────

function AnalyticsView() {
  const { data, isLoading: loading } = useApiQuery<Analytics>(
    queryKeys.performance.analytics(), '/performance/analytics', { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const categoryColors: Record<string, string> = {
    HIGH: 'bg-emerald-500', MEDIUM: 'bg-amber-500', LOW: 'bg-red-500',
  };

  const total = data.byCategory.reduce((s, c) => s + c._count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de reviews', value: data.totalReviews },
          { label: 'Score médio',      value: data.avgScore,    color: 'text-blue-600' },
          { label: 'Score mínimo',     value: data.minScore ?? '—' },
          { label: 'Score máximo',     value: data.maxScore ?? '—', color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Distribuição por categoria */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">Distribuição de desempenho</div>
        {data.byCategory.map(cat => {
          const pct = Math.round((cat._count / total) * 100);
          return (
            <div key={cat.category} className="flex items-center gap-3 mb-3 last:mb-0">
              <div className="w-20 text-xs text-gray-600 font-medium">{
                cat.category === 'HIGH' ? 'Alto' : cat.category === 'MEDIUM' ? 'Médio' : 'Baixo'
              }</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${categoryColors[cat.category] ?? 'bg-gray-400'} rounded-lg flex items-center pl-2`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 15 && <span className="text-xs text-white font-medium">{pct}%</span>}
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500 w-16 text-right">{cat._count} pessoas</div>
            </div>
          );
        })}
      </div>

      {/* Top performers */}
      {data.topPerformers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Top performers
          </div>
          {data.topPerformers.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">{idx + 1}</span>
              <Avatar name={r.user.fullName} avatarUrl={undefined} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{r.user.fullName}</div>
                <div className="text-xs text-gray-400">{r.user.position?.name ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-blue-700">{r.score}</div>
                {r.category && <CategoryBadge category={r.category} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Divergências */}
      {data.highDivergences.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-3">
            ⚠ Divergências self vs gestor ≥ 1 ponto ({data.highDivergences.length} casos)
          </div>
          {data.highDivergences.map(d => (
            <div key={d.userId} className="flex justify-between py-1.5 border-b border-amber-100 last:border-0 text-xs">
              <span className="text-amber-800">User #{d.userId}</span>
              <span className="font-mono font-bold text-amber-700">{d.divergence} pontos</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard',  label: 'O meu desempenho' },
  { id: 'team',       label: 'A minha equipa' },
  { id: 'matrix9box', label: '9-Box Matrix' },
  { id: 'analytics',  label: 'Analytics' },
];

const TITLES: Record<View, string> = {
  dashboard:  'O meu Desempenho',
  team:       'Performance da Equipa',
  matrix9box: 'Matriz 9-Box',
  analytics:  'Analytics de Performance',
};

export default function PerformancePage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Performance</p>
        </div>
      </div>

      {/* Tabs */}
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

      {view === 'dashboard'  && <MyDashboard />}
      {view === 'team'       && <TeamView />}
      {view === 'matrix9box' && <NineBoxView />}
      {view === 'analytics'  && <AnalyticsView />}
    </div>
  );
}
