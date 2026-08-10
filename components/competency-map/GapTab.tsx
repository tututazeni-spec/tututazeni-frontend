// components/competency-map/GapTab.tsx
// Separador "Gap Analysis" — prontidão, gaps obrigatórios/opcionais e
// cursos recomendados. Vista pura (dados recebidos do container).
// Extraído de app/(platform)/competency-map/page.tsx.

'use client';

import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PRIORITY_CONFIG } from './constants';
import type { GapAnalysis } from './types';

interface ReadinessCfg {
  label: string;
  color: string;
  bar: string;
  emoji: string;
}

interface GapTabProps {
  gap: GapAnalysis;
  rcfg: ReadinessCfg | null;
}

export function GapTab({ gap, rcfg }: GapTabProps) {
  return (
    <div className="space-y-4">
      {/* Readiness summary */}
      {rcfg && (
        <div
          className={`rounded-2xl border p-5 ${rcfg.bar === 'bg-emerald-500' ? 'bg-emerald-50 border-emerald-200' : rcfg.bar === 'bg-amber-500' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-900">
              {rcfg.emoji} Prontidão: &quot;{gap.targetRole}&quot;
            </p>
            <span className={`text-2xl font-bold ${rcfg.color}`}>
              {gap.readinessScore}%
            </span>
          </div>
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rcfg.bar}`}
              style={{ width: `${gap.readinessScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Mandatory gaps */}
      {gap.gaps.mandatory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle size={15} /> Skills Obrigatórias em Falta (
            {gap.gaps.mandatory.length})
          </h3>
          <div className="space-y-3">
            {gap.gaps.mandatory.map((g) => (
              <div key={g.skillId} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {g.skillName}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        value={g.priority}
                        map={PRIORITY_CONFIG}
                        variant="pill"
                      />
                      <span className="text-xs text-gray-500">
                        {g.currentLevel}→{g.requiredLevel}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-red-300 rounded-full"
                      style={{ width: `${(g.currentLevel / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-red-600"
                      style={{ left: `${(g.requiredLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional gaps */}
      {gap.gaps.optional.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-amber-700 mb-3">
            Skills a Desenvolver ({gap.gaps.optional.length})
          </h3>
          <div className="space-y-3">
            {gap.gaps.optional.map((g) => (
              <div key={g.skillId} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-800">{g.skillName}</span>
                    <span className="text-xs text-gray-400">
                      {g.currentLevel}→{g.requiredLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(g.currentLevel / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-600"
                      style={{ left: `${(g.requiredLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended courses */}
      {gap.recommendedCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen size={15} className="text-blue-600" /> Cursos Recomendados
          </h3>
          <div className="space-y-2">
            {gap.recommendedCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <BookOpen size={13} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-800 font-medium">
                  {c.title}
                </span>
                <ArrowUpRight size={12} className="text-blue-500 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {gap.gaps.mandatory.length === 0 && gap.gaps.optional.length === 0 && (
        <div className="flex flex-col items-center py-16 text-gray-400 bg-white rounded-2xl border border-emerald-100">
          <CheckCircle2
            size={40}
            className="mb-3 text-emerald-500 opacity-70"
          />
          <p className="text-sm font-medium text-emerald-700">
            Todos os requisitos cumpridos!
          </p>
        </div>
      )}
    </div>
  );
}
