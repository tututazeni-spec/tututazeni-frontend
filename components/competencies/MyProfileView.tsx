// components/competencies/MyProfileView.tsx
// Separador "O meu perfil" — perfil por categoria, análise de gap por
// cargo alvo e histórico de evolução. Dados próprios + apresentação.
// Extraído de app/(platform)/competencies/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LevelBar, Skeleton, StarRating } from './atoms';
import { CATEGORY_CFG, LEVEL_LABELS } from './constants';
import type {
  CompetencyCategory,
  CompetencyEvolutionEntry,
  GapAnalysis,
  UserCompetency,
} from './types';

export function MyProfileView() {
  const [tab, setTab] = useState<'profile' | 'gap' | 'evolution'>('profile');
  const [positionId, setPositionId] = useState('');
  const [selfAssessing, setSelfAssessing] = useState<number | null>(null);
  const [selfLevel, setSelfLevel] = useState(1);

  const profileQ = useApiQuery<UserCompetency[]>(
    queryKeys.competencies.myProfile(),
    '/competencies/my/profile',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const evolutionQ = useApiQuery<CompetencyEvolutionEntry[]>(
    queryKeys.competencies.myEvolution(),
    '/competencies/my/evolution',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const competencies = profileQ.data ?? [];
  const evolution = evolutionQ.data ?? [];
  const loading = profileQ.isLoading;

  const gapMutation = useApiMutation(
    (posId: string) =>
      apiClient.get<GapAnalysis>(`/competencies/my/gap/${posId}`),
    { onError: (e) => alert(e.message) },
  );
  const gap = gapMutation.data ?? null;
  const loadingGap = gapMutation.isPending;
  const loadGap = () => {
    if (positionId) gapMutation.mutate(positionId);
  };

  const selfAssessMutation = useApiMutation(
    (competencyId: number) =>
      apiClient.post('/competencies/my/self-assess', {
        competencyId,
        selfLevel,
      }),
    {
      onSuccess: () => {
        profileQ.refetch();
        setSelfAssessing(null);
      },
      onError: (e) => alert(e.message),
    },
  );
  const savingAssess = selfAssessMutation.isPending;
  const handleSelfAssess = (competencyId: number) =>
    selfAssessMutation.mutate(competencyId);

  if (loading) return <Skeleton />;

  // Agrupar por categoria
  const byCategory = competencies.reduce<Record<string, UserCompetency[]>>(
    (acc, uc) => {
      const cat = uc.competency.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(uc);
      return acc;
    },
    {},
  );

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['profile', 'gap', 'evolution'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {
              {
                profile: 'O meu perfil',
                gap: 'Análise de gaps',
                evolution: 'Evolução',
              }[t]
            }
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
              {
                label: 'Com gap',
                value: competencies.filter((c) => (c.gap ?? 0) > 0).length,
                color: 'text-amber-600',
              },
              {
                label: 'Divergências',
                value: competencies.filter((c) => (c.divergence ?? 0) >= 2)
                  .length,
                color: 'text-red-600',
              },
              {
                label: 'Nível médio',
                value:
                  competencies.length > 0
                    ? (
                        competencies.reduce((s, c) => s + c.currentLevel, 0) /
                        competencies.length
                      ).toFixed(1)
                    : '—',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div
                  className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Per category */}
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge
                  value={cat as CompetencyCategory}
                  map={CATEGORY_CFG}
                />
                <span className="text-xs text-gray-400">
                  {items.length} competências
                </span>
              </div>
              <div className="space-y-2">
                {items.map((uc) => (
                  <div
                    key={uc.id}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {uc.competency.name}
                          </span>
                          {(uc.divergence ?? 0) >= 2 && (
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                              ⚠ Divergência ({uc.selfLevel} vs {uc.managerLevel}
                              )
                            </span>
                          )}
                          {(uc.gap ?? 0) > 0 && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              Gap: {uc.gap}
                            </span>
                          )}
                        </div>
                        <LevelBar
                          current={uc.currentLevel}
                          target={uc.targetLevel}
                        />
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                          <span>
                            Actual:{' '}
                            <strong className="text-gray-700">
                              {LEVEL_LABELS[uc.currentLevel]}
                            </strong>
                          </span>
                          {uc.targetLevel && (
                            <span>
                              Alvo:{' '}
                              <strong className="text-gray-700">
                                {LEVEL_LABELS[uc.targetLevel]}
                              </strong>
                            </span>
                          )}
                          {uc.selfLevel !== null && (
                            <span>Auto: {uc.selfLevel}</span>
                          )}
                          {uc.managerLevel !== null && (
                            <span>Gestor: {uc.managerLevel}</span>
                          )}
                          <span>{fmtDate(uc.evaluatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {selfAssessing === uc.competencyId ? (
                          <div className="flex flex-col gap-2 items-end">
                            <StarRating
                              value={selfLevel}
                              onChange={setSelfLevel}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleSelfAssess(uc.competencyId)
                                }
                                disabled={savingAssess}
                                className="px-2 py-1 bg-blue-700 text-white text-xs rounded-lg disabled:opacity-50"
                              >
                                {savingAssess ? '…' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => setSelfAssessing(null)}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelfAssessing(uc.competencyId);
                              setSelfLevel(uc.currentLevel);
                            }}
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
              onChange={(e) => setPositionId(e.target.value)}
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
                  <div className="text-3xl font-bold text-emerald-700">
                    {gap.readinessPercent}%
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Preparação
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">
                    {gap.mandatoryGaps}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Gaps obrigatórios
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700">
                    {gap.totalGap}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">Gap total</div>
                </div>
              </div>

              {/* Gaps list */}
              <div className="space-y-2">
                {gap.gaps.map((g) => (
                  <div
                    key={g.competency.id}
                    className={`border rounded-xl p-4 ${g.met ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {g.competency.name}
                          </span>
                          <StatusBadge
                            value={g.competency.category}
                            map={CATEGORY_CFG}
                          />
                          {g.priority === 'MANDATORY' && (
                            <span className="text-xs bg-red-50 text-red-700 px-1.5 rounded">
                              Obrigatório
                            </span>
                          )}
                          {g.met && (
                            <span className="text-xs text-emerald-600 font-medium">
                              ✓ Cumprido
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">
                              Actual
                            </div>
                            <LevelBar current={g.currentLevel} />
                          </div>
                          <div className="text-gray-300">→</div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">
                              Requerido
                            </div>
                            <LevelBar current={g.requiredLevel} />
                          </div>
                        </div>
                      </div>
                      {!g.met && g.gap > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xl font-bold text-amber-600">
                            {g.gap}
                          </div>
                          <div className="text-xs text-gray-400">níveis</div>
                        </div>
                      )}
                    </div>

                    {/* Recommended courses */}
                    {!g.met && g.recommendedCourses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-400 mb-1.5">
                          📚 Cursos recomendados para colmatar este gap:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.recommendedCourses.slice(0, 3).map((c) => (
                            <a
                              key={c.id}
                              href={`/courses/${c.id}`}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
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
            <div>Competência</div>
            <div>Fonte</div>
            <div>Anterior</div>
            <div>Novo</div>
            <div>Data</div>
          </div>
          {evolution.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem histórico de evolução
            </div>
          ) : (
            evolution.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[1fr_120px_80px_80px_160px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="text-sm text-gray-900">
                  {e.competency?.name}
                </div>
                <div className="text-xs text-gray-500">{e.source}</div>
                <div className="text-xs font-mono text-gray-400">
                  {e.previousLevel} →{' '}
                </div>
                <div
                  className={`text-xs font-mono font-semibold ${e.newLevel > e.previousLevel ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {e.newLevel}
                </div>
                <div className="text-xs text-gray-400">
                  {fmtDate(e.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
