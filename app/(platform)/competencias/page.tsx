'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CompetencyCategory = 'HARD_SKILL' | 'SOFT_SKILL' | 'LANGUAGE' | 'TOOL' | 'LEADERSHIP';
type CompetencyStatus   = 'ACTIVE' | 'INACTIVE';
type CompetencySource   = 'MANUAL' | 'COURSE' | 'ASSESSMENT' | 'MANAGER' | 'HRIS';

interface ProficiencyLevel {
  id: number;
  value: number;
  name: string;
  description: string | null;
}

interface Competency {
  id: number;
  name: string;
  description: string | null;
  category: CompetencyCategory;
  tags: string[];
  status: CompetencyStatus;
  _count: { userCompetencies: number; courses: number; positions: number };
  proficiencyLevels?: ProficiencyLevel[];
}

interface UserCompetency {
  id: number;
  competencyId: number;
  currentLevel: number;
  targetLevel: number | null;
  selfLevel: number | null;
  managerLevel: number | null;
  source: CompetencySource;
  notes: string | null;
  evaluatedAt: string;
  competency: Competency;
  gap: number | null;
  divergence: number | null;
}

interface GapResult {
  competency: Competency;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  met: boolean;
  priority: string;
  weight: number;
  recommendedCourses: Array<{ id: number; title: string }>;
}

interface GapAnalysis {
  gaps: GapResult[];
  totalGap: number;
  mandatoryGaps: number;
  readinessPercent: number;
}

interface SkillMatrix {
  users: Array<{ id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null }>;
  competencies: Competency[];
  matrix: Array<{ user: any; levels: Array<{ competencyId: number; level: number }> }>;
}

interface OrgDashboard {
  totalUsers: number;
  usersWithCompetencies: number;
  totalGaps: number;
  criticalGaps: Array<{ id: number; name: string; category: string; usersWithGap: number }>;
}

type View = 'catalog' | 'my-profile' | 'matrix' | 'dashboard';

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

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function levelColor(level: number, max = 5): string {
  const pct = level / max;
  if (pct === 0)    return 'bg-gray-100 text-gray-400';
  if (pct <= 0.25)  return 'bg-red-100 text-red-700';
  if (pct <= 0.5)   return 'bg-amber-100 text-amber-700';
  if (pct <= 0.75)  return 'bg-blue-100 text-blue-700';
  return 'bg-emerald-100 text-emerald-700';
}

function levelBarColor(level: number): string {
  if (level === 0)  return 'bg-gray-200';
  if (level === 1)  return 'bg-red-400';
  if (level === 2)  return 'bg-amber-400';
  if (level === 3)  return 'bg-blue-400';
  if (level === 4)  return 'bg-emerald-400';
  return 'bg-emerald-600';
}

const LEVEL_LABELS = ['—', 'Básico', 'Elementar', 'Intermédio', 'Avançado', 'Especialista'];

const CATEGORY_CFG: Record<CompetencyCategory, { label: string; cls: string }> = {
  HARD_SKILL:  { label: 'Hard Skill',  cls: 'bg-blue-50 text-blue-700' },
  SOFT_SKILL:  { label: 'Soft Skill',  cls: 'bg-purple-50 text-purple-700' },
  LANGUAGE:    { label: 'Idioma',      cls: 'bg-emerald-50 text-emerald-700' },
  TOOL:        { label: 'Ferramenta',  cls: 'bg-amber-50 text-amber-700' },
  LEADERSHIP:  { label: 'Liderança',   cls: 'bg-red-50 text-red-700' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: CompetencyCategory }) {
  const { label, cls } = CATEGORY_CFG[category] ?? { label: category, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function LevelBar({ current, target, max = 5 }: { current: number; target?: number | null; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${levelBarColor(current)}`}
          style={{ width: `${(current / max) * 100}%` }}
        />
        {target && target > current && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"
            style={{ left: `${(target / max) * 100}%` }}
          />
        )}
      </div>
      <span className="text-xs font-mono text-gray-600 flex-shrink-0">{current}/{max}</span>
    </div>
  );
}

function StarRating({ value, max = 5, onChange }: { value: number; max?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(s => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          className={`text-xl transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
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

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ─── View: Catalog ────────────────────────────────────────────────────────────

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData]         = useState<{ data: Competency[]; total: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '24', status: 'ACTIVE',
        ...(search   ? { search }   : {}),
        ...(category ? { category } : {}),
      });
      setData(await apiFetch(`/competencies?${params}`));
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar competências, tags…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{data?.total ?? 0} competências</span>
      </div>

      {loading ? <Skeleton rows={6} /> : (
        <div className="grid grid-cols-3 gap-3">
          {data?.data.map(comp => (
            <div
              key={comp.id}
              onClick={() => onSelect(comp.id)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">{comp.name}</div>
                  <CategoryBadge category={comp.category} />
                </div>
              </div>
              {comp.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{comp.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {comp.tags.slice(0, 3).map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>👥 {comp._count.userCompetencies}</span>
                <span>📚 {comp._count.courses} cursos</span>
                <span>🎯 {comp._count.positions} cargos</span>
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma competência encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: My Competency Profile ──────────────────────────────────────────────

function MyProfileView() {
  const [competencies, setCompetencies] = useState<UserCompetency[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<'profile' | 'gap' | 'evolution'>('profile');
  const [positionId, setPositionId]     = useState('');
  const [gap, setGap]                   = useState<GapAnalysis | null>(null);
  const [loadingGap, setLoadingGap]     = useState(false);
  const [selfAssessing, setSelfAssessing] = useState<number | null>(null);
  const [selfLevel, setSelfLevel]       = useState(1);
  const [savingAssess, setSavingAssess] = useState(false);
  const [evolution, setEvolution]       = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<UserCompetency[]>('/competencies/my/profile'),
      apiFetch<any[]>('/competencies/my/evolution'),
    ])
      .then(([comps, evo]) => { setCompetencies(comps); setEvolution(evo); })
      .finally(() => setLoading(false));
  }, []);

  const loadGap = async () => {
    if (!positionId) return;
    setLoadingGap(true);
    try {
      const result = await apiFetch<GapAnalysis>(`/competencies/my/gap/${positionId}`);
      setGap(result);
    } catch (e: any) { alert(e.message); }
    finally { setLoadingGap(false); }
  };

  const handleSelfAssess = async (competencyId: number) => {
    setSavingAssess(true);
    try {
      await apiFetch('/competencies/my/self-assess', {
        method: 'POST',
        body: JSON.stringify({ competencyId, selfLevel }),
      });
      const updated = await apiFetch<UserCompetency[]>('/competencies/my/profile');
      setCompetencies(updated);
      setSelfAssessing(null);
    } catch (e: any) { alert(e.message); }
    finally { setSavingAssess(false); }
  };

  if (loading) return <Skeleton />;

  // Agrupar por categoria
  const byCategory = competencies.reduce<Record<string, UserCompetency[]>>((acc, uc) => {
    const cat = uc.competency.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(uc);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['profile', 'gap', 'evolution'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ profile: 'O meu perfil', gap: 'Análise de gaps', evolution: 'Evolução' }[t]}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Competências', value: competencies.length },
              { label: 'Com gap',      value: competencies.filter(c => (c.gap ?? 0) > 0).length, color: 'text-amber-600' },
              { label: 'Divergências', value: competencies.filter(c => (c.divergence ?? 0) >= 2).length, color: 'text-red-600' },
              { label: 'Nível médio',  value: competencies.length > 0
                ? (competencies.reduce((s, c) => s + c.currentLevel, 0) / competencies.length).toFixed(1)
                : '—',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Per category */}
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <CategoryBadge category={cat as CompetencyCategory} />
                <span className="text-xs text-gray-400">{items.length} competências</span>
              </div>
              <div className="space-y-2">
                {items.map(uc => (
                  <div key={uc.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{uc.competency.name}</span>
                          {(uc.divergence ?? 0) >= 2 && (
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                              ⚠ Divergência ({uc.selfLevel} vs {uc.managerLevel})
                            </span>
                          )}
                          {(uc.gap ?? 0) > 0 && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              Gap: {uc.gap}
                            </span>
                          )}
                        </div>
                        <LevelBar current={uc.currentLevel} target={uc.targetLevel} />
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                          <span>Actual: <strong className="text-gray-700">{LEVEL_LABELS[uc.currentLevel]}</strong></span>
                          {uc.targetLevel && <span>Alvo: <strong className="text-gray-700">{LEVEL_LABELS[uc.targetLevel]}</strong></span>}
                          {uc.selfLevel !== null && <span>Auto: {uc.selfLevel}</span>}
                          {uc.managerLevel !== null && <span>Gestor: {uc.managerLevel}</span>}
                          <span>{fmtDate(uc.evaluatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {selfAssessing === uc.competencyId ? (
                          <div className="flex flex-col gap-2 items-end">
                            <StarRating value={selfLevel} onChange={setSelfLevel} />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSelfAssess(uc.competencyId)}
                                disabled={savingAssess}
                                className="px-2 py-1 bg-blue-700 text-white text-xs rounded-lg disabled:opacity-50"
                              >
                                {savingAssess ? '…' : 'Guardar'}
                              </button>
                              <button onClick={() => setSelfAssessing(null)} className="px-2 py-1 text-xs border border-gray-200 rounded-lg">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelfAssessing(uc.competencyId); setSelfLevel(uc.currentLevel); }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Autoavaliar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {competencies.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem competências registadas. O RH ou gestor pode atribuí-las.
            </div>
          )}
        </div>
      )}

      {/* Gap tab */}
      {tab === 'gap' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <input
              type="number"
              placeholder="ID do cargo alvo"
              value={positionId}
              onChange={e => setPositionId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadGap}
              disabled={!positionId || loadingGap}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {loadingGap ? 'A analisar…' : 'Analisar gap'}
            </button>
          </div>

          {gap && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-700">{gap.readinessPercent}%</div>
                  <div className="text-xs text-emerald-600 mt-1">Preparação</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">{gap.mandatoryGaps}</div>
                  <div className="text-xs text-red-600 mt-1">Gaps obrigatórios</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700">{gap.totalGap}</div>
                  <div className="text-xs text-amber-600 mt-1">Gap total</div>
                </div>
              </div>

              {/* Gaps list */}
              <div className="space-y-2">
                {gap.gaps.map(g => (
                  <div key={g.competency.id} className={`border rounded-xl p-4 ${g.met ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{g.competency.name}</span>
                          <CategoryBadge category={g.competency.category} />
                          {g.priority === 'MANDATORY' && (
                            <span className="text-xs bg-red-50 text-red-700 px-1.5 rounded">Obrigatório</span>
                          )}
                          {g.met && <span className="text-xs text-emerald-600 font-medium">✓ Cumprido</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Actual</div>
                            <LevelBar current={g.currentLevel} />
                          </div>
                          <div className="text-gray-300">→</div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Requerido</div>
                            <LevelBar current={g.requiredLevel} />
                          </div>
                        </div>
                      </div>
                      {!g.met && g.gap > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xl font-bold text-amber-600">{g.gap}</div>
                          <div className="text-xs text-gray-400">níveis</div>
                        </div>
                      )}
                    </div>

                    {/* Recommended courses */}
                    {!g.met && g.recommendedCourses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-400 mb-1.5">📚 Cursos recomendados para colmatar este gap:</div>
                        <div className="flex flex-wrap gap-2">
                          {g.recommendedCourses.slice(0, 3).map((c: any) => (
                            <a key={c.id} href={`/courses/${c.id}`}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                              {c.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution tab */}
      {tab === 'evolution' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_80px_80px_160px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div>Competência</div><div>Fonte</div><div>Anterior</div><div>Novo</div><div>Data</div>
          </div>
          {evolution.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem histórico de evolução</div>
          ) : (
            evolution.map((e: any) => (
              <div key={e.id} className="grid grid-cols-[1fr_120px_80px_80px_160px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
                <div className="text-sm text-gray-900">{e.competency?.name}</div>
                <div className="text-xs text-gray-500">{e.source}</div>
                <div className="text-xs font-mono text-gray-400">{e.previousLevel} → </div>
                <div className={`text-xs font-mono font-semibold ${e.newLevel > e.previousLevel ? 'text-emerald-600' : 'text-red-600'}`}>
                  {e.newLevel}
                </div>
                <div className="text-xs text-gray-400">{fmtDate(e.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Skill Matrix ───────────────────────────────────────────────────────

function SkillMatrixView() {
  const [matrix, setMatrix] = useState<SkillMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptId, setDeptId]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(deptId ? { departmentId: deptId } : {});
      setMatrix(await apiFetch<SkillMatrix>(`/competencies/skill-matrix?${params}`));
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton rows={6} />;
  if (!matrix) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <input
          type="number"
          placeholder="ID do departamento (opcional)"
          value={deptId}
          onChange={e => setDeptId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Legenda */}
        <div className="flex gap-2 ml-auto text-xs text-gray-400">
          {[
            { color: 'bg-gray-200', label: '0 — Sem registo' },
            { color: 'bg-red-400',  label: '1 — Básico' },
            { color: 'bg-amber-400',label: '2 — Elementar' },
            { color: 'bg-blue-400', label: '3 — Intermédio' },
            { color: 'bg-emerald-400', label: '4 — Avançado' },
            { color: 'bg-emerald-600', label: '5 — Especialista' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row — competências */}
          <div className="flex">
            <div className="w-44 flex-shrink-0" />
            {matrix.competencies.map(comp => (
              <div
                key={comp.id}
                className="w-16 flex-shrink-0 text-xs text-gray-500 text-center leading-tight px-1 pb-2"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100 }}
              >
                {comp.name}
              </div>
            ))}
          </div>

          {/* Rows — utilizadores */}
          {matrix.matrix.map(row => (
            <div key={row.user.id} className="flex items-center border-b border-gray-100 hover:bg-gray-50">
              <div className="w-44 flex-shrink-0 flex items-center gap-2 pr-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials(row.user.fullName)}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900 truncate">{row.user.fullName}</div>
                  <div className="text-xs text-gray-400 truncate">{row.user.position?.name}</div>
                </div>
              </div>
              {row.levels.map(lv => (
                <div key={lv.competencyId} className="w-16 flex-shrink-0 flex items-center justify-center py-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${levelColor(lv.level)}`}>
                    {lv.level || '—'}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {matrix.matrix.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">Sem utilizadores encontrados</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View: Dashboard RH ───────────────────────────────────────────────────────

function DashboardView() {
  const [data, setData]     = useState<OrgDashboard | null>(null);
  const [top, setTop]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<OrgDashboard>('/competencies/dashboard/gaps'),
      apiFetch<any[]>('/competencies/top?limit=8'),
    ])
      .then(([d, t]) => { setData(d); setTop(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total colaboradores', value: data.totalUsers },
          { label: 'Com competências',    value: data.usersWithCompetencies, color: 'text-emerald-600' },
          { label: 'Sem competências',    value: data.totalUsers - data.usersWithCompetencies, color: 'text-amber-600' },
          { label: 'Gaps identificados',  value: data.totalGaps, color: data.totalGaps > 0 ? 'text-red-600' : undefined },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gaps críticos */}
      {data.criticalGaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Competências críticas — mais gaps
          </div>
          {data.criticalGaps.map(c => {
            const pct = data.totalUsers > 0 ? Math.round((c.usersWithGap / data.totalUsers) * 100) : 0;
            return (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <CategoryBadge category={c.category as CompetencyCategory} />
                </div>
                <div className="w-40">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{c.usersWithGap} utilizadores</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top competências */}
      {top.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Competências mais comuns na organização
          </div>
          {top.map((t: any, idx) => (
            <div key={t.competencyId} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t.competency?.name ?? '—'}</div>
                <CategoryBadge category={(t.competency?.category ?? 'HARD_SKILL') as CompetencyCategory} />
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-gray-700">{t._count.competencyId} utilizadores</div>
                <div className="text-xs text-gray-400">Nível médio: {t.avgLevel}</div>
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
  { id: 'catalog',    label: 'Catálogo' },
  { id: 'my-profile', label: 'O meu perfil' },
  { id: 'matrix',     label: 'Skill Matrix' },
  { id: 'dashboard',  label: 'Dashboard RH' },
];

const TITLES: Record<View, string> = {
  catalog:    'Catálogo de Competências',
  'my-profile': 'O meu Perfil de Competências',
  matrix:     'Skill Matrix',
  dashboard:  'Dashboard de Competências',
};

export default function CompetenciesPage() {
  const [view, setView]          = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Competências</p>
        </div>
        {view === 'catalog' && (
          <button
            onClick={() => alert('Abrir formulário de criação de competência')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Nova competência
          </button>
        )}
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

      {view === 'catalog'     && <CatalogView onSelect={id => { setSelectedId(id); }} />}
      {view === 'my-profile'  && <MyProfileView />}
      {view === 'matrix'      && <SkillMatrixView />}
      {view === 'dashboard'   && <DashboardView />}
    </div>
  );
}
