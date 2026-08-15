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
      <div className="rounded-xl border border-indigo-800 bg-gradient-to-r from-slate-900 to-indigo-900 p-7 flex items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{
              background:
                'linear-gradient(135deg, rgb(79, 70, 229), rgb(124, 58, 237))',
            }}
          >
            {result.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100 tracking-tight">
              {result.fullName}
            </div>
            <div className="text-sm text-slate-400 mt-0.5">
              {result.position} · {result.department}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {result.isEligiblePromotion && (
            <div className="rounded-lg border border-green-600 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-green-400">
              ✓ Elegível Promoção
            </div>
          )}
          {result.isEligibleBonus && (
            <div className="rounded-lg border border-amber-600 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-amber-300">
              ✓ Elegível Bónus
            </div>
          )}
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Score Ponderado',
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
            className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-4.5"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {s.label}
            </div>
            <div
              className="text-3xl font-bold leading-tight tracking-tighter"
              style={{ color: s.color }}
            >
              {s.value.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">/ 5.0</div>
          </div>
        ))}
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-green-900 bg-slate-800 px-5 py-4.5">
          <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3.5">
            ◆ Pontos Fortes
          </div>
          {result.strengths.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center mb-2.5"
            >
              <div>
                <span className="text-sm font-semibold text-slate-100">
                  {s.name}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  {s.category}
                </span>
              </div>
              <span className="text-sm font-bold text-green-400">
                {s.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-red-900 bg-slate-800 px-5 py-4.5">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3.5">
            ▲ Oportunidades de Desenvolvimento
          </div>
          {result.gaps.map((g) => (
            <div
              key={g.id}
              className="flex justify-between items-center mb-2.5"
            >
              <div>
                <span className="text-sm font-semibold text-slate-100">
                  {g.name}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  {g.category}
                </span>
              </div>
              <span className="text-sm font-bold text-red-400">
                {g.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle progress */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-5">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-100">{cycle.name}</div>
            <div className="text-xs text-slate-500">
              {cycle.startDate} → {cycle.endDate}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {cycle.completedCount}/{cycle.participantsCount} concluídos
          </div>
        </div>
        <div className="bg-slate-900 rounded h-2 overflow-hidden mb-1.5">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${completionPct}%`,
              background:
                'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
            }}
          />
        </div>
        <div className="text-xs font-semibold text-indigo-400">
          {completionPct}% de participação
        </div>
      </div>
    </div>
  );
}
