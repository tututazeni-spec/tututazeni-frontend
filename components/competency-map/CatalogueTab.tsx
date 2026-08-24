// components/competency-map/CatalogueTab.tsx
// Separador "Catálogo" — lista de skills disponíveis. Vista pura
// (dados recebidos do container). Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { Card } from '@/components/ui/Card';
import { TYPE_CONFIG } from './constants';
import type { CatalogueSkill } from './types';

interface CatalogueTabProps {
  allSkills: CatalogueSkill[];
}

export function CatalogueTab({ allSkills }: CatalogueTabProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Catálogo de Habilidades ({allSkills.length})
        </h2>
      </div>
      <div className="divide-y divide-border">
        {allSkills.map((s) => {
          const cfg = TYPE_CONFIG[s.type];
          return (
            <div
              key={s.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-surface-sunken/50 transition-colors"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
              <span className="text-sm font-medium text-ink">{s.name}</span>
              {s.category && (
                <span className="text-xs text-ink-faint">
                  {s.category.name}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2 text-xs text-ink-faint">
                <span>{s._count?.employeeSkills ?? 0} avaliados</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
