// components/evaluation360/OverviewTab.tsx
// Cabeçalho do participante, scores e pontos fortes/gaps — tudo vindo de
// avaliações reais (ver hooks/useEvaluation360.ts).
//
// Regra do produto: ninguém vê o resultado de outro utilizador — nem
// ADMIN nem RH têm excepção (evaluation360.service.ts#getParticipantResult
// devolve 403 para qualquer participantId que não seja o do próprio
// requester). Por isso este separador já não tem nenhum selector de
// colaborador — mostra sempre e só o resultado de quem está autenticado.
//
// O cartão de identidade (nome, departamento, foto carregada pelo próprio —
// Avatar com fallback de iniciais) usa `participant`, que vem sempre
// preenchido (é o próprio utilizador autenticado, via useCurrentUser) — não
// depende de já existir `result` calculado. Só as pontuações/pontos
// fortes/gaps é que ficam por mostrar enquanto o RH não correr o cálculo do
// ciclo.
//
// Não repete o cartão de progresso do ciclo (nome/datas/% concluído) — esse
// já aparece uma única vez no cabeçalho da página (Evaluation360View, "Ciclo:
// {cycle.name}"); tê-lo aqui também era um cartão duplicado com o mesmo
// ciclo, não dados fictícios diferentes.

'use client';

import type { CycleInfo, ParticipantProfile, ParticipantResult } from './types';
import { COLORS } from './colors';
import { Avatar } from '@/components/ui/Avatar';
import { PendingEvaluationsCard } from './PendingEvaluationsCard';

export interface OverviewTabProps {
  result: ParticipantResult | null;
  participant?: ParticipantProfile;
  cycle: CycleInfo | null;
  cycleId?: string;
}

export function OverviewTab({ result, participant, cycle, cycleId }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Participant header — sempre o próprio, independente de já haver
          resultado calculado. */}
      <div className="rounded-xl border border-border bg-surface p-7 flex items-center gap-4">
        {participant ? (
          <>
            <Avatar name={participant.fullName} url={participant.avatarUrl ?? undefined} size="lg" />
            <div>
              <div className="text-xl font-bold text-ink tracking-tight">
                {participant.fullName}
              </div>
              <div className="text-sm text-ink-muted mt-0.5">
                {participant.position} · {participant.department}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-ink-muted">A carregar o teu perfil…</div>
        )}
      </div>

      {cycleId && <PendingEvaluationsCard cycleId={cycleId} />}

      {!result && (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">
          {cycle
            ? 'Ainda não há resultado calculado para este ciclo. O RH precisa de correr o cálculo de resultados depois de as avaliações serem submetidas.'
            : 'Ainda não existe nenhum ciclo de avaliação 360º.'}
        </div>
      )}

      {result && (
        <>
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
              {result.strengths.length === 0 && (
                <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>
              )}
              {result.strengths.map((s) => (
                <div key={s.id} className="flex justify-between items-center mb-2.5">
                  <div>
                    <span className="text-sm font-semibold text-ink">{s.name}</span>
                    <span className="text-xs text-ink-muted ml-2">{s.category}</span>
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
              {result.gaps.length === 0 && (
                <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>
              )}
              {result.gaps.map((g) => (
                <div key={g.id} className="flex justify-between items-center mb-2.5">
                  <div>
                    <span className="text-sm font-semibold text-ink">{g.name}</span>
                    <span className="text-xs text-ink-muted ml-2">{g.category}</span>
                  </div>
                  <span className="text-sm font-bold text-danger-ink">
                    {g.othersScore.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
