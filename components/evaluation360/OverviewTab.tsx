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
      <div className="relative overflow-hidden rounded-xl border border-[#0A2342]/80 bg-[#0A2342]/80 p-7 flex items-center gap-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 320 160"
          preserveAspectRatio="xMaxYMid slice"
          className="pointer-events-none absolute right-0 top-0 h-full w-auto max-w-[55%]"
          fill="none"
        >
          <circle cx="270" cy="30" r="90" fill="#12356B" fillOpacity="0.55" />
          <circle cx="300" cy="140" r="70" fill="#1B4A8C" fillOpacity="0.4" />
          <rect x="150" y="70" width="60" height="60" rx="8" transform="rotate(20 180 100)" stroke="#2F6AB8" strokeOpacity="0.5" strokeWidth="2" />
          <path d="M120 150 L180 90 L220 120 L290 50" stroke="#3B7DD0" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="180" cy="90" r="4" fill="#3B7DD0" fillOpacity="0.8" />
          <circle cx="220" cy="120" r="4" fill="#3B7DD0" fillOpacity="0.8" />
          <circle cx="290" cy="50" r="4" fill="#3B7DD0" fillOpacity="0.8" />
          <g fill="#2F6AB8" fillOpacity="0.45">
            <rect x="236" y="104" width="10" height="36" rx="2" />
            <rect x="252" y="88" width="10" height="52" rx="2" />
            <rect x="268" y="72" width="10" height="68" rx="2" />
          </g>
        </svg>
        <svg
          aria-hidden="true"
          viewBox="0 0 240 160"
          preserveAspectRatio="xMinYMid slice"
          className="pointer-events-none absolute left-0 top-0 h-full w-auto max-w-[40%]"
          fill="none"
        >
          <circle cx="-10" cy="40" r="80" fill="#12356B" fillOpacity="0.5" />
          <circle cx="30" cy="150" r="60" fill="#1B4A8C" fillOpacity="0.35" />
          <path d="M0 110 Q60 70 120 100 T240 60" stroke="#3B7DD0" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 130 Q60 90 120 120 T240 80" stroke="#2F6AB8" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          <rect x="120" y="14" width="44" height="44" rx="8" transform="rotate(-18 142 36)" stroke="#2F6AB8" strokeOpacity="0.45" strokeWidth="2" />
          <g fill="#3B7DD0" fillOpacity="0.4">
            <circle cx="150" cy="120" r="3" />
            <circle cx="166" cy="120" r="3" />
            <circle cx="182" cy="120" r="3" />
            <circle cx="150" cy="136" r="3" />
            <circle cx="166" cy="136" r="3" />
            <circle cx="182" cy="136" r="3" />
          </g>
        </svg>
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
      </div>

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
