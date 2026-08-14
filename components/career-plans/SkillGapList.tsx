// components/career-plans/SkillGapList.tsx
// Lista de gaps de skill (obrigatórios ou complementares). Extraído
// de app/(platform)/career-plans/page.tsx.
//
// A cor da barra (mandatória=vermelho / complementar=âmbar) era só
// decorativa — reforçava um sentido já comunicado pelo cabeçalho da
// secção onde a lista é usada ("Obrigatórias"/"Complementares" em
// MyCareerTab e SimulateModal). Passa a usar o ProgressBar mono-cor da
// fundação; a prop `mandatory` deixa de ser necessária aqui.

'use client';

import { ProgressBar } from '@/components/ui/ProgressBar';
import type { SkillGap } from './types';

interface SkillGapListProps {
  gaps: SkillGap[];
}

export function SkillGapList({ gaps }: SkillGapListProps) {
  if (!gaps.length) return null;
  return (
    <div className="space-y-2">
      {gaps.map((g) => (
        <div key={g.skillId} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="font-body text-xs font-medium text-ink">
                {g.skillName}
              </span>
              <span className="font-body text-xs text-ink-faint">
                {g.currentLevel}/{g.requiredLevel}
              </span>
            </div>
            <ProgressBar value={(g.currentLevel / g.requiredLevel) * 100} />
          </div>
          <span className="w-12 text-right font-body text-xs text-ink-faint">
            -{g.gap} nível{g.gap > 1 ? 'is' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
