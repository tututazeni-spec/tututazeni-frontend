// components/competency-map/MySkillsTab.tsx
// Separador "Minhas Skills" — score, radar e skills por tipo. Vista
// pura (dados recebidos do container). Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { Plus, Target } from 'lucide-react';
import { TYPE_CONFIG } from './constants';
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
  color: string;
  bar: string;
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

  if (!myMap) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
        <Target size={48} className="mb-4 opacity-30" />
        <p className="text-sm font-medium">Sem skills avaliadas</p>
        <button
          onClick={onAssess}
          className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50"
        >
          <Plus size={14} /> Fazer primeira avaliação
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Perfil de Competências
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {myMap.total} skills avaliadas · Score médio:{' '}
                {myMap.avgScore.toFixed(1)}/5
              </p>

              {rcfg && gap && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-semibold ${rcfg.color}`}>
                      {rcfg.emoji} {rcfg.label} para &quot;
                      {gap.targetRole}&quot;
                    </span>
                    <span className="font-bold text-gray-900">
                      {gap.readinessScore}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rcfg.bar}`}
                      style={{ width: `${gap.readinessScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.bg}`}
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
        </div>

        {/* Radar */}
        {radar && radar.radarByType.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 self-start">
              Radar
            </h3>
            <RadarChart data={radar} />
          </div>
        )}
      </div>

      {/* Skills by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(myMap.byType ?? {}).map(([type, skills]) => {
          const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
          return (
            <div
              key={type}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-400">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
