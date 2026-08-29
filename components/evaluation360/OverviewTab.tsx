// components/evaluation360/OverviewTab.tsx
// Cabeçalho do participante, scores, pontos fortes/gaps e progresso do
// ciclo. Extraído de app/(platform)/evaluation360/page.tsx.

'use client';

import type { CycleInfo, ParticipantResult } from './types';
import { COLORS } from './colors';

export interface OverviewTabProps {
  result: ParticipantResult;
  cycle: CycleInfo;
}

export function OverviewTab({ result, cycle }: OverviewTabProps) {
  const completionPct = Math.round(
    (cycle.completedCount / cycle.participantsCount) * 100,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Participant header */}
      <div className="rounded-xl border border-border bg-surface p-7 flex items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-canvas"
            style={{
              background:
                'linear-gradient(135deg, rgb(79, 70, 229), rgb(124, 58, 237))',
            }}
          >
            {result.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-bold text-ink tracking-tight">
              {result.fullName}
            </div>
            <div className="text-sm text-ink-muted mt-0.5">
              {result.position} · {result.department}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {result.isEligiblePromotion && (
            <div className="rounded-lg border border-border bg-surface-sunken px-3.5 py-1.5 text-xs font-bold text-success-ink">
              ✓ Elegível Promoção
            </div>
          )}
          {result.isEligibleBonus && (
            <div className="rounded-lg border border-border bg-surface-sunken px-3.5 py-1.5 text-xs font-bold text-warning-ink">
              ✓ Elegível Bónus
            </div>
          )}
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Pontuação Ponderada',
            value: result.weightedScore,
            color: 'rgb(129, 140, 248)',
          },
          {
            label: 'Autoavaliação',
            value: result.selfScore,
            color: COLORS.self,
          },
          {
            label: 'Gestor',
            value: result.managerScore,
            color: 'rgb(52, 211, 153)',
          },
          { label: 'Pares', value: result.peerScore, color: COLORS.peer },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-surface px-5 py-4.5"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              {s.label}
            </div>
            <div
              className="text-3xl font-bold leading-tight tracking-tighter"
              style={{ color: s.color }}
            >
              {s.value.toFixed(1)}
            </div>
            <div className="text-xs text-ink-muted mt-1.5">/ 5.0</div>
          </div>
        ))}
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-success-ink uppercase tracking-wider mb-3.5">
            Pontos Fortes
          </div>
          {result.strengths.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center mb-2.5"
            >
              <div>
                <span className="text-sm font-semibold text-ink">{s.name}</span>
                <span className="text-xs text-ink-muted ml-2">
                  {s.category}
                </span>
              </div>
              <span className="text-sm font-bold text-success-ink">
                {s.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-danger-ink uppercase tracking-wider mb-3.5">
            Oportunidades de Desenvolvimento
          </div>
          {result.gaps.map((g) => (
            <div
              key={g.id}
              className="flex justify-between items-center mb-2.5"
            >
              <div>
                <span className="text-sm font-semibold text-ink">{g.name}</span>
                <span className="text-xs text-ink-muted ml-2">
                  {g.category}
                </span>
              </div>
              <span className="text-sm font-bold text-danger-ink">
                {g.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle progress */}
      <div className="rounded-lg border border-border bg-surface px-6 py-5">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-ink">{cycle.name}</div>
            <div className="text-xs text-ink-muted">
              {cycle.startDate} → {cycle.endDate}
            </div>
          </div>
          <div className="text-xs text-ink-muted">
            {cycle.completedCount}/{cycle.participantsCount} concluídos
          </div>
        </div>
        <div className="bg-surface-sunken rounded h-2 overflow-hidden mb-1.5">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${completionPct}%`,
              background:
                'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
            }}
          />
        </div>
        <div className="text-xs font-semibold text-primary">
          {completionPct}% de participação
        </div>
      </div>
    </div>
  );
}
