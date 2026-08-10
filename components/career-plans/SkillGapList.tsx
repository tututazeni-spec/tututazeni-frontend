// components/career-plans/SkillGapList.tsx
// Lista de gaps de skill (obrigatórios ou complementares). Extraído
// de app/(platform)/career-plans/page.tsx.

'use client';

import type { SkillGap } from './types';

interface SkillGapListProps {
  gaps: SkillGap[];
  mandatory?: boolean;
}

export function SkillGapList({ gaps, mandatory }: SkillGapListProps) {
  if (!gaps.length) return null;
  return (
    <div className="space-y-2">
      {gaps.map((g) => (
        <div key={g.skillId} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-700 font-medium">
                {g.skillName}
              </span>
              <span className="text-xs text-gray-400">
                {g.currentLevel}/{g.requiredLevel}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${mandatory ? 'bg-red-400' : 'bg-amber-400'}`}
                style={{
                  width: `${(g.currentLevel / g.requiredLevel) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-400 w-12 text-right">
            -{g.gap} nível{g.gap > 1 ? 'is' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
