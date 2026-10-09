// components/analytics/MyDashboardView.tsx
// Separador "O meu progresso" — aprendizagem, streak, competências e
// PDIs activos. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: os 4 stats principais usam o NavyStatCard. A cor que
// indicava "competência atrás do alvo" (âmbar vs. esmeralda na barra)
// não é replicável — components/ui/ProgressBar é mono-cor — passa a
// ser comunicada pelo texto do nível adjacente à barra.

'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Zap,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import type { CollaboratorDashboard } from './types';

const STAT_TILES: Array<{
  key: 'completed' | 'inProgress' | 'totalHours' | 'totalXp';
  label: string;
  tone: NavyStatTone;
  icon: LucideIcon;
  suffix?: string;
}> = [
  {
    key: 'completed',
    label: 'Cursos Concluídos',
    tone: 'green',
    icon: CheckCircle2,
  },
  { key: 'inProgress', label: 'Em Progresso', tone: 'blue', icon: BookOpen },
  {
    key: 'totalHours',
    label: 'Horas De Aprendizagem',
    tone: 'orange',
    icon: Clock,
    suffix: 'h',
  },
  { key: 'totalXp', label: 'Pontos de Experiência', tone: 'red', icon: Zap },
];

type Milestone = NonNullable<
  CollaboratorDashboard['learningSequence']
>['milestones'][number];

function formatMilestoneDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
  });
}

function LearningSequenceChart({ milestones }: { milestones: Milestone[] }) {
  const activeIndex = milestones.findIndex((m) => m.status === 'current');
  const completedCount = milestones.filter(
    (m) => m.status === 'completed',
  ).length;
  const lineProgress =
    activeIndex >= 0
      ? (activeIndex / Math.max(milestones.length - 1, 1)) * 100
      : (completedCount / Math.max(milestones.length - 1, 1)) * 100;

  return (
    <div className="relative overflow-hidden px-1 pt-2">
      <div className="absolute left-0 right-0 top-9 h-0.5 bg-border" />
      <div
        className="absolute left-0 top-9 h-0.5 bg-primary transition-all"
        style={{ width: `${lineProgress}%` }}
      />

      <div className="relative flex items-start justify-between gap-1">
        {milestones.map((m) => {
          const isCurrent = m.status === 'current';
          const isCompleted = m.status === 'completed';
          const isLocked = m.status === 'locked';

          return (
            <div
              key={m.id}
              className="flex min-w-0 flex-1 flex-col items-center text-center"
            >
              <div
                className={
                  isCurrent
                    ? 'rounded-2xl bg-ink p-2.5 shadow-lg ring-4 ring-primary/20'
                    : ''
                }
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isCompleted || isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-surface-sunken text-ink-faint'
                  }`}
                >
                  {isLocked ? (
                    <Lock size={18} strokeWidth={1.75} />
                  ) : isCompleted ? (
                    <Check size={20} strokeWidth={2} />
                  ) : (
                    <BookOpen size={18} strokeWidth={1.75} />
                  )}
                </div>
              </div>

              {!isLocked ? (
                <div className="-mt-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                  <Check size={11} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="mt-2.5" />
              )}

              <div
                className={`mt-2 w-full break-words font-body text-xs font-semibold leading-tight ${
                  isLocked ? 'text-ink-faint' : 'text-ink'
                }`}
              >
                {m.label}
              </div>
              {m.status !== 'locked' && m.progress > 0 && (
                <div className="font-body text-[11px] text-primary">
                  {m.progress}% Completo
                </div>
              )}
              <div className="mt-1 font-body text-[11px] text-ink-faint">
                {formatMilestoneDate(m.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MyDashboardView() {
  const { data, isLoading } = useApiQuery<CollaboratorDashboard>(
    queryKeys.analyticsPage.me(),
    '/analytics/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  const stats = {
    completed: data.learning.completed,
    inProgress: data.learning.inProgress,
    totalHours: data.learning.totalHours,
    totalXp: data.xp.total,
  };

  return (
    <div className="space-y-5">
      {/* Stats pessoais */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_TILES.map(({ key, label, tone, icon, suffix }) => (
          <NavyStatCard
            key={key}
            icon={icon}
            label={label}
            value={`${stats[key]}${suffix ?? ''}`}
            tone={tone}
          />
        ))}
      </div>

      {/* Streak + Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 pt-6 shadow-resting text-black">
          <div className="mb-1 flex items-baseline justify-between">
            <div className="font-body text-sm font-semibold text-black">
              Sequência de Aprendizagem
            </div>
            <div className="font-body text-xs text-ink-faint">
              {data.streak.current} dias · recorde {data.streak.longest}
            </div>
          </div>
          {data.learningSequence &&
          data.learningSequence.milestones.length > 0 ? (
            <>
              <div className="mb-2 font-body text-xs text-ink-faint">
                {data.learningSequence.title}
              </div>
              <LearningSequenceChart
                milestones={data.learningSequence.milestones}
              />
            </>
          ) : (
            <div className="py-6 text-center font-body text-xs text-ink-faint">
              Sem percurso de aprendizagem activo.
            </div>
          )}
        </div>
        <Card>
          <CardBody>
            <div className="text-xs text-ink-faint mb-3">Competências Top</div>
            <div className="space-y-2">
              {data.competencies.slice(0, 4).map((c) => {
                const behind =
                  c.targetLevel !== null && c.currentLevel < c.targetLevel;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="text-xs text-ink-muted w-28 truncate">
                      {c.name}
                    </div>
                    <div className="flex-1">
                      <div
                        role="progressbar"
                        aria-valuenow={Math.round((c.currentLevel / 5) * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1.5 w-full rounded-pill bg-surface-sunken"
                      >
                        <div
                          className="h-full rounded-pill bg-[#0F1F3D] transition-[width] duration-300"
                          style={{
                            width: `${Math.round((c.currentLevel / 5) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className={`text-xs font-data flex-shrink-0 ${behind ? 'text-black' : 'text-success'}`}
                    >
                      {c.currentLevel}/5
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* PDI */}
      {data.pdi.length > 0 && (
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Os meus PDIs activos
            </div>
            <div className="space-y-3">
              {data.pdi.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink mb-1">
                      {p.name}
                    </div>
                    <ProgressBar
                      value={
                        p.actionsTotal > 0
                          ? Math.round((p.actionsDone / p.actionsTotal) * 100)
                          : 0
                      }
                    />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-data font-bold text-info">
                      {p.actionsDone}/{p.actionsTotal}
                    </div>
                    {p.overdueActions > 0 && (
                      <div className="text-xs text-danger">
                        <AlertTriangle
                          size={12}
                          strokeWidth={1.75}
                          className="inline align-[-2px]"
                        />{' '}
                        {p.overdueActions} atrasadas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
