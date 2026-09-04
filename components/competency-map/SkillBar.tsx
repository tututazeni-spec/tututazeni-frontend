// components/competency-map/SkillBar.tsx
// Barra de nível de uma skill (actual vs. exigido). Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { AlertTriangle } from 'lucide-react';
import type { EmployeeSkill } from './types';

interface SkillBarProps {
  skill: EmployeeSkill;
  requiredLevel?: number;
}

export function SkillBar({ skill, requiredLevel }: SkillBarProps) {
  const max = skill.skill.maxLevel;
  const current = skill.currentLevel;
  const required = requiredLevel;
  const pct = (current / max) * 100;
  const hasGap = required && current < required;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-ink-muted font-medium truncate">
            {skill.skill.name}
          </span>
          <span className="text-xs font-semibold text-ink flex-shrink-0 ml-2">
            {current}/{max}
          </span>
        </div>
        <div className="relative h-2 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hasGap ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
          {required && (
            <div
              className="absolute top-0 h-full w-0.5 bg-danger"
              style={{ left: `${(required / max) * 100}%` }}
            />
          )}
        </div>
      </div>
      {!skill.managerValidated && skill.skill.type === 'TECHNICAL' && (
        <AlertTriangle
          size={13}
          strokeWidth={1.75}
          className="flex-shrink-0 text-warning"
        />
      )}
    </div>
  );
}
