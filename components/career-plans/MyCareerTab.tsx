// components/career-plans/MyCareerTab.tsx
// Tab "Minha Carreira": plano activo, roadmap, gaps, cursos e metas
// do PDI. Extraído de app/(platform)/career-plans/page.tsx. Vista
// puramente de apresentação — os dados vêm todos do container.

'use client';

import { ArrowUpRight, BookOpen, ChevronRight, Target } from 'lucide-react';
import { CareerRoadmap } from './CareerRoadmap';
import { GoalCard } from './GoalCard';
import { SkillGapList } from './SkillGapList';
import type { CareerPlan } from './types';

interface MyCareerTabProps {
  loading: boolean;
  myPlan: CareerPlan | null;
  onGoalProgress: (goalId: number, progress: number) => void;
}

export function MyCareerTab({
  loading,
  myPlan,
  onGoalProgress,
}: MyCareerTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!myPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
        <Target size={48} className="mb-4 opacity-30" />
        <p className="text-sm font-medium">Sem plano de carreira activo</p>
        <p className="text-xs mt-1">
          O teu gestor ou RH irá criar um plano para ti
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">
              Plano Activo
            </p>
            <h2 className="text-xl font-bold mt-1">{myPlan.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-blue-200 text-sm">
              {myPlan.currentRole && <span>{myPlan.currentRole.name}</span>}
              {myPlan.targetRole && (
                <>
                  <ChevronRight size={14} />
                  <span className="text-white font-medium">
                    {myPlan.targetRole.name}
                  </span>
                </>
              )}
            </div>
          </div>
          {myPlan.readiness && (
            <div className="text-right bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-3xl font-bold">{myPlan.readiness.score}%</p>
              <p className="text-blue-200 text-xs mt-0.5">
                {myPlan.readiness.readinessEmoji} Prontidão
              </p>
            </div>
          )}
        </div>

        {myPlan.readiness && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-blue-200 mb-1">
              <span>
                Progresso para &quot;{myPlan.readiness.targetRoleName}&quot;
              </span>
              <span>
                {myPlan.readiness.metRequirements}/
                {myPlan.readiness.totalRequirements} requisitos
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${myPlan.readiness.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Trilha de Carreira
        </h3>
        <CareerRoadmap plan={myPlan} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skill Gaps */}
        {myPlan.readiness &&
          (myPlan.readiness.missingSkills.length > 0 ||
            myPlan.readiness.skillGaps.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Gaps a Desenvolver
              </h3>
              {myPlan.readiness.missingSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-red-600 font-semibold mb-2">
                    Obrigatórias
                  </p>
                  <SkillGapList
                    gaps={myPlan.readiness.missingSkills}
                    mandatory
                  />
                </div>
              )}
              {myPlan.readiness.skillGaps.length > 0 && (
                <div>
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    Complementares
                  </p>
                  <SkillGapList gaps={myPlan.readiness.skillGaps.slice(0, 3)} />
                </div>
              )}
            </div>
          )}

        {/* Cursos recomendados */}
        {(myPlan.readiness?.recommendedCourses.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Cursos Recomendados
            </h3>
            <div className="space-y-2">
              {myPlan.readiness!.recommendedCourses.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <BookOpen size={14} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-800 font-medium">
                    {c.title}
                  </span>
                  <ArrowUpRight size={12} className="text-blue-500 ml-auto" />
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
            {myPlan.goals.filter((g) => g.status === 'COMPLETED').length}/
            {myPlan.goals.length} concluídas
          </div>
        </div>
        {myPlan.goals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma meta adicionada
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myPlan.goals.map((g) => (
              <GoalCard key={g.id} goal={g} onUpdateProgress={onGoalProgress} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
