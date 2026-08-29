// components/career-plans/MyCareerTab.tsx
// Tab "Minha Carreira": plano activo, roadmap, gaps, cursos e metas
// do PDI. Extraído de app/(platform)/career-plans/page.tsx. Vista
// puramente de apresentação — os dados vêm todos do container.

'use client';

import { ArrowUpRight, BookOpen, ChevronRight, Target } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <Skeleton
        rows={3}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-32 rounded-card"
      />
    );
  }

  if (!myPlan) {
    return (
      <EmptyState
        title="Sem plano de carreira activo"
        description="O teu gestor ou RH irá criar um plano para ti"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-primary rounded-panel p-6 text-canvas shadow-resting">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-canvas/70 text-xs font-medium uppercase tracking-widest">
              Plano Activo
            </p>
            <h2 className="text-xl font-display font-bold mt-1">
              {myPlan.title}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-canvas/70 text-sm">
              {myPlan.currentRole && <span>{myPlan.currentRole.name}</span>}
              {myPlan.targetRole && (
                <>
                  <ChevronRight size={14} strokeWidth={1.75} />
                  <span className="text-canvas font-medium">
                    {myPlan.targetRole.name}
                  </span>
                </>
              )}
            </div>
          </div>
          {myPlan.readiness && (
            <div className="text-right bg-canvas/10 rounded-card px-4 py-3">
              <p className="text-3xl font-bold">{myPlan.readiness.score}%</p>
              <p className="text-canvas/70 text-xs mt-0.5">
                {myPlan.readiness.readinessEmoji} Prontidão
              </p>
            </div>
          )}
        </div>

        {myPlan.readiness && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-canvas/70 mb-1">
              <span>
                Progresso para &quot;{myPlan.readiness.targetRoleName}&quot;
              </span>
              <span>
                {myPlan.readiness.metRequirements}/
                {myPlan.readiness.totalRequirements} requisitos
              </span>
            </div>
            <ProgressBar
              value={myPlan.readiness.score}
              className="bg-canvas/20"
            />
          </div>
        )}
      </div>

      {/* Roadmap */}
      <Card>
        <CardBody>
          <h3 className="text-sm font-display font-semibold text-ink mb-3">
            Trilha de Carreira
          </h3>
          <CareerRoadmap plan={myPlan} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skill Gaps */}
        {myPlan.readiness &&
          (myPlan.readiness.missingSkills.length > 0 ||
            myPlan.readiness.skillGaps.length > 0) && (
            <Card>
              <CardBody>
                <h3 className="text-sm font-display font-semibold text-ink mb-3">
                  Gaps a Desenvolver
                </h3>
                {myPlan.readiness.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-danger-ink font-semibold mb-2">
                      Obrigatórias
                    </p>
                    <SkillGapList gaps={myPlan.readiness.missingSkills} />
                  </div>
                )}
                {myPlan.readiness.skillGaps.length > 0 && (
                  <div>
                    <p className="text-xs text-warning-ink font-semibold mb-2">
                      Complementares
                    </p>
                    <SkillGapList
                      gaps={myPlan.readiness.skillGaps.slice(0, 3)}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          )}

        {/* Cursos recomendados */}
        {(myPlan.readiness?.recommendedCourses.length ?? 0) > 0 && (
          <Card>
            <CardBody>
              <h3 className="text-sm font-display font-semibold text-ink mb-3">
                Cursos Recomendados
              </h3>
              <div className="space-y-2">
                {myPlan.readiness!.recommendedCourses.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-2.5 bg-primary-subtle rounded-control hover:brightness-95 transition-[filter] cursor-pointer"
                  >
                    <BookOpen
                      size={14}
                      strokeWidth={1.75}
                      className="text-primary flex-shrink-0"
                    />
                    <span className="text-sm text-primary font-medium">
                      {c.title}
                    </span>
                    <ArrowUpRight
                      size={12}
                      strokeWidth={1.75}
                      className="text-primary ml-auto"
                    />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Goals */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-ink">
              Metas do PDI
            </h3>
            <div className="text-xs text-ink-faint">
              {myPlan.goals.filter((g) => g.status === 'COMPLETED').length}/
              {myPlan.goals.length} concluídas
            </div>
          </div>
          {myPlan.goals.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-4">
              Nenhuma meta adicionada
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myPlan.goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onUpdateProgress={onGoalProgress}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
