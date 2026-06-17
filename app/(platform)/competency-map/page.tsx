'use client';

// ─── app/(dashboard)/competency-map/page.tsx ─────────────────────────────────
// INNOVA — Mapa de Competências
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Target, Star, TrendingUp, AlertCircle, CheckCircle2,
  BookOpen, Users, BarChart3, Zap, Award, RefreshCcw,
  ChevronRight, Plus, Eye, Loader2, X, ArrowUpRight,
  Filter, Download, Settings,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillType = 'TECHNICAL' | 'BEHAVIORAL' | 'LEADERSHIP' | 'LANGUAGE' | 'CERTIFICATION';
type ReadinessLevel = 'READY' | 'DEVELOPING' | 'STARTING';
type GapPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface EmployeeSkill {
  id: number; skillId: number; currentLevel: number; targetLevel?: number;
  managerValidated: boolean; source: string;
  skill: { id: number; name: string; type: SkillType; category?: { name: string }; maxLevel: number };
}

interface GapEntry {
  skillId: number; skillName: string; skillType: SkillType; category?: string;
  currentLevel: number; requiredLevel: number; gap: number;
  weight: number; mandatory: boolean; priority: GapPriority; hasGap: boolean;
}

interface GapAnalysis {
  targetRole?: string; readinessScore: number; readinessLevel: ReadinessLevel;
  totalRequirements: number; metRequirements: number;
  gaps: { mandatory: GapEntry[]; optional: GapEntry[]; all: GapEntry[] };
  recommendedCourses: Array<{ id: number; title: string }>;
}

interface CompetencyMap {
  userId: number; skills: EmployeeSkill[]; byType: Record<SkillType, EmployeeSkill[]>;
  total: number; avgScore: number; gapAnalysis: GapAnalysis;
}

interface RadarData {
  userId: number; readinessScore: number;
  radarByType: Array<{ type: SkillType; avgCurrent: number; avgRequired: number; count: number }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SkillType, { label: string; color: string; bg: string }> = {
  TECHNICAL:    { label: 'Técnicas',      color: 'text-blue-700',    bg: 'bg-blue-50'    },
  BEHAVIORAL:   { label: 'Comportamentais',color: 'text-purple-700', bg: 'bg-purple-50'  },
  LEADERSHIP:   { label: 'Liderança',     color: 'text-amber-700',   bg: 'bg-amber-50'   },
  LANGUAGE:     { label: 'Idiomas',       color: 'text-cyan-700',    bg: 'bg-cyan-50'    },
  CERTIFICATION:{ label: 'Certificações', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const READINESS_CONFIG: Record<ReadinessLevel, { label: string; color: string; bar: string; emoji: string }> = {
  READY:      { label: 'Pronto',            color: 'text-emerald-700', bar: 'bg-emerald-500', emoji: '🟢' },
  DEVELOPING: { label: 'Em Desenvolvimento', color: 'text-amber-700',   bar: 'bg-amber-500',   emoji: '🟡' },
  STARTING:   { label: 'Início',            color: 'text-red-700',     bar: 'bg-red-400',     emoji: '🔴' },
};

const PRIORITY_CONFIG: Record<GapPriority, { label: string; color: string }> = {
  HIGH:   { label: 'Alta',  color: 'bg-red-100 text-red-700'    },
  MEDIUM: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  LOW:    { label: 'Baixa', color: 'bg-gray-100 text-gray-600'  },
};

// ─── Self-Assessment Modal ─────────────────────────────────────────────────────

function SelfAssessModal({
  skills, onClose, onSuccess,
}: {
  skills: Array<{ id: number; name: string; type: SkillType; maxLevel: number }>;
  onClose: () => void; onSuccess: () => void;
}) {
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');

  const handleSubmit = async () => {
    const assessments = Object.entries(levels)
      .filter(([_, v]) => v > 0)
      .map(([skillId, currentLevel]) => ({ skillId: +skillId, currentLevel }));
    if (!assessments.length) { setError('Avalie pelo menos uma competência'); return; }

    setLoading(true); setError('');
    try {
      await apiClient.post('/competency-map/assess/batch', {
        source: 'SELF', assessments,
      });
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const byType = skills.reduce((acc: any, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Autoavaliação de Competências</h2>
            <p className="text-sm text-gray-500 mt-0.5">Avalie o seu nível actual em cada competência (1 = Iniciante · 5 = Expert)</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}

          {Object.entries(byType).map(([type, typeSkills]: any) => {
            const cfg = TYPE_CONFIG[type as SkillType];
            return (
              <div key={type}>
                <div className={`inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} mb-3`}>
                  {cfg.label}
                </div>
                <div className="space-y-4">
                  {typeSkills.map((s: any) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{s.name}</span>
                        <span className="text-sm font-bold text-blue-600">{levels[s.id] ?? 0}/{s.maxLevel}</span>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({length: s.maxLevel}, (_, i) => i + 1).map(l => (
                          <button key={l} onClick={() => setLevels(prev => ({...prev, [s.id]: l}))}
                            className={`flex-1 h-8 rounded-xl text-sm font-semibold transition-all ${
                              (levels[s.id] ?? 0) >= l
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <div className="flex-1"/>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} Submeter Avaliação
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Radar SVG ────────────────────────────────────────────────────────────────

function RadarChart({ data }: { data: RadarData }) {
  const points = data.radarByType;
  if (!points.length) return null;

  const size    = 200;
  const center  = size / 2;
  const maxR    = 80;
  const n       = points.length;

  const toXY = (val: number, idx: number, max: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r     = (val / 5) * maxR;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const currentPts  = points.map((p, i) => toXY(p.avgCurrent, i, 5));
  const requiredPts = points.map((p, i) => toXY(p.avgRequired, i, 5));
  const axisPts     = points.map((_, i) => toXY(5, i, 5));

  const toPath = (pts: Array<{x: number; y: number}>) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Grid circles */}
        {[1,2,3,4,5].map(l => (
          <circle key={l} cx={center} cy={center} r={(l/5)*maxR} fill="none" stroke="#e5e7eb" strokeWidth="1"/>
        ))}
        {/* Axis lines */}
        {axisPts.map((p, i) => (
          <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1"/>
        ))}
        {/* Required area */}
        <path d={toPath(requiredPts)} fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"/>
        {/* Current area */}
        <path d={toPath(currentPts)} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="2"/>
        {/* Labels */}
        {points.map((p, i) => {
          const ap = toXY(5.5, i, 5);
          return (
            <text key={i} x={ap.x} y={ap.y} fontSize="8" textAnchor="middle" dominantBaseline="middle"
              fill="#6b7280" fontWeight="600">
              {TYPE_CONFIG[p.type as SkillType]?.label?.split(' ')[0]}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-xs mt-2">
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-blue-500 rounded"/><span className="text-gray-500">Actual</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-red-400 rounded" style={{borderStyle:'dashed'}}/><span className="text-gray-500">Exigido</span></div>
      </div>
    </div>
  );
}

// ─── Skill Level Bar ──────────────────────────────────────────────────────────

function SkillBar({ skill, requiredLevel }: { skill: EmployeeSkill; requiredLevel?: number }) {
  const max      = skill.skill.maxLevel;
  const current  = skill.currentLevel;
  const required = requiredLevel;
  const pct      = (current / max) * 100;
  const hasGap   = required && current < required;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-700 font-medium truncate">{skill.skill.name}</span>
          <span className="text-xs font-semibold text-gray-900 flex-shrink-0 ml-2">{current}/{max}</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${hasGap ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}/>
          {required && (
            <div className="absolute top-0 h-full w-0.5 bg-red-400" style={{ left: `${(required / max) * 100}%` }}/>
          )}
        </div>
      </div>
      {!skill.managerValidated && skill.skill.type === 'TECHNICAL' && (
        <span className="text-xs text-amber-500 flex-shrink-0">⚠</span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'my' | 'gap' | 'team' | 'catalogue';

export default function CompetencyMapPage() {
  const [tab, setTab]           = useState<TabKey>('my');
  const [showAssess, setShowAssess] = useState(false);

  const skillsParams = { limit: 100 };
  const mapQuery = useApiQuery<CompetencyMap>(
    queryKeys.competencyMap.my(), '/competency-map/my',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const radarQuery = useApiQuery<RadarData>(
    queryKeys.competencyMap.myRadar(), '/competency-map/my/radar',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const skillsQuery = useApiQuery<{ data: any[] }>(
    queryKeys.competencyMap.skills(skillsParams), '/competency-map/skills',
    { params: skillsParams, staleTime: STALE_TIME.STATIC },
  );

  const myMap     = mapQuery.data ?? null;
  const radar     = radarQuery.data ?? null;
  const allSkills = skillsQuery.data?.data ?? [];
  const loading   = mapQuery.isLoading || radarQuery.isLoading || skillsQuery.isLoading;

  const load = () => {
    mapQuery.refetch(); radarQuery.refetch(); skillsQuery.refetch();
  };

  const gap      = myMap?.gapAnalysis;
  const rcfg     = gap ? READINESS_CONFIG[gap.readinessLevel] : null;

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number }> = [
    { key: 'my',       label: 'Minhas Skills',  icon: Target    },
    { key: 'gap',      label: 'Gap Analysis',   icon: AlertCircle, badge: gap?.gaps.mandatory.length },
    { key: 'team',     label: 'Equipa',         icon: Users     },
    { key: 'catalogue',label: 'Catálogo',       icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mapa de Competências</h1>
            <p className="text-sm text-gray-500">Skills, gaps e desenvolvimento profissional</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAssess(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Star size={15}/> Autoavaliar
            </button>
            <button onClick={load} className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">
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
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors relative ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <t.icon size={15}/>{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* MY SKILLS */}
        {tab === 'my' && (
          loading ? (
            <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : !myMap ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Target size={48} className="mb-4 opacity-30"/>
              <p className="text-sm font-medium">Sem skills avaliadas</p>
              <button onClick={() => setShowAssess(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                <Plus size={14}/> Fazer primeira avaliação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary + Radar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score card */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Perfil de Competências</h3>
                      <p className="text-xs text-gray-400 mb-4">{myMap.total} skills avaliadas · Score médio: {myMap.avgScore.toFixed(1)}/5</p>

                      {rcfg && gap && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`font-semibold ${rcfg.color}`}>{rcfg.emoji} {rcfg.label} para &quot;{gap.targetRole}&quot;</span>
                            <span className="font-bold text-gray-900">{gap.readinessScore}%</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${rcfg.bar}`} style={{ width: `${gap.readinessScore}%` }}/>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{gap.metRequirements}/{gap.totalRequirements} requisitos cumpridos</p>
                        </div>
                      )}

                      {/* By type pills */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(myMap.byType ?? {}).map(([type, skills]: any) => {
                          const cfg = TYPE_CONFIG[type as SkillType];
                          const avg = skills.length ? +(skills.reduce((a: number, s: EmployeeSkill) => a + s.currentLevel, 0) / skills.length).toFixed(1) : 0;
                          return (
                            <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.bg}`}>
                              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                              <span className={`text-xs ${cfg.color} opacity-70`}>{avg}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radar */}
                {radar && radar.radarByType.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 self-start">Radar</h3>
                    <RadarChart data={radar}/>
                  </div>
                )}
              </div>

              {/* Skills by type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(myMap.byType ?? {}).map(([type, skills]: any) => {
                  const cfg = TYPE_CONFIG[type as SkillType];
                  return (
                    <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-400">{skills.length} skills</span>
                      </div>
                      <div className="space-y-3">
                        {skills.slice(0, 6).map((s: EmployeeSkill) => {
                          const gapEntry = gap?.gaps.all.find(g => g.skillId === s.skillId);
                          return <SkillBar key={s.skillId} skill={s} requiredLevel={gapEntry?.requiredLevel}/>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* GAP ANALYSIS */}
        {tab === 'gap' && gap && (
          <div className="space-y-4">
            {/* Readiness summary */}
            {rcfg && (
              <div className={`rounded-2xl border p-5 ${rcfg.bar === 'bg-emerald-500' ? 'bg-emerald-50 border-emerald-200' : rcfg.bar === 'bg-amber-500' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{rcfg.emoji} Prontidão: &quot;{gap.targetRole}&quot;</p>
                  <span className={`text-2xl font-bold ${rcfg.color}`}>{gap.readinessScore}%</span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${rcfg.bar}`} style={{ width: `${gap.readinessScore}%` }}/>
                </div>
              </div>
            )}

            {/* Mandatory gaps */}
            {gap.gaps.mandatory.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle size={15}/> Skills Obrigatórias em Falta ({gap.gaps.mandatory.length})
                </h3>
                <div className="space-y-3">
                  {gap.gaps.mandatory.map(g => (
                    <div key={g.skillId} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{g.skillName}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[g.priority].color}`}>{PRIORITY_CONFIG[g.priority].label}</span>
                            <span className="text-xs text-gray-500">{g.currentLevel}→{g.requiredLevel}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <div className="h-full bg-red-300 rounded-full" style={{ width: `${(g.currentLevel / 5) * 100}%` }}/>
                          <div className="absolute top-0 h-full w-0.5 bg-red-600" style={{ left: `${(g.requiredLevel / 5) * 100}%` }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional gaps */}
            {gap.gaps.optional.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-amber-700 mb-3">Skills a Desenvolver ({gap.gaps.optional.length})</h3>
                <div className="space-y-3">
                  {gap.gaps.optional.map(g => (
                    <div key={g.skillId} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-800">{g.skillName}</span>
                          <span className="text-xs text-gray-400">{g.currentLevel}→{g.requiredLevel}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(g.currentLevel / 5) * 100}%` }}/>
                          <div className="absolute top-0 h-full w-0.5 bg-amber-600" style={{ left: `${(g.requiredLevel / 5) * 100}%` }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended courses */}
            {gap.recommendedCourses.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen size={15} className="text-blue-600"/> Cursos Recomendados
                </h3>
                <div className="space-y-2">
                  {gap.recommendedCourses.map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                      <BookOpen size={13} className="text-blue-600 flex-shrink-0"/>
                      <span className="text-sm text-blue-800 font-medium">{c.title}</span>
                      <ArrowUpRight size={12} className="text-blue-500 ml-auto"/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gap.gaps.mandatory.length === 0 && gap.gaps.optional.length === 0 && (
              <div className="flex flex-col items-center py-16 text-gray-400 bg-white rounded-2xl border border-emerald-100">
                <CheckCircle2 size={40} className="mb-3 text-emerald-500 opacity-70"/>
                <p className="text-sm font-medium text-emerald-700">Todos os requisitos cumpridos!</p>
              </div>
            )}
          </div>
        )}

        {/* TEAM */}
        {tab === 'team' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm font-medium">Vista de equipa disponível com role Gestor</p>
          </div>
        )}

        {/* CATALOGUE */}
        {tab === 'catalogue' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Catálogo de Skills ({allSkills.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {allSkills.map(s => {
                const cfg = TYPE_CONFIG[s.type as SkillType];
                return (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    {s.category && <span className="text-xs text-gray-400">{s.category.name}</span>}
                    <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                      <span>{s._count?.employeeSkills ?? 0} avaliados</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAssess && (
        <SelfAssessModal
          skills={allSkills.map(s => ({ id: s.id, name: s.name, type: s.type, maxLevel: s.maxLevel }))}
          onClose={() => setShowAssess(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}