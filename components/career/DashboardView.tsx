// components/career/DashboardView.tsx
// Separador "Minha Carreira" — perfil, gap de competências, vagas
// compatíveis, plano, simulador e histórico. Dados próprios +
// apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  History,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
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
import { NavyHeroCard } from '@/components/ui/NavyHeroCard';
import { ProfileRoiCard } from '@/components/ui/ProfileRoiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { READINESS_CFG } from './constants';
import { RequirementChecksPanel } from './RequirementChecksPanel';
import type {
  CareerProfile,
  Position,
  SimulationGap,
  SimulationResult,
} from './types';

function estimatedDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
}

interface GapListProps {
  title: string;
  tone: 'danger' | 'warning';
  gaps: SimulationGap[];
}

// Competências do cargo alvo ainda não cumpridas: sem nível actual = em falta;
// com algum nível mas abaixo do exigido = a desenvolver.
function GapList({ title, tone, gaps }: GapListProps) {
  return (
    <div>
      <div
        className={cn(
          'mb-1.5 font-body text-xs font-bold',
          tone === 'danger' ? 'text-danger-ink' : 'text-warning-ink',
        )}
      >
        {title}
      </div>
      <div className="divide-y divide-border rounded-card border border-border">
        {gaps.map((g) => (
          <div
            key={g.competency.id}
            className="flex items-center gap-3 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm text-ink">
                {g.competency.name}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {g.competency.category}
              </div>
            </div>
            <span className="font-data text-xs font-semibold text-ink">
              {g.currentLevel} / {g.requiredLevel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const missingGaps = (simulation?.competencyGaps ?? []).filter(
    (g) => !g.met && g.currentLevel === 0,
  );
  const partialGaps = (simulation?.competencyGaps ?? []).filter(
    (g) => !g.met && g.currentLevel > 0,
  );

  if (loading || !profile) return <Skeleton rows={6} />;

  const { user, insights, stats, careerPlan, careerHistory } = profile;
  const { competencyGaps, promotionEligibility, matchingVacancies } = insights;
  const planGoals = careerPlan?.goals ?? [];
  const planProgress = planGoals.length
    ? Math.round(
        planGoals.reduce((sum, g) => sum + (g.progress ?? 0), 0) /
          planGoals.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <ProfileRoiCard
        kicker="Minha carreira"
        kickerIcon={TrendingUp}
        name={user.fullName}
        avatarUrl={user.avatarUrl}
        subtitle={`${user.position?.name ?? 'Sem cargo'} · ${user.department?.name ?? '—'}`}
        stats={[
          { label: 'Certificados', value: stats.certificates },
          { label: 'Cursos', value: stats.enrollments },
          { label: 'Competências', value: stats.userCompetencies },
          { label: 'Badges', value: stats.badgeAwards },
          ...(user.points ? [{ label: 'XP', value: user.points.points }] : []),
          ...(promotionEligibility
            ? [
                {
                  label: 'Promoção',
                  value: promotionEligibility.eligible
                    ? 'Elegível'
                    : 'Em desenvolvimento',
                  color: promotionEligibility.eligible ? '#34D399' : '#FBBF24',
                },
              ]
            : []),
        ]}
        note={
          promotionEligibility
            ? READINESS_CFG[promotionEligibility.recommendation]?.label
            : undefined
        }
      />

      <div className="grid grid-cols-3 gap-5">
        {/* Gap de Competências */}
        <Card className="col-span-2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border bg-[#0F1F3D]/60 px-4 py-3">
            <span className="font-body text-sm font-semibold text-white">
              Lacunas de Competências
            </span>
            <span className="font-body text-xs text-white/80">
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
            <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-sm font-semibold text-white">
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
            <NavyHeroCard className="flex-col items-start gap-0">
              <div className="mb-1 font-body text-xs font-semibold uppercase tracking-widest text-white/80">
                Plano activo
              </div>
              <div className="w-full truncate font-body text-sm font-medium text-white">
                {careerPlan.title}
              </div>
              {(careerPlan.currentRole || careerPlan.targetRole) && (
                <div className="mt-1 flex items-center gap-2 font-body text-xs text-white/80">
                  {careerPlan.currentRole && (
                    <span>{careerPlan.currentRole.name}</span>
                  )}
                  {careerPlan.targetRole && (
                    <>
                      <ChevronRight size={14} strokeWidth={1.75} />
                      <span className="font-medium text-white">
                        {careerPlan.targetRole.name}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="mt-1 font-body text-xs text-white/80">
                {careerPlan.goals?.length ?? 0} objetivos
              </div>
              {careerPlan.targetDate && (
                <div className="mt-1 font-body text-xs text-white">
                  Alvo:{' '}
                  {new Date(careerPlan.targetDate).toLocaleDateString('pt-AO', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between font-body text-xs text-white/80">
                  <span>Progresso</span>
                  <span>{planProgress}%</span>
                </div>
                <ProgressBar
                  value={planProgress}
                  color="#FFFFFF"
                  className="bg-white/20"
                />
              </div>
            </NavyHeroCard>
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

      {/* Simulador de Carreira (único — fundiu o antigo modal "Simular Carreira") */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-1.5 font-body text-sm font-semibold text-ink">
          <Sparkles size={16} strokeWidth={1.75} className="text-accent" />
          Simulador de Carreira
        </div>
        <p className="mb-3 font-body text-xs text-ink-muted">
          Veja o que é necessário para chegar ao próximo nível
        </p>
        {!posLoading && positionOptions.length === 0 ? (
          <p className="mb-4 font-body text-sm text-ink-faint">
            Sem cargos definidos — o RH pode criá-los em Organização.
          </p>
        ) : (
          <div className="mb-4 flex gap-3">
            <Combobox
              items={positionOptions}
              value={simTarget}
              onValueChange={(v) => {
                setSimTarget(v);
                simulateMutation.reset();
              }}
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
              <Zap size={15} strokeWidth={1.75} />
              Simular
            </Button>
          </div>
        )}

        {simulation && (
          <div className="space-y-4">
            <div className="rounded-card bg-primary-subtle p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-body text-sm font-bold text-ink">
                    Prontidão para &quot;{simulation.targetPosition.name}&quot;
                  </div>
                  <div
                    className={cn(
                      'font-body text-xs font-semibold',
                      simulation.summary.ready
                        ? 'text-success'
                        : simulation.readinessScore >= 50
                          ? 'text-warning'
                          : 'text-danger',
                    )}
                  >
                    {simulation.summary.ready
                      ? 'Pronto para o cargo'
                      : simulation.readinessScore >= 50
                        ? 'Em desenvolvimento'
                        : 'Lacunas significativas'}
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
                intent={
                  simulation.summary.ready
                    ? 'success'
                    : simulation.readinessScore >= 50
                      ? 'warning'
                      : 'danger'
                }
                className="mb-3 bg-surface"
              />
              <div className="grid grid-cols-2 gap-2 font-body text-xs md:grid-cols-4">
                <div className="rounded-control bg-surface p-2">
                  <div className="text-ink-faint">Requisitos</div>
                  <div className="font-bold text-ink">
                    {simulation.summary.requirementsMet}/
                    {simulation.summary.totalRequirements}
                  </div>
                </div>
                <div className="rounded-control bg-surface p-2">
                  <div className="text-ink-faint">Estimativa</div>
                  <div
                    className={cn(
                      'font-bold',
                      simulation.summary.ready
                        ? 'text-success'
                        : 'text-warning',
                    )}
                  >
                    {simulation.summary.ready
                      ? 'Pronto'
                      : `${simulation.summary.estimatedTimeMonths ?? 0} meses`}
                  </div>
                </div>
                <div className="rounded-control bg-surface p-2">
                  <div className="text-ink-faint">Data prevista</div>
                  <div className="font-bold text-ink">
                    {simulation.summary.ready
                      ? 'Agora'
                      : estimatedDate(
                          simulation.summary.estimatedTimeMonths ?? 0,
                        )}
                  </div>
                </div>
                <div className="rounded-control bg-surface p-2">
                  <div className="text-ink-faint">Cursos rec.</div>
                  <div className="font-bold text-ink">
                    {simulation.recommendedCourses.length}
                  </div>
                </div>
              </div>
            </div>

            {missingGaps.length > 0 && (
              <GapList
                title="Competências obrigatórias em falta"
                tone="danger"
                gaps={missingGaps}
              />
            )}
            {partialGaps.length > 0 && (
              <GapList
                title="Lacunas a desenvolver"
                tone="warning"
                gaps={partialGaps}
              />
            )}

            <RequirementChecksPanel
              checks={simulation.requirementChecks ?? []}
              noData={simulation.summary.noData}
            />

            {simulation.recommendedCourses.length > 0 && (
              <div>
                <div className="mb-1.5 font-body text-xs font-bold text-ink-muted">
                  Cursos recomendados para fechar gaps
                </div>
                <div className="space-y-1">
                  {simulation.recommendedCourses.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 truncate font-body text-sm text-primary"
                    >
                      <BookOpen size={13} strokeWidth={1.75} />
                      {c.title}
                    </div>
                  ))}
                </div>
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
