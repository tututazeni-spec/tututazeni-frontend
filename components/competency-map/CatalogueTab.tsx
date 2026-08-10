// components/competency-map/CatalogueTab.tsx
// Separador "Catálogo" — lista de skills disponíveis. Vista pura
// (dados recebidos do container). Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { TYPE_CONFIG } from './constants';
import type { CatalogueSkill } from './types';

interface CatalogueTabProps {
  allSkills: CatalogueSkill[];
}

export function CatalogueTab({ allSkills }: CatalogueTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Catálogo de Skills ({allSkills.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {allSkills.map((s) => {
          const cfg = TYPE_CONFIG[s.type];
          return (
            <div
              key={s.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {s.name}
              </span>
              {s.category && (
                <span className="text-xs text-gray-400">{s.category.name}</span>
              )}
              <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                <span>{s._count?.employeeSkills ?? 0} avaliados</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
