// components/evaluation360/OverviewTab.tsx
// Cabeçalho do participante, scores, pontos fortes/gaps e progresso do
// ciclo — tudo vindo de avaliações reais (ver hooks/useEvaluation360.ts).
//
// Antes mostrava sempre "Maria João Santos" fixo e 2 cards de elegibilidade
// (Promoção/Bónus) que nunca reflectiam dados reais. Agora: o cabeçalho
// mostra o avaliado real (nome, departamento, foto carregada por ele —
// Avatar com fallback de iniciais); só ADMIN/RH conseguem escolher outro
// colaborador (espelha canSeeFull em
// evaluation360.service.ts#getParticipantResult — para os restantes papéis o
// backend devolve 403 a ver o resultado de outra pessoa, por isso nem se
// mostra o seletor). Os cards de elegibilidade foram removidos a pedido.

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { CycleInfo, ParticipantResult } from './types';
import { COLORS } from './colors';
import { useDirectoryUsers } from '@/components/enrollments/enrollData';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';

export interface OverviewTabProps {
  result: ParticipantResult | null;
  cycle: CycleInfo | null;
  canPickParticipant: boolean;
  isOwnResult: boolean;
  onSelectParticipant: (id: string | undefined) => void;
}

export function OverviewTab({
  result,
  cycle,
  canPickParticipant,
  isOwnResult,
  onSelectParticipant,
}: OverviewTabProps) {
  const [search, setSearch] = useState('');
  const { users, loading: searchLoading } = useDirectoryUsers(search, '', search.trim().length > 0);

  const completionPct =
    cycle && cycle.participantsCount > 0
      ? Math.round((cycle.completedCount / cycle.participantsCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {canPickParticipant && (
        <div className="rounded-xl border border-border bg-surface p-4">
          {isOwnResult ? (
            <div className="relative max-w-sm">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ver o resultado de outro colaborador…"
                autoComplete="off"
              />
              {search.trim().length > 0 && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                  {searchLoading && (
                    <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>
                  )}
                  {!searchLoading && users.length === 0 && (
                    <div className="px-3 py-2 text-sm text-ink-muted">
                      Nenhum colaborador encontrado
                    </div>
                  )}
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSelectParticipant(String(u.id));
                        setSearch('');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                    >
                      <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm text-ink">{u.fullName}</div>
                        <div className="truncate text-xs text-ink-faint">
                          {u.department?.name ?? u.email ?? '—'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onSelectParticipant(undefined)}
              className="flex items-center gap-2 rounded-control border border-border-strong px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <X size={14} strokeWidth={1.75} />
              Voltar ao meu resultado
            </button>
          )}
        </div>
      )}

      {/* Participant header */}
      <div className="rounded-xl border border-border bg-surface p-7 flex items-center gap-4">
        {result ? (
          <>
            <Avatar name={result.fullName} url={result.avatarUrl ?? undefined} size="lg" />
            <div>
              <div className="text-xl font-bold text-ink tracking-tight">{result.fullName}</div>
              <div className="text-sm text-ink-muted mt-0.5">
                {result.position} · {result.department}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-ink-muted">
            {cycle
              ? 'Ainda não há resultado calculado para este ciclo. O RH precisa de correr o cálculo de resultados depois de as avaliações serem submetidas.'
              : 'Ainda não existe nenhum ciclo de avaliação 360º.'}
          </div>
        )}
      </div>

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

      {/* Cycle progress */}
      {cycle && (
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
                background: 'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
              }}
            />
          </div>
          <div className="text-xs font-semibold text-primary">{completionPct}% de participação</div>
        </div>
      )}
    </div>
  );
}
