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

import { Scale, User, UserCheck, Users } from 'lucide-react';
import type { CycleInfo, ParticipantProfile, ParticipantResult } from './types';
import { NavyHeroCard } from '@/components/ui/NavyHeroCard';
import { Avatar } from '@/components/ui/Avatar';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { PendingEvaluationsCard } from './PendingEvaluationsCard';

export interface OverviewTabProps {
  result: ParticipantResult | null;
  participant?: ParticipantProfile;
  cycle: CycleInfo | null;
  cycleId?: string;
}

export function OverviewTab({
  result,
  participant,
  cycle,
  cycleId,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Participant header — sempre o próprio, independente de já haver
          resultado calculado. */}
      <NavyHeroCard>
        {participant ? (
          <>
            <div className="relative">
              <Avatar
                name={participant.fullName}
                url={participant.avatarUrl ?? undefined}
                size="lg"
              />
            </div>
            <div className="relative">
              <div className="text-xl font-bold text-white tracking-tight">
                {participant.fullName}
              </div>
              <div className="text-sm text-white mt-0.5">
                {participant.position} · {participant.department}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-white">A carregar o teu perfil…</div>
        )}
      </NavyHeroCard>

      {cycleId && <PendingEvaluationsCard cycleId={cycleId} />}

      {!result && (
        <div className="overflow-hidden rounded-card border border-[#0F1F3D] bg-surface p-5 font-body text-sm text-[#0F1F3D]">
          <h3 className="-mx-5 -mt-5 mb-3 bg-[#0F1F3D]/60 px-5 py-3 font-semibold text-white">
            Resultados
          </h3>
          {cycle
            ? 'Ainda não há resultado calculado para este ciclo. O RH precisa de correr o cálculo de resultados depois de as avaliações serem submetidas.'
            : 'Ainda não existe nenhum ciclo de avaliação 360º.'}
        </div>
      )}

      {result && (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              icon={Scale}
              tone="blue"
              label="Pontuação Ponderada"
              value={result.weightedScore.toFixed(1)}
              sub="/ 5.0"
            />
            <NavyStatCard
              icon={User}
              tone="orange"
              label="Autoavaliação"
              value={result.selfScore.toFixed(1)}
              sub="/ 5.0"
            />
            <NavyStatCard
              icon={UserCheck}
              tone="green"
              label="Gestor"
              value={result.managerScore.toFixed(1)}
              sub="/ 5.0"
            />
            <NavyStatCard
              icon={Users}
              tone="red"
              label="Pares"
              value={result.peerScore.toFixed(1)}
              sub="/ 5.0"
            />
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
              <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
                Pontos Fortes
              </h3>
              {result.strengths.length === 0 && (
                <div className="text-sm text-ink-muted">
                  Sem dados suficientes ainda.
                </div>
              )}
              {result.strengths.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center mb-2.5"
                >
                  <div>
                    <span className="text-sm font-semibold text-ink">
                      {s.name}
                    </span>
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
            <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
              <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
                Oportunidades de Desenvolvimento
              </h3>
              {result.gaps.length === 0 && (
                <div className="text-sm text-ink-muted">
                  Sem dados suficientes ainda.
                </div>
              )}
              {result.gaps.map((g) => (
                <div
                  key={g.id}
                  className="flex justify-between items-center mb-2.5"
                >
                  <div>
                    <span className="text-sm font-semibold text-ink">
                      {g.name}
                    </span>
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
        </>
      )}
    </div>
  );
}
