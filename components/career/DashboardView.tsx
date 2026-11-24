// components/career/DashboardView.tsx
// Separador "Minha Carreira" — perfil, gap de competências, vagas
// compatíveis, plano, simulador e histórico. Dados próprios +
// apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  History,
  PlayCircle,
  Rocket,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { LEVEL_CFG } from '@/components/departments/constants';
import type { PosLevel } from '@/components/departments/types';
import { READINESS_CFG } from './constants';
import { RequirementChecksPanel } from './RequirementChecksPanel';
import type {
  CareerProfile,
  Position,
  SimulationGap,
  SimulationResult,
} from './types';
import { EmptyState } from '@/components/ui/EmptyState';

function estimatedDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
}

interface GapListProps {
  title: string;
  tone: 'danger' | 'warning' | 'success';
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
          tone === 'danger'
            ? 'text-danger-ink'
            : tone === 'success'
              ? 'text-success-ink'
              : 'text-warning-ink',
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

const CRITERIA_ICONS: Record<string, LucideIcon> = {
  time: CalendarDays,
  performance: BarChart3,
  competencies: Trophy,
};

// Forma decorativa discreta ao fundo de cada cartão de critério.
function CriteriaDecoration({ kind, met }: { kind: string; met: boolean }) {
  if (kind === 'performance') {
    return (
      <div
        className="pointer-events-none absolute bottom-0 right-4 flex items-end gap-2 opacity-20"
        aria-hidden
      >
        {[28, 44, 64].map((h) => (
          <div
            key={h}
            className="w-6 rounded-t-full bg-[#3B6BC4]"
            style={{ height: h }}
          />
        ))}
      </div>
    );
  }
  if (kind === 'competencies') {
    return (
      <CheckCircle2
        className={cn(
          'pointer-events-none absolute -bottom-6 -right-4 h-32 w-32 opacity-20',
          met ? 'text-[#34D399]' : 'text-[#3B6BC4]',
        )}
        strokeWidth={1.5}
        aria-hidden
      />
    );
  }
  return (
    <div
      className="pointer-events-none absolute -bottom-12 right-6 h-28 w-28 rounded-full border-[14px] border-[#3B6BC4] opacity-20"
      aria-hidden
    />
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
    label: p.level
      ? `${p.name} · ${LEVEL_CFG[p.level as PosLevel]?.label ?? p.level}`
      : p.name,
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
  const metCompetencies = (simulation?.competencyGaps ?? []).filter(
    (g) => g.met,
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
        statsGrid
        name={user.fullName}
        avatarUrl={user.avatarUrl}
        subtitle={`${user.position?.name ?? 'Sem cargo'} · ${user.department?.name ?? '—'}`}
        stats={[
          { label: 'Certificados', value: stats.certificates },
          { label: 'Cursos', value: stats.enrollments },
          { label: 'Competências', value: stats.userCompetencies },
          { label: 'Badges', value: stats.badgeAwards },
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
          <div className="flex items-center justify-between border-b border-border bg-brand-dark px-4 py-3">
            <span className="font-body text-sm font-semibold text-white">
              Lacunas de Competências
            </span>
            <span className="font-body text-xs text-white/80">
              {competencyGaps.filter((g) => g.status === 'MET').length}/
              {competencyGaps.length} cumpridas
            </span>
          </div>
          {competencyGaps.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Sem cargo definido ou sem competências mapeadas"
            />
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
            <div className="border-b border-border bg-brand-dark px-4 py-3 font-body text-sm font-semibold text-white">
              Vagas compatíveis
            </div>
            {matchingVacancies.length === 0 ? (
              <EmptyState variant="inline" title="Sem vagas compatíveis" />
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
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-[#0F1F3D]">
            Critérios de Promoção
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Object.entries(promotionEligibility.criteria).map(([key, c]) => {
              const Icon = CRITERIA_ICONS[key] ?? Trophy;
              return (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] to-[#14295a] px-4 py-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]"
                >
                  <CriteriaDecoration kind={key} met={c.met} />
                  <div className="relative flex items-center gap-4">
                    <span
                      className={cn(
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
                        c.met ? 'bg-[#2E9E5B]' : 'bg-[#1E3F85]',
                      )}
                    >
                      <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden />
                    </span>
                    <div className="h-14 w-px shrink-0 bg-white/20" />
                    <div className="min-w-0">
                      <p className="font-body text-sm text-white">{c.label}</p>
                      <p className="mt-0.5 font-display text-2xl font-bold">
                        {typeof c.value === 'number' && c.value % 1 !== 0
                          ? c.value.toFixed(1)
                          : c.value}
                        <span className="ml-1 font-body text-base font-normal text-white/80">
                          / {c.required}
                        </span>
                      </p>
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
                          c.met
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-[#F97316] text-white',
                        )}
                      >
                        {c.met ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {c.met ? 'Cumprido' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Simulador de Carreira (único — fundiu o antigo modal "Simular Carreira") */}
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#14295a] to-[#0F1F3D] text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 items-center gap-4 md:flex-1">
              <Rocket
                className="h-12 w-12 shrink-0 text-[#60A5FA]"
                strokeWidth={1.5}
                aria-hidden
              />
              <div className="h-12 w-px shrink-0 bg-white/20" />
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold">
                  Simulador de Carreira
                </h3>
                <p className="font-body text-sm text-white/80">
                  Veja o que é necessário para chegar ao próximo nível
                </p>
              </div>
            </div>
            {!posLoading && positionOptions.length === 0 ? (
              <p className="font-body text-sm text-white/80">
                Sem cargos definidos — o RH pode criá-los em Organização
              </p>
            ) : (
              <div className="flex flex-1 gap-3 md:max-w-xl">
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
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={!simTarget || simLoading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-control bg-[#22C55E] px-5 font-body text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {simLoading ? 'A simular…' : 'Simular'}
                </button>
              </div>
            )}
          </div>

          {simulation && (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,15rem)_1fr]">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                    simulation.summary.ready
                      ? 'bg-[#22A559]'
                      : simulation.readinessScore >= 50
                        ? 'bg-[#F97316]'
                        : 'bg-[#DC2626]',
                  )}
                >
                  <Trophy className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-body text-sm font-bold">
                    Prontidão para &quot;{simulation.targetPosition.name}&quot;
                  </p>
                  <p
                    className={cn(
                      'font-body text-xs font-semibold',
                      simulation.summary.ready
                        ? 'text-[#4ADE80]'
                        : simulation.readinessScore >= 50
                          ? 'text-[#FBBF24]'
                          : 'text-[#F87171]',
                    )}
                  >
                    {simulation.summary.ready
                      ? 'Pronto para o cargo'
                      : simulation.readinessScore >= 50
                        ? 'Em desenvolvimento'
                        : 'Lacunas significativas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressBar
                  value={simulation.readinessScore}
                  color={
                    simulation.summary.ready
                      ? '#22C55E'
                      : simulation.readinessScore >= 50
                        ? '#F59E0B'
                        : '#EF4444'
                  }
                  className="h-2 flex-1 bg-white/20"
                />
                <span className="font-display text-3xl font-bold">
                  {simulation.readinessScore}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-2">
                {[
                  {
                    icon: ClipboardList,
                    label: 'Requisitos',
                    value: `${simulation.summary.requirementsMet}/${simulation.summary.totalRequirements}`,
                  },
                  {
                    icon: TrendingUp,
                    label: 'Estimativa',
                    value: simulation.summary.ready
                      ? 'Pronto'
                      : `${simulation.summary.estimatedTimeMonths ?? 0} meses`,
                  },
                  {
                    icon: CalendarDays,
                    label: 'Data prevista',
                    value: simulation.summary.ready
                      ? 'Agora'
                      : estimatedDate(
                          simulation.summary.estimatedTimeMonths ?? 0,
                        ),
                  },
                  {
                    icon: PlayCircle,
                    label: 'Cursos rec.',
                    value: String(simulation.recommendedCourses.length),
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-3 rounded-card bg-white/10 px-4 py-3"
                  >
                    <t.icon
                      className="h-6 w-6 shrink-0 text-white"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="font-body text-xs text-white/80">
                        {t.label}
                      </p>
                      <p className="font-body text-sm font-bold">{t.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {simulation && (
          <div className="space-y-4 bg-surface p-5 text-ink">
            {metCompetencies.length > 0 && (
              <GapList
                title="Requisitos cumpridos"
                tone="success"
                gaps={metCompetencies}
              />
            )}
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
      </div>

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
