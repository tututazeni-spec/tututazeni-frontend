// components/career/DashboardView.tsx
// Separador "Minha Carreira" — perfil, gap de competências, vagas
// compatíveis, plano, simulador e histórico. Dados próprios +
// apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { History, Sparkles } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { READINESS_CFG } from './constants';
import type { CareerProfile, Position, SimulationResult } from './types';

function scoreClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-ink-faint';
}

export function DashboardView() {
  const notify = useToast();
  const [simTarget, setSimTarget] = useState('');

  const { data: profile, isLoading: loading } = useApiQuery<CareerProfile>(
    queryKeys.career.me(),
    '/career/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: positions, isLoading: posLoading } = useApiQuery<Position[]>(
    queryKeys.career.positions(),
    '/career/positions',
    { staleTime: STALE_TIME.STATIC },
  );
  const positionOptions = (positions ?? []).map((p) => ({
    value: String(p.id),
    label: p.level ? `${p.name} · ${p.level}` : p.name,
  }));

  const simulateMutation = useApiMutation(
    (target: string) =>
      apiClient.get<SimulationResult>(`/career/me/simulate/${target}`),
    {
      // O seletor só oferece cargos válidos; um 404 aqui é a corrida rara de
      // um cargo apagado entre o carregamento e a simulação. Silenciar o
      // handler global ("Erro ao guardar") e deixar só a mensagem específica.
      meta: { silent: true },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const simulation = simulateMutation.data ?? null;
  const simLoading = simulateMutation.isPending;
  const runSimulation = () => {
    if (simTarget) simulateMutation.mutate(simTarget);
  };

  if (loading || !profile) return <Skeleton rows={6} />;

  const { user, insights, stats, careerPlan, careerHistory } = profile;
  const { competencyGaps, promotionEligibility, matchingVacancies } = insights;

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            name={user.fullName}
            url={user.avatarUrl ?? undefined}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-ink">
              {user.fullName}
            </h2>
            <div className="font-body text-sm text-ink-muted">
              {user.position?.name ?? 'Sem cargo'} · {user.department?.name}
            </div>
            <div className="mt-2 flex gap-3 font-body text-xs text-ink-faint">
              <span> {stats.certificates} certificados</span>
              <span> {stats.enrollments} cursos</span>
              <span> {stats.userCompetencies} competências</span>
              <span> {stats.badgeAwards} badges</span>
            </div>
            {user.points && (
              <div className="mt-2 font-body text-xs font-semibold text-primary">
                {user.points.points} XP
              </div>
            )}
          </div>
          {promotionEligibility && (
            <div
              className={cn(
                'rounded-card border px-3 py-2 text-center font-body text-xs font-medium',
                promotionEligibility.eligible
                  ? 'border-success bg-success-subtle text-success-ink'
                  : 'border-border bg-surface-sunken text-ink-muted',
              )}
            >
              {promotionEligibility.eligible
                ? ' Elegível para promoção'
                : ' Em desenvolvimento'}
              <div className="mt-0.5 font-body text-xs font-normal text-ink-faint">
                {READINESS_CFG[promotionEligibility.recommendation]?.label}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        {/* Gap de Competências */}
        <Card className="col-span-2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-body text-sm font-semibold text-ink">
              Lacunas de Competências
            </span>
            <span className="font-body text-xs text-ink-faint">
              {competencyGaps.filter((g) => g.status === 'MET').length}/
              {competencyGaps.length} cumpridas
            </span>
          </div>
          {competencyGaps.length === 0 ? (
            <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
              Sem cargo definido ou sem competências mapeadas
            </div>
          ) : (
            <div className="divide-y divide-border">
              {competencyGaps.slice(0, 6).map((g) => (
                <div
                  key={g.competency.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm text-ink">
                      {g.competency.name}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      {g.competency.category}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={cn(
                            'h-4 w-4 rounded-sm',
                            lvl <= g.currentLevel
                              ? 'bg-primary'
                              : lvl <= g.requiredLevel
                                ? 'bg-primary-subtle'
                                : 'bg-surface-sunken',
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-body text-xs',
                        g.status === 'MET'
                          ? 'bg-success-subtle text-success-ink'
                          : g.status === 'PARTIAL'
                            ? 'bg-warning-subtle text-warning-ink'
                            : 'bg-danger-subtle text-danger-ink',
                      )}
                    >
                      {g.status === 'MET' ? '✓' : `−${g.gap}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Vagas compatíveis + Plano de Carreira */}
        <div className="space-y-4">
          {/* Vagas compatíveis */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 font-body text-sm font-semibold text-ink">
              Vagas compatíveis
            </div>
            {matchingVacancies.length === 0 ? (
              <div className="px-4 py-4 text-center font-body text-xs text-ink-faint">
                Sem vagas compatíveis
              </div>
            ) : (
              matchingVacancies.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 border-b border-border px-4 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-xs font-medium text-ink">
                      {v.title}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      {v.department?.name}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex-shrink-0 font-body text-xs font-bold',
                      scoreClass(v.matchScore ?? 0),
                    )}
                  >
                    {v.matchScore}%
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Plano de Carreira */}
          {careerPlan && (
            <Card className="border-primary bg-primary-subtle p-4">
              <div className="mb-1 font-body text-xs font-semibold text-primary">
                Plano activo
              </div>
              <div className="truncate font-body text-sm font-medium text-ink">
                {careerPlan.title}
              </div>
              <div className="mt-1 font-body text-xs text-ink-muted">
                {careerPlan.goals?.length ?? 0} objetivos
              </div>
              {careerPlan.targetDate && (
                <div className="mt-1 font-body text-xs text-primary">
                  Alvo:{' '}
                  {new Date(careerPlan.targetDate).toLocaleDateString('pt-AO', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Critérios de Elegibilidade */}
      {promotionEligibility && (
        <Card className="p-5">
          <div className="mb-4 font-body text-sm font-semibold text-ink">
            Critérios de Promoção
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(promotionEligibility.criteria).map(([key, c]) => (
              <div
                key={key}
                className={cn(
                  'rounded-card border p-4',
                  c.met
                    ? 'border-success bg-success-subtle'
                    : 'border-border bg-surface-sunken',
                )}
              >
                <div className="mb-2 font-body text-xs text-ink-muted">
                  {c.label}
                </div>
                <div
                  className={cn(
                    'font-data text-2xl font-bold',
                    c.met ? 'text-success-ink' : 'text-ink',
                  )}
                >
                  {typeof c.value === 'number' && c.value % 1 !== 0
                    ? c.value.toFixed(1)
                    : c.value}
                  <span className="ml-1 font-body text-sm font-normal text-ink-faint">
                    / {c.required}
                  </span>
                </div>
                <div
                  className={cn(
                    'mt-1 font-body text-xs font-medium',
                    c.met ? 'text-success' : 'text-warning',
                  )}
                >
                  {c.met ? '✓ Cumprido' : 'Pendente'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Simulador de Carreira */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-1.5 font-body text-sm font-semibold text-ink">
          <Sparkles size={16} strokeWidth={1.75} className="text-accent" />
          Simulador de Carreira
        </div>
        {!posLoading && positionOptions.length === 0 ? (
          <p className="mb-4 font-body text-sm text-ink-faint">
            Sem cargos definidos — o RH pode criá-los em Organização.
          </p>
        ) : (
          <div className="mb-4 flex gap-3">
            <Combobox
              items={positionOptions}
              value={simTarget}
              onValueChange={setSimTarget}
              placeholder={
                posLoading ? 'A carregar cargos…' : 'Escolha o cargo alvo…'
              }
              searchPlaceholder="Escreva para filtrar cargos…"
              disabled={posLoading}
              className="flex-1"
            />
            <Button
              onClick={runSimulation}
              disabled={!simTarget}
              loading={simLoading}
            >
              Simular
            </Button>
          </div>
        )}

        {simulation && (
          <div className="rounded-card bg-primary-subtle p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-body text-sm font-bold text-ink">
                  {simulation.targetPosition.name}
                </div>
                <div className="font-body text-xs text-ink-muted">
                  Cargo alvo
                </div>
              </div>
              <div
                className={cn(
                  'font-data text-3xl font-bold',
                  scoreClass(simulation.readinessScore),
                )}
              >
                {simulation.readinessScore}%
              </div>
            </div>
            <ProgressBar
              value={simulation.readinessScore}
              className="mb-3 bg-surface"
            />
            <div className="mb-3 grid grid-cols-3 gap-2 font-body text-xs">
              <div className="rounded-control bg-surface p-2">
                <div className="text-ink-faint">Requisitos</div>
                <div className="font-bold text-ink">
                  {simulation.summary.requirementsMet}/
                  {simulation.summary.totalRequirements}
                </div>
              </div>
              <div className="rounded-control bg-surface p-2">
                <div className="text-ink-faint">Pronto?</div>
                <div
                  className={cn(
                    'font-bold',
                    simulation.summary.ready ? 'text-success' : 'text-warning',
                  )}
                >
                  {simulation.summary.ready
                    ? 'Sim'
                    : `~${simulation.summary.estimatedTimeMonths}m`}
                </div>
              </div>
              <div className="rounded-control bg-surface p-2">
                <div className="text-ink-faint">Cursos rec.</div>
                <div className="font-bold text-ink">
                  {simulation.recommendedCourses.length}
                </div>
              </div>
            </div>
            {simulation.recommendedCourses.length > 0 && (
              <div>
                <div className="mb-1 font-body text-xs font-semibold text-ink">
                  Cursos recomendados para fechar gaps:
                </div>
                {simulation.recommendedCourses.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="truncate font-body text-xs text-primary"
                  >
                    {c.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Histórico de Carreira */}
      {careerHistory.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 font-body text-sm font-semibold text-ink">
            <History size={16} strokeWidth={1.75} className="text-ink-muted" />
            Histórico de Carreira
          </div>
          {careerHistory.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {c.position?.name}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {new Date(c.startedAt).toLocaleDateString('pt-AO', {
                    month: 'short',
                    year: 'numeric',
                  })}
                  {c.endedAt &&
                    ` → ${new Date(c.endedAt).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}`}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
