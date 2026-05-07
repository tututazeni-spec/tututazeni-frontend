// src/app/(dashboard)/career/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetencyGap {
  competency:    { id: number; name: string; category: string };
  requiredLevel: number;
  currentLevel:  number;
  gap:           number;
  status:        'MET' | 'PARTIAL' | 'MISSING';
}

interface PromotionEligibility {
  eligible: boolean;
  recommendation: string;
  criteria: {
    time:         { met: boolean; value: number; required: number; label: string };
    performance:  { met: boolean; value: number; required: number; label: string };
    competencies: { met: boolean; value: number; required: number; label: string };
  };
}

interface CareerProfile {
  user: any;
  careerPlan: any;
  competencies: any[];
  careerHistory: any[];
  certificates: any[];
  completedCourses: any[];
  performanceHistory: any[];
  stats: any;
  insights: {
    competencyGaps:       CompetencyGap[];
    promotionEligibility: PromotionEligibility | null;
    matchingVacancies:    any[];
  };
}

interface CareerPath { id: number; name: string; type: string; description: string | null; steps: any[] }
interface InternalVacancy { id: number; title: string; type: string; status: string; matchScore?: number; applied?: boolean; applicationStatus?: string; position: any; department: any; _count: any; closingDate?: string }
interface SimulationResult { targetPosition: any; readinessScore: number; competencyGaps: any[]; summary: any; recommendedCourses: any[] }

type View = 'dashboard' | 'paths' | 'vacancies' | 'plan' | 'succession';

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

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, url, size = 'sm' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-base';
  return url ? (
    <img src={url} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VACANCY_TYPE: Record<string, { label: string; icon: string; cls: string }> = {
  PROMOTION:    { label: 'Promoção',     icon: '🚀', cls: 'bg-emerald-50 text-emerald-700' },
  LATERAL:      { label: 'Lateral',      icon: '↔️', cls: 'bg-blue-50 text-blue-700' },
  GIG_PROJECT:  { label: 'Gig Project',  icon: '⚡', cls: 'bg-amber-50 text-amber-700' },
  JOB_ROTATION: { label: 'Job Rotation', icon: '🔄', cls: 'bg-purple-50 text-purple-700' },
  SHADOWING:    { label: 'Shadowing',    icon: '👁',  cls: 'bg-gray-100 text-gray-600' },
};

const CAREER_PATH_TYPE: Record<string, string> = {
  LINEAR:   'Linear',
  Y_SHAPED: 'Y-shaped',
  T_SHAPED: 'T-shaped',
  W_SHAPED: 'W-shaped',
  LATTICE:  'Lattice',
};

const READINESS_CFG: Record<string, { label: string; cls: string }> = {
  READY_NOW: { label: 'Pronto agora', cls: 'bg-emerald-50 text-emerald-700' },
  READY_12M: { label: 'Pronto em 12m', cls: 'bg-amber-50 text-amber-700' },
  READY_24M: { label: 'Pronto em 24m', cls: 'bg-orange-50 text-orange-700' },
  NOT_READY: { label: 'Não pronto',   cls: 'bg-red-50 text-red-600' },
};

// ─── View: Dashboard de Carreira ──────────────────────────────────────────────

function DashboardView() {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [simTarget, setSimTarget] = useState('');
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    apiFetch<CareerProfile>('/career/me').then(setProfile).finally(() => setLoading(false));
  }, []);

  const runSimulation = async () => {
    if (!simTarget) return;
    setSimLoading(true);
    try {
      const result = await apiFetch<SimulationResult>(`/career/me/simulate/${simTarget}`);
      setSimulation(result);
    } catch (e: any) { alert(e.message); }
    finally { setSimLoading(false); }
  };

  if (loading || !profile) return <Skeleton rows={6} />;

  const { user, insights, stats, careerPlan, careerHistory } = profile;
  const { competencyGaps, promotionEligibility, matchingVacancies } = insights;

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Avatar name={user.fullName} url={user.avatarUrl} size="lg" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user.fullName}</h2>
            <div className="text-sm text-gray-500">{user.position?.name ?? 'Sem cargo'} · {user.department?.name}</div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>🎓 {stats.certificates} certificados</span>
              <span>📚 {stats.enrollments} cursos</span>
              <span>💡 {stats.userCompetencies} competências</span>
              <span>🏆 {stats.badgeAwards} badges</span>
            </div>
            {user.points && (
              <div className="mt-2 text-xs text-blue-700 font-semibold">{user.points.points} XP</div>
            )}
          </div>
          {promotionEligibility && (
            <div className={`px-3 py-2 rounded-xl text-center text-xs font-medium ${
              promotionEligibility.eligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              {promotionEligibility.eligible ? '✅ Elegível para promoção' : '📋 Em desenvolvimento'}
              <div className="text-xs font-normal mt-0.5 text-gray-400">{READINESS_CFG[promotionEligibility.recommendation]?.label}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Gap de Competências */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Gap de Competências</span>
            <span className="text-xs text-gray-400">{competencyGaps.filter(g => g.status === 'MET').length}/{competencyGaps.length} cumpridas</span>
          </div>
          {competencyGaps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem cargo definido ou sem competências mapeadas</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {competencyGaps.slice(0, 6).map(g => (
                <div key={g.competency.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">{g.competency.name}</div>
                    <div className="text-xs text-gray-400">{g.competency.category}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(lvl => (
                        <div key={lvl}
                          className={`w-4 h-4 rounded-sm ${lvl <= g.currentLevel ? 'bg-blue-500' : lvl <= g.requiredLevel ? 'bg-blue-100' : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      g.status === 'MET' ? 'bg-emerald-50 text-emerald-700' :
                      g.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {g.status === 'MET' ? '✓' : `−${g.gap}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vagas compatíveis + Plano de Carreira */}
        <div className="space-y-4">
          {/* Vagas compatíveis */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
              🎯 Vagas compatíveis
            </div>
            {matchingVacancies.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-400 text-center">Sem vagas compatíveis</div>
            ) : (
              matchingVacancies.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{v.title}</div>
                    <div className="text-xs text-gray-400">{v.department?.name}</div>
                  </div>
                  <div className={`text-xs font-bold flex-shrink-0 ${v.matchScore >= 80 ? 'text-emerald-600' : v.matchScore >= 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {v.matchScore}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Plano de Carreira */}
          {careerPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-xs text-blue-600 font-semibold mb-1">📋 Plano activo</div>
              <div className="text-sm font-medium text-gray-900 truncate">{careerPlan.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {careerPlan.goals?.length ?? 0} objetivos
              </div>
              {careerPlan.targetDate && (
                <div className="text-xs text-blue-600 mt-1">
                  Alvo: {new Date(careerPlan.targetDate).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Critérios de Elegibilidade */}
      {promotionEligibility && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">📈 Critérios de Promoção</div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(promotionEligibility.criteria).map(([key, c]) => (
              <div key={key} className={`rounded-xl p-4 border ${c.met ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="text-xs text-gray-500 mb-2">{c.label}</div>
                <div className={`text-2xl font-bold font-mono ${c.met ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {typeof c.value === 'number' && c.value % 1 !== 0 ? c.value.toFixed(1) : c.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ {c.required}</span>
                </div>
                <div className={`text-xs mt-1 font-medium ${c.met ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {c.met ? '✓ Cumprido' : '⚠ Pendente'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulador de Carreira */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">🔭 Simulador de Carreira</div>
        <div className="flex gap-3 mb-4">
          <input
            type="number" placeholder="ID do cargo alvo (Position ID)…"
            value={simTarget} onChange={e => setSimTarget(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={runSimulation} disabled={simLoading || !simTarget}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60">
            {simLoading ? '…' : 'Simular'}
          </button>
        </div>

        {simulation && (
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{simulation.targetPosition.name}</div>
                <div className="text-xs text-gray-500">Cargo alvo</div>
              </div>
              <div className={`text-3xl font-bold font-mono ${simulation.readinessScore >= 80 ? 'text-emerald-600' : simulation.readinessScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {simulation.readinessScore}%
              </div>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full ${simulation.readinessScore >= 80 ? 'bg-emerald-500' : simulation.readinessScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${simulation.readinessScore}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Requisitos</div>
                <div className="font-bold text-gray-900">{simulation.summary.requirementsMet}/{simulation.summary.totalRequirements}</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Pronto?</div>
                <div className={`font-bold ${simulation.summary.ready ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {simulation.summary.ready ? 'Sim' : `~${simulation.summary.estimatedTimeMonths}m`}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Cursos rec.</div>
                <div className="font-bold text-gray-900">{simulation.recommendedCourses.length}</div>
              </div>
            </div>
            {simulation.recommendedCourses.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">Cursos recomendados para fechar gaps:</div>
                {simulation.recommendedCourses.slice(0, 3).map(c => (
                  <div key={c.id} className="text-xs text-blue-700 truncate">📚 {c.title}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico de Carreira */}
      {careerHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">🕐 Histórico de Carreira</div>
          {careerHistory.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{c.position?.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(c.startedAt).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}
                  {c.endedAt && ` → ${new Date(c.endedAt).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Trilhas de Carreira ─────────────────────────────────────────────────

function PathsView() {
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CareerPath | null>(null);

  useEffect(() => {
    apiFetch<CareerPath[]>('/career/paths').then(setPaths).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5">
      {/* Lista */}
      <div className="space-y-2">
        {paths.map(path => (
          <div key={path.id} onClick={() => setSelected(path)}
            className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${selected?.id === path.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
            <div className="text-sm font-semibold text-gray-900">{path.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{CAREER_PATH_TYPE[path.type] ?? path.type}</span>
              <span className="text-xs text-gray-400">{path.steps?.length ?? 0} cargos</span>
            </div>
          </div>
        ))}
        {paths.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem trilhas de carreira
          </div>
        )}
      </div>

      {/* Detalhe */}
      <div>
        {!selected ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Selecciona uma trilha
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-lg font-bold text-gray-900 mb-1">{selected.name}</div>
            <div className="flex gap-2 mb-4">
              <Badge label={CAREER_PATH_TYPE[selected.type] ?? selected.type} cls="bg-blue-50 text-blue-700" />
              <Badge label={`${selected.steps.length} passos`} cls="bg-gray-100 text-gray-600" />
            </div>
            {selected.description && <p className="text-sm text-gray-500 mb-4">{selected.description}</p>}

            {/* Passos / Cargos */}
            <div className="space-y-3">
              {selected.steps.map((step: any, idx: number) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step.order}
                    </div>
                    {idx < selected.steps.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-semibold text-gray-900">{step.position?.name}</div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                      {step.minMonthsRequired && <span>⏱ {step.minMonthsRequired}m mínimos</span>}
                      {step.minPerformanceScore && <span>⭐ Score ≥{step.minPerformanceScore}</span>}
                      {step.requiredCourseIds?.length > 0 && <span>📚 {step.requiredCourseIds.length} cursos obrigatórios</span>}
                    </div>
                    {step.position?.competencies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {step.position.competencies.slice(0, 4).map((pc: any) => (
                          <span key={pc.competency.id} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {pc.competency.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Vagas Internas ──────────────────────────────────────────────────────

function VacanciesView() {
  const [vacancies, setVacancies] = useState<InternalVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [applying, setApplying] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}) });
    apiFetch<any>(`/career/vacancies?${params}`).then(r => setVacancies(r.data ?? [])).finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const apply = async (vacancyId: number) => {
    setApplying(vacancyId);
    try {
      await apiFetch(`/career/vacancies/${vacancyId}/apply`, { method: 'POST', body: '{}' });
      await load();
      alert('✅ Candidatura enviada com sucesso!');
    } catch (e: any) { alert(e.message); }
    finally { setApplying(null); }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${!typeFilter ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todas
        </button>
        {Object.entries(VACANCY_TYPE).map(([k, v]) => (
          <button key={k} onClick={() => setTypeFilter(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${typeFilter === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton rows={4} /> : (
        <div className="grid grid-cols-2 gap-4">
          {vacancies.map(v => {
            const typeCfg = VACANCY_TYPE[v.type] ?? { label: v.type, icon: '📋', cls: 'bg-gray-100 text-gray-600' };
            return (
              <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge label={`${typeCfg.icon} ${typeCfg.label}`} cls={typeCfg.cls} />
                  {v.matchScore !== undefined && (
                    <span className={`text-sm font-bold ${v.matchScore >= 80 ? 'text-emerald-600' : v.matchScore >= 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {v.matchScore}% match
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">{v.title}</div>
                <div className="text-xs text-gray-400 mb-3">
                  {v.position?.name && <span>{v.position.name} · </span>}
                  {v.department?.name && <span>{v.department.name}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {v._count.applications} candidatura{v._count.applications !== 1 ? 's' : ''}
                    {v.closingDate && ` · Fecha ${new Date(v.closingDate).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}`}
                  </span>
                  {v.applied ? (
                    <Badge
                      label={v.applicationStatus ?? 'Candidatado'}
                      cls={v.applicationStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}
                    />
                  ) : (
                    <button onClick={() => apply(v.id)} disabled={applying === v.id}
                      className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60">
                      {applying === v.id ? '…' : 'Candidatar-me'}
                    </button>
                  )}
                </div>
                {v.matchScore !== undefined && v.matchScore > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${v.matchScore >= 80 ? 'bg-emerald-500' : v.matchScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${v.matchScore}%` }} />
                  </div>
                )}
              </div>
            );
          })}
          {vacancies.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem vagas internas abertas
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Plano de Carreira ───────────────────────────────────────────────────

function PlanView() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [updatingGoal, setUpdatingGoal] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<any>('/career/me/plan').then(setPlan).finally(() => setLoading(false));
  }, []);

  const createPlan = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const p = await apiFetch<any>('/career/me/plan', { method: 'POST', body: JSON.stringify({ title }) });
      setPlan(p);
      setTitle('');
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const updateGoalProgress = async (goalId: number, progress: number) => {
    setUpdatingGoal(goalId);
    try {
      await apiFetch(`/career/me/goals/${goalId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) });
      const p = await apiFetch<any>('/career/me/plan');
      setPlan(p);
    } finally { setUpdatingGoal(null); }
  };

  if (loading) return <Skeleton />;

  if (!plan) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-base font-semibold text-gray-900 mb-2">Sem plano de carreira activo</div>
        <p className="text-sm text-gray-500 mb-5">Define os teus objetivos de carreira e acompanha o teu progresso</p>
        <div className="flex gap-2 justify-center">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Título do plano (ex: Tornar-me Tech Lead até 2027)"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={createPlan} disabled={creating || !title.trim()}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60">
            {creating ? '…' : 'Criar plano'}
          </button>
        </div>
      </div>
    );
  }

  const goals = plan.goals ?? [];
  const completed = goals.filter((g: any) => g.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header do plano */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">{plan.title}</div>
            {plan.description && <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>}
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              {plan.targetDate && <span>🎯 Alvo: {new Date(plan.targetDate).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</span>}
              {plan.mentor && <span>👥 Mentor: {plan.mentor.fullName}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-blue-700">{completed}/{goals.length}</div>
            <div className="text-xs text-gray-400">objetivos concluídos</div>
          </div>
        </div>
        {goals.length > 0 && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0}%` }} />
          </div>
        )}
      </div>

      {/* Objetivos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
          Objetivos do Plano
        </div>
        {goals.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Sem objetivos. Adiciona o primeiro objetivo ao plano.</div>
        ) : (
          goals.map((g: any) => (
            <div key={g.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                g.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500' :
                g.status === 'IN_PROGRESS' ? 'border-blue-500' : 'border-gray-300'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{g.title}</div>
                {g.description && <div className="text-xs text-gray-400 truncate">{g.description}</div>}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${g.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${g.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{g.progress}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {[0, 25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={() => updateGoalProgress(g.id, pct)}
                    disabled={updatingGoal === g.id}
                    className={`text-xs px-1.5 py-0.5 rounded font-mono ${g.progress === pct ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {pct}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page Principal ───────────────────────────────────────────────────────────

const NAV = [
  { id: 'dashboard', label: '🗺️ Minha Carreira' },
  { id: 'paths',     label: '📍 Trilhas' },
  { id: 'vacancies', label: '🔍 Vagas Internas' },
  { id: 'plan',      label: '📋 Meu Plano' },
] as const;

const TITLES: Record<View, string> = {
  dashboard:  'Dashboard de Carreira',
  paths:      'Trilhas de Carreira',
  vacancies:  'Vagas Internas',
  plan:       'Plano de Carreira',
  succession: 'Planeamento de Sucessão',
};

export default function CareerPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Carreira</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {n.label}
          </button>
        ))}
      </div>

      {view === 'dashboard'  && <DashboardView />}
      {view === 'paths'      && <PathsView />}
      {view === 'vacancies'  && <VacanciesView />}
      {view === 'plan'       && <PlanView />}
    </div>
  );
}