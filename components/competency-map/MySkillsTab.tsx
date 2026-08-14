// components/competency-map/MySkillsTab.tsx
// Separador "Minhas Skills" — score, radar e skills por tipo. Vista
// pura (dados recebidos do container). Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  READINESS_INTENT_CLASSES,
  TYPE_CONFIG,
  type ReadinessIntent,
} from './constants';
import { RadarChart } from './RadarChart';
import { SkillBar } from './SkillBar';
import type {
  CompetencyMap,
  EmployeeSkill,
  GapAnalysis,
  RadarData,
} from './types';

interface ReadinessCfg {
  label: string;
  intent: ReadinessIntent;
  emoji: string;
}

interface MySkillsTabProps {
  loading: boolean;
  myMap: CompetencyMap | null;
  radar: RadarData | null;
  gap: GapAnalysis | undefined;
  rcfg: ReadinessCfg | null;
  onAssess: () => void;
}

export function MySkillsTab({
  loading,
  myMap,
  radar,
  gap,
  rcfg,
  onAssess,
}: MySkillsTabProps) {
  const intentCls = rcfg ? READINESS_INTENT_CLASSES[rcfg.intent] : null;

  if (loading) {
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="h-32 bg-surface border border-border rounded-card"
      />
    );
  }

  if (!myMap) {
    return (
      <EmptyState
        icon={Target}
        title="Sem skills avaliadas"
        description="Ainda não tens nenhuma competência avaliada."
        action={{ label: 'Fazer primeira avaliação', onClick: onAssess }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score card */}
        <Card className="md:col-span-2 p-5">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink mb-1">
                Perfil de Competências
              </h3>
              <p className="text-xs text-ink-faint mb-4">
                {myMap.total} skills avaliadas · Score médio:{' '}
                {myMap.avgScore.toFixed(1)}/5
              </p>

              {rcfg && intentCls && gap && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-semibold ${intentCls.text}`}>
                      {rcfg.emoji} {rcfg.label} para &quot;
                      {gap.targetRole}&quot;
                    </span>
                    <span className="font-bold text-ink">
                      {gap.readinessScore}%
                    </span>
                  </div>
                  <ProgressBar value={gap.readinessScore} />
                  <p className="text-xs text-ink-faint mt-1">
                    {gap.metRequirements}/{gap.totalRequirements} requisitos
                    cumpridos
                  </p>
                </div>
              )}

              {/* By type pills */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(myMap.byType ?? {}).map(([type, skills]) => {
                  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                  const avg = skills.length
                    ? +(
                        skills.reduce(
                          (a: number, s: EmployeeSkill) => a + s.currentLevel,
                          0,
                        ) / skills.length
                      ).toFixed(1)
                    : 0;
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-control border border-border ${cfg.bg}`}
                    >
                      <span className={`text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-xs ${cfg.color} opacity-70`}>
                        {avg}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Radar */}
        {radar && radar.radarByType.length > 0 && (
          <Card className="p-5 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-ink mb-3 self-start">
              Radar
            </h3>
            <RadarChart data={radar} />
          </Card>
        )}
      </div>

      {/* Skills by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(myMap.byType ?? {}).map(([type, skills]) => {
          const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
          return (
            <Card key={type} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-ink-faint">
                  {skills.length} skills
                </span>
              </div>
              <div className="space-y-3">
                {skills.slice(0, 6).map((s: EmployeeSkill) => {
                  const gapEntry = gap?.gaps.all.find(
                    (g) => g.skillId === s.skillId,
                  );
                  return (
                    <SkillBar
                      key={s.skillId}
                      skill={s}
                      requiredLevel={gapEntry?.requiredLevel}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
