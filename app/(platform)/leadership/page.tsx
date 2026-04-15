'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramLevel      = 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED';
type ParticipantStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'WITHDRAWN';
type HealthStatus      = 'GREEN' | 'YELLOW' | 'RED';
type Competency = 'COMMUNICATION' | 'DEVELOPMENT' | 'RECOGNITION' | 'AUTONOMY' | 'FAIRNESS' | 'EXAMPLE' | 'STRATEGY' | 'RESILIENCE';

interface LeadershipProgram {
  id: number;
  name: string;
  description: string | null;
  level: ProgramLevel;
  status: string;
  durationWeeks: number | null;
  mandatory: boolean;
  _count: { participants: number };
}

interface Participant {
  id: number;
  userId: number;
  programId: number;
  progress: number;
  status: ParticipantStatus;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null; position: { name: string } | null };
}

interface TeamMember {
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null; department: { name: string } | null };
  latestReview: { score: number | null; category: string | null; status: string } | null;
  pendingApprovals: number;
  feedbackCount: number;
  statusColor: HealthStatus;
}

interface TeamDashboard {
  team: TeamMember[];
  alerts: Array<{ userId: number; name: string; type: string; message: string }>;
  teamHealth: { globalScore: number; healthStatus: HealthStatus; metrics: any };
  total: number;
}

interface Feedback360Summary {
  leaderId: number;
  totalResponses: number;
  avgScore: number;
  byCompetency: Array<{ competency: Competency; avgScore: number; count: number; insight: string | null }>;
  qualitative: (string | null)[];
}

interface LeadershipScore {
  userId: number;
  score: number;
  classification: string;
  calculatedAt: string;
}

interface OneOnOne {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  agenda: string | null;
  meetingUrl: string | null;
  subordinate: { id: number; fullName: string; avatarUrl: string | null };
}

interface KudosItem {
  id: number;
  message: string;
  badge: string | null;
  createdAt: string;
  sender: { id: number; fullName: string; avatarUrl: string | null };
  receiver: { id: number; fullName: string; avatarUrl: string | null };
}

interface RankingEntry {
  userId: number;
  score: number;
  classification: string;
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
}

type View = 'my-dashboard' | 'team' | 'programs' | 'feedback360' | 'ranking' | 'kudos';

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

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<ProgramLevel, { label: string; cls: string }> = {
  INITIAL:      { label: 'Inicial',      cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio',   cls: 'bg-amber-50 text-amber-700' },
  ADVANCED:     { label: 'Avançado',     cls: 'bg-red-50 text-red-700' },
};

const HEALTH_CFG: Record<HealthStatus, { label: string; dot: string; cls: string }> = {
  GREEN:  { label: 'Bom',    dot: 'bg-emerald-500', cls: 'text-emerald-700' },
  YELLOW: { label: 'Atenção',dot: 'bg-amber-500',   cls: 'text-amber-700' },
  RED:    { label: 'Crítico',dot: 'bg-red-500',     cls: 'text-red-700' },
};

const CLASS_CFG: Record<string, { label: string; cls: string }> = {
  TOP_10:        { label: '🏆 Top 10%',      cls: 'bg-amber-100 text-amber-800' },
  ABOVE_AVERAGE: { label: '⬆ Acima da média',cls: 'bg-emerald-50 text-emerald-700' },
  AVERAGE:       { label: '= Médio',         cls: 'bg-gray-100 text-gray-600' },
  BELOW_AVERAGE: { label: '⬇ Abaixo',        cls: 'bg-orange-50 text-orange-700' },
  CRITICAL:      { label: '🔴 Crítico',      cls: 'bg-red-100 text-red-800' },
};

const COMP_LABELS: Record<Competency, string> = {
  COMMUNICATION: 'Comunicação',
  DEVELOPMENT:   'Desenvolvimento',
  RECOGNITION:   'Reconhecimento',
  AUTONOMY:      'Autonomia',
  FAIRNESS:      'Equidade',
  EXAMPLE:       'Exemplo',
  STRATEGY:      'Estratégia',
  RESILIENCE:    'Resiliência',
};

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

// ─── View: My Dashboard ───────────────────────────────────────────────────────

function MyDashboardView() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTarget, setKudosTarget] = useState('');
  const [sendingKudos, setSendingKudos] = useState(false);

  useEffect(() => {
    apiFetch<any>('/leadership/my/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleKudos = async () => {
    if (!kudosMsg || !kudosTarget) return;
    setSendingKudos(true);
    try {
      await apiFetch('/leadership/kudos', {
        method: 'POST',
        body: JSON.stringify({ receiverId: parseInt(kudosTarget), message: kudosMsg, badge: '⭐' }),
      });
      setKudosMsg(''); setKudosTarget('');
      alert('Kudos enviados! 🎉');
    } catch (e: any) { alert(e.message); }
    finally { setSendingKudos(false); }
  };

  if (loading) return <Skeleton />;
  if (!data) return null;

  const score: LeadershipScore | null = data.score;
  const classCfg = score ? (CLASS_CFG[score.classification] ?? CLASS_CFG.AVERAGE) : null;

  return (
    <div className="space-y-6">
      {/* Score card */}
      {score && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-200 mb-1">Leadership Score</div>
            <div className="text-5xl font-bold font-mono">{score.score}</div>
            <div className="text-sm text-blue-200 mt-1">de 1000 pontos</div>
          </div>
          <div className="text-right">
            {classCfg && (
              <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 text-white`}>
                {classCfg.label}
              </span>
            )}
            <div className="text-xs text-blue-300 mt-2">Actualizado {fmtDate(score.calculatedAt)}</div>
          </div>
        </div>
      )}

      {!score && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          Sem Leadership Score calculado ainda
        </div>
      )}

      {/* Grid: programas + 1:1s */}
      <div className="grid grid-cols-2 gap-5">
        {/* Programas */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">Os meus programas</div>
          <div className="space-y-2">
            {data.programs?.slice(0, 4).map((p: any) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-900 truncate">{p.program?.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${LEVEL_CFG[p.program?.level as ProgramLevel]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                    {LEVEL_CFG[p.program?.level as ProgramLevel]?.label ?? p.program?.level}
                  </span>
                </div>
                <ProgressBar
                  pct={p.progress}
                  color={p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}
                />
                <div className="text-xs text-gray-400 mt-1">{p.status}</div>
              </div>
            ))}
            {(!data.programs || data.programs.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem programas inscritos
              </div>
            )}
          </div>
        </div>

        {/* 1:1s próximos */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">Próximos 1:1s</div>
          <div className="space-y-2">
            {data.upcoming1on1s?.map((m: OneOnOne) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <Avatar name={m.subordinate.fullName} avatarUrl={m.subordinate.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{m.subordinate.fullName}</div>
                  <div className="text-xs text-gray-400">{fmtDate(m.scheduledAt)} · {m.durationMinutes}min</div>
                </div>
                {m.meetingUrl && (
                  <a href={m.meetingUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex-shrink-0">Entrar</a>
                )}
              </div>
            ))}
            {(!data.upcoming1on1s || data.upcoming1on1s.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem 1:1s agendados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kudos recebidos + enviar */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">Reconhecimentos recebidos</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {data.recentKudos?.slice(0, 5).map((k: KudosItem) => (
              <div key={k.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{k.badge ?? '⭐'}</span>
                  <span className="text-xs font-medium text-amber-800">{k.sender.fullName}</span>
                  <span className="text-xs text-amber-500 ml-auto">{fmtDate(k.createdAt)}</span>
                </div>
                <p className="text-xs text-amber-700">{k.message}</p>
              </div>
            ))}
            {(!data.recentKudos || data.recentKudos.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem kudos recebidos ainda
              </div>
            )}
          </div>

          {/* Enviar kudos */}
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-700 mb-3">⭐ Dar kudos a colega</div>
            <input
              type="number" placeholder="ID do colega"
              value={kudosTarget} onChange={e => setKudosTarget(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Escreve uma mensagem de reconhecimento…"
              value={kudosMsg} onChange={e => setKudosMsg(e.target.value)}
              rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <button
              onClick={handleKudos}
              disabled={!kudosMsg || !kudosTarget || sendingKudos}
              className="w-full py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {sendingKudos ? 'A enviar…' : '⭐ Enviar Kudos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Team Dashboard ─────────────────────────────────────────────────────

function TeamView() {
  const [data, setData]     = useState<TeamDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TeamDashboard>('/leadership/team/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const { teamHealth } = data;

  return (
    <div className="space-y-5">
      {/* Team Health */}
      <div className={`border rounded-xl p-5 ${
        teamHealth.healthStatus === 'GREEN' ? 'bg-emerald-50 border-emerald-200' :
        teamHealth.healthStatus === 'YELLOW' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Saúde da equipa</div>
            <div className={`text-3xl font-bold font-mono ${HEALTH_CFG[teamHealth.healthStatus].cls}`}>
              {teamHealth.globalScore}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${HEALTH_CFG[teamHealth.healthStatus].dot}`} />
            <span className={`text-sm font-medium ${HEALTH_CFG[teamHealth.healthStatus].cls}`}>
              {HEALTH_CFG[teamHealth.healthStatus].label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Engajamento',   value: teamHealth.metrics.engagementScore,      suffix: '%' },
            { label: 'Turnover',      value: teamHealth.metrics.turnoverRate,          suffix: '%', invert: true },
            { label: 'Absenteísmo',   value: teamHealth.metrics.absenteeismRate,       suffix: '%', invert: true },
            { label: 'PDIs concl.',   value: teamHealth.metrics.pdisCompletedPct,      suffix: '%' },
            { label: 'Aval. no prazo',value: teamHealth.metrics.evaluationsOnTimePct,  suffix: '%' },
          ].map(({ label, value, suffix, invert }) => (
            <div key={label} className="bg-white/60 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold font-mono text-gray-800">
                {value !== null && value !== undefined ? `${value}${suffix}` : '—'}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {data.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">⚠ Alertas ({data.alerts.length})</div>
          {data.alerts.map((a, idx) => (
            <div key={idx} className="flex items-start gap-2 py-1.5 border-b border-amber-100 last:border-0">
              <span className={`text-xs font-mono flex-shrink-0 ${a.type === 'PERFORMANCE_RISK' ? 'text-red-600' : 'text-amber-600'}`}>
                {a.type === 'PERFORMANCE_RISK' ? '🔴' : '🟡'}
              </span>
              <p className="text-xs text-amber-800">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Team grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div><div>Performance</div><div>Status</div><div>Pendente</div>
        </div>
        {data.team.map(member => (
          <div key={member.user.id} className="grid grid-cols-[1fr_120px_100px_80px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Avatar name={member.user.fullName} avatarUrl={member.user.avatarUrl} size="sm" />
              <div>
                <div className="text-sm font-medium text-gray-900">{member.user.fullName}</div>
                <div className="text-xs text-gray-400">{member.user.position?.name ?? '—'}</div>
              </div>
            </div>
            <div className="text-sm font-mono font-medium text-gray-900">
              {member.latestReview?.score !== null && member.latestReview?.score !== undefined
                ? member.latestReview.score
                : '—'}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${HEALTH_CFG[member.statusColor].dot}`} />
              <span className={`text-xs ${HEALTH_CFG[member.statusColor].cls}`}>
                {HEALTH_CFG[member.statusColor].label}
              </span>
            </div>
            <div className="text-xs font-mono text-center">
              {member.pendingApprovals > 0
                ? <span className="text-amber-600 font-medium">{member.pendingApprovals}</span>
                : <span className="text-gray-300">—</span>}
            </div>
          </div>
        ))}
        {data.team.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Sem liderados atribuídos</div>
        )}
      </div>
    </div>
  );
}

// ─── View: Programs ───────────────────────────────────────────────────────────

function ProgramsView() {
  const [data, setData]     = useState<{ data: LeadershipProgram[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProgramLevel | ''>('');

  useEffect(() => {
    const params = new URLSearchParams({ status: 'ACTIVE', ...(filter ? { level: filter } : {}) });
    apiFetch<{ data: LeadershipProgram[] }>(`/leadership/programs?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [filter]);

  const handleEnroll = async (programId: number) => {
    try {
      await apiFetch(`/leadership/programs/${programId}/self-enroll`, { method: 'POST', body: '{}' });
      alert('Inscrito com sucesso!');
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['', 'INITIAL', 'INTERMEDIATE', 'ADVANCED'] as const).map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {l === '' ? 'Todos' : LEVEL_CFG[l as ProgramLevel].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {data?.data.map(prog => (
          <div key={prog.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-1">{prog.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_CFG[prog.level].cls}`}>
                  {LEVEL_CFG[prog.level].label}
                </span>
              </div>
              {prog.mandatory && (
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex-shrink-0">Obrigatório</span>
              )}
            </div>

            {prog.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{prog.description}</p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>👥 {prog._count.participants} participantes</span>
              {prog.durationWeeks && <span>📅 {prog.durationWeeks} semanas</span>}
            </div>

            <button
              onClick={() => handleEnroll(prog.id)}
              className="w-full py-2 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
            >
              Inscrever-me
            </button>
          </div>
        ))}
        {data?.data.length === 0 && (
          <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem programas disponíveis
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Feedback 360° ──────────────────────────────────────────────────────

function Feedback360View() {
  const [summary, setSummary] = useState<Feedback360Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState<Record<string, number>>({});
  const [targetLeader, setTargetLeader] = useState('');
  const [qualitative, setQualitative] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Feedback360Summary>('/leadership/feedback-360/my/summary')
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const competencies: Competency[] = ['COMMUNICATION', 'DEVELOPMENT', 'RECOGNITION', 'AUTONOMY', 'FAIRNESS', 'EXAMPLE'];

  const handleSubmit360 = async () => {
    if (!targetLeader || Object.keys(feedbackForm).length < 3) {
      alert('Preencha pelo menos 3 competências');
      return;
    }
    setSubmitting(true);
    try {
      const responses = Object.entries(feedbackForm).map(([competency, score]) => ({ competency, score }));
      await apiFetch('/leadership/feedback-360', {
        method: 'POST',
        body: JSON.stringify({
          leaderId: parseInt(targetLeader),
          responses,
          qualitativeFeedback: qualitative || undefined,
          anonymous: true,
        }),
      });
      setFeedbackForm({}); setTargetLeader(''); setQualitative('');
      alert('Feedback 360° submetido anonimamente!');
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Meu resumo 360° */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">O meu feedback 360°</div>
        {loading ? <Skeleton rows={3} /> : (
          summary && summary.totalResponses > 0 ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold font-mono text-blue-700">{summary.avgScore}</div>
                <div className="text-xs text-blue-500">média global · {summary.totalResponses} respostas</div>
              </div>
              {summary.byCompetency.map(c => (
                <div key={c.competency} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-800">{COMP_LABELS[c.competency as Competency] ?? c.competency}</span>
                    <span className="text-xs font-mono font-bold text-blue-700">{c.avgScore}/5</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.avgScore >= 4 ? 'bg-emerald-500' : c.avgScore >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${(c.avgScore / 5) * 100}%` }}
                    />
                  </div>
                  {c.insight && (
                    <div className="text-xs text-amber-700 mt-1">{c.insight}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Ainda sem respostas de feedback 360°
            </div>
          )
        )}
      </div>

      {/* Submeter feedback a líder */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">Avaliar líder (anónimo)</div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">ID do líder</div>
            <input
              type="number" placeholder="ID do colaborador" value={targetLeader}
              onChange={e => setTargetLeader(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Avaliação por competência (1-5)</div>
            {competencies.map(comp => (
              <div key={comp} className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-gray-700">{COMP_LABELS[comp]}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setFeedbackForm(prev => ({ ...prev, [comp]: s }))}
                      className={`w-8 h-8 text-xs font-mono rounded-lg transition-colors ${
                        feedbackForm[comp] === s
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Comentário qualitativo (opcional)</div>
            <textarea
              value={qualitative} onChange={e => setQualitative(e.target.value)}
              rows={3} placeholder="O que poderia melhorar? O que faz muito bem?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit360}
            disabled={submitting}
            className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'A submeter…' : '📤 Submeter (anónimo)'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View: Ranking ────────────────────────────────────────────────────────────

function RankingView() {
  const [data, setData]     = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<RankingEntry[]>('/leadership/ranking')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={6} />;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Leadership Scorecard</div>
        <div className="text-xs text-gray-400">{data.length} líderes</div>
      </div>
      {data.map((entry, idx) => {
        const classCfg = CLASS_CFG[entry.classification] ?? CLASS_CFG.AVERAGE;
        const scorePct  = Math.round((entry.score / 1000) * 100);
        return (
          <div key={entry.userId} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              idx === 0 ? 'bg-amber-100 text-amber-800' :
              idx === 1 ? 'bg-gray-100 text-gray-600' :
              idx === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-50 text-gray-400'
            }`}>
              {idx + 1}
            </div>
            <Avatar name={entry.user.fullName} avatarUrl={entry.user.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{entry.user.fullName}</div>
              <div className="text-xs text-gray-400">{entry.user.position?.name ?? '—'}</div>
            </div>
            <div className="w-40">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{entry.score} pts</span>
                <span>{scorePct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    scorePct >= 80 ? 'bg-emerald-500' : scorePct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${scorePct}%` }}
                />
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${classCfg.cls}`}>
              {classCfg.label}
            </span>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-gray-400">Sem dados de ranking disponíveis</div>
      )}
    </div>
  );
}

// ─── View: Kudos Wall ─────────────────────────────────────────────────────────

function KudosView() {
  const [kudos, setKudos] = useState<KudosItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<KudosItem[]>('/leadership/kudos')
      .then(setKudos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="text-sm text-gray-500 mb-5">Mural de reconhecimentos públicos da organização</div>
      <div className="grid grid-cols-2 gap-4">
        {kudos.map(k => (
          <div key={k.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{k.badge ?? '⭐'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={k.receiver.fullName} avatarUrl={k.receiver.avatarUrl} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-amber-900">{k.receiver.fullName}</div>
                    <div className="text-xs text-amber-600">de {k.sender.fullName}</div>
                  </div>
                  <span className="text-xs text-amber-400 ml-auto">{fmtDate(k.createdAt)}</span>
                </div>
                <p className="text-sm text-amber-800">{k.message}</p>
              </div>
            </div>
          </div>
        ))}
        {kudos.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem reconhecimentos ainda — sê o primeiro!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'my-dashboard', label: 'O meu painel' },
  { id: 'team',         label: 'A minha equipa' },
  { id: 'programs',     label: 'Programas' },
  { id: 'feedback360',  label: 'Feedback 360°' },
  { id: 'ranking',      label: 'Ranking' },
  { id: 'kudos',        label: 'Kudos' },
];

const TITLES: Record<View, string> = {
  'my-dashboard': 'Dashboard do Líder',
  team:           'A minha Equipa',
  programs:       'Programas de Liderança',
  feedback360:    'Feedback 360° de Liderança',
  ranking:        'Leadership Scorecard',
  kudos:          'Mural de Reconhecimento',
};

export default function LeadershipPage() {
  const [view, setView] = useState<View>('my-dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Desenvolvimento de Liderança</p>
        </div>
      </div>

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

      {view === 'my-dashboard' && <MyDashboardView />}
      {view === 'team'         && <TeamView />}
      {view === 'programs'     && <ProgramsView />}
      {view === 'feedback360'  && <Feedback360View />}
      {view === 'ranking'      && <RankingView />}
      {view === 'kudos'        && <KudosView />}
    </div>
  );
}
