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
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  PRIORITY_CONFIG,
  READINESS_INTENT_CLASSES,
  type ReadinessIntent,
} from './constants';
import type { GapAnalysis } from './types';

interface ReadinessCfg {
  label: string;
  intent: ReadinessIntent;
  emoji: string;
}

interface GapTabProps {
  gap: GapAnalysis;
  rcfg: ReadinessCfg | null;
}

export function GapTab({ gap, rcfg }: GapTabProps) {
  const intentCls = rcfg ? READINESS_INTENT_CLASSES[rcfg.intent] : null;

  return (
    <div className="space-y-4">
      {/* Readiness summary */}
      {rcfg && intentCls && (
        <div className={`rounded-card border p-5 ${intentCls.panel}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-ink">
              {rcfg.emoji} Prontidão: &quot;{gap.targetRole}&quot;
            </p>
            <span className={`text-2xl font-bold ${intentCls.text}`}>
              {gap.readinessScore}%
            </span>
          </div>
          <ProgressBar value={gap.readinessScore} />
        </div>
      )}

      {/* Mandatory gaps */}
      {gap.gaps.mandatory.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-danger-ink mb-3 flex items-center gap-2">
            <AlertCircle size={15} /> Skills Obrigatórias em Falta (
            {gap.gaps.mandatory.length})
          </h3>
          <div className="space-y-3">
            {gap.gaps.mandatory.map((g) => (
              <div key={g.skillId} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">
                      {g.skillName}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        value={g.priority}
                        map={PRIORITY_CONFIG}
                        variant="pill"
                      />
                      <span className="text-xs text-ink-muted">
                        {g.currentLevel}→{g.requiredLevel}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-danger/50 rounded-full"
                      style={{ width: `${(g.currentLevel / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-danger"
                      style={{ left: `${(g.requiredLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Optional gaps */}
      {gap.gaps.optional.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-warning-ink mb-3">
            Skills a Desenvolver ({gap.gaps.optional.length})
          </h3>
          <div className="space-y-3">
            {gap.gaps.optional.map((g) => (
              <div key={g.skillId} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-ink">{g.skillName}</span>
                    <span className="text-xs text-ink-faint">
                      {g.currentLevel}→{g.requiredLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-warning/50 rounded-full"
                      style={{ width: `${(g.currentLevel / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-warning"
                      style={{ left: `${(g.requiredLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommended courses */}
      {gap.recommendedCourses.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <BookOpen size={15} className="text-primary" /> Cursos Recomendados
          </h3>
          <div className="space-y-2">
            {gap.recommendedCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 bg-primary-subtle rounded-control hover:brightness-95 transition-all cursor-pointer"
              >
                <BookOpen size={13} className="text-primary flex-shrink-0" />
                <span className="text-sm text-primary font-medium">
                  {c.title}
                </span>
                <ArrowUpRight size={12} className="text-primary ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {gap.gaps.mandatory.length === 0 && gap.gaps.optional.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="Todos os requisitos cumpridos!"
          description="Não há gaps de competência para o cargo-alvo."
          className="border-success/40"
        />
      )}
    </div>
  );
}
