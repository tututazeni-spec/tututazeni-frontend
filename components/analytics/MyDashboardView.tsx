// components/analytics/MyDashboardView.tsx
// Separador "O meu progresso" — aprendizagem, streak, competências e
// PDIs activos. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: streak card usa o mesmo gradiente
// (from-accent to-accent-hover + text-canvas) já estabelecido em
// components/micro-learning/DashboardView.tsx; os 4 stats principais
// seguem o mesmo padrão de "tile" plano desse módulo. A cor que
// indicava "competência atrás do alvo" (âmbar vs. esmeralda na barra)
// não é replicável — components/ui/ProgressBar é mono-cor — passa a
// ser comunicada pelo texto do nível adjacente à barra.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CollaboratorDashboard } from './types';

const STAT_TILES: Array<{
  key: 'completed' | 'inProgress' | 'totalHours' | 'totalXp';
  label: string;
  color: string;
  suffix?: string;
}> = [
  { key: 'completed', label: 'Cursos Concluídos', color: 'text-black' },
  { key: 'inProgress', label: 'Em Progresso', color: 'text-black' },
  {
    key: 'totalHours',
    label: 'Horas De Aprendizagem',
    color: 'text-black',
    suffix: 'h',
  },
  { key: 'totalXp', label: 'Pontos de Experiência', color: 'text-black' },
];

<<<<<<< Updated upstream
=======
type MilestoneStatus = 'completed' | 'current' | 'locked';

interface Milestone {
  id: string;
  label: string;
  date: string;
  status: MilestoneStatus;
  progress?: number;
}

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: data.learningPath) que traz esta lista.
const MOCK_MILESTONES: Milestone[] = [
  { id: '1', label: 'Fundamentos de Gestão', date: 'Jul 15', status: 'completed' },
  { id: '2', label: 'Comunicação Eficaz', date: 'Aug 01', status: 'completed' },
  { id: '3', label: 'Liderança Ágil', date: 'Aug 20', status: 'completed', progress: 60 },
  { id: '4', label: 'Liderança Ágil', date: 'Set 10', status: 'current', progress: 60 },
  { id: '5', label: 'Desenvolvimento de Equipe', date: 'Set 10', status: 'locked' },
  { id: '6', label: 'Estratégia de Negócios', date: 'Set 30', status: 'locked' },
];

function LearningSequenceChart({ milestones }: { milestones: Milestone[] }) {
  const activeIndex = milestones.findIndex((m) => m.status === 'current');
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
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
                  <div key={m.id} className="flex min-w-0 flex-1 flex-col items-center text-center">
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
              {typeof m.progress === 'number' && (
                <div className="font-body text-[11px] text-primary">
                  {m.progress}% Completo
                </div>
              )}
              <div className="mt-1 font-body text-[11px] text-ink-faint">{m.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

>>>>>>> Stashed changes
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
      <div className="grid grid-cols-4 gap-3">
        {STAT_TILES.map(({ key, label, color, suffix }) => (
          <div key={key} className="rounded-card bg-surface-sunken p-4">
            <div className="mb-1 font-body text-xs text-black">{label}</div>
            <div className={`font-data text-2xl font-bold ${color}`}>
              {stats[key]}
              {suffix ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* Streak + Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-card border border-black bg-white p-5 text-black">
          <div className="font-body text-sm text-black mb-1">
            Sequência de Aprendizagem
          </div>
          <div className="font-display text-4xl font-bold">
            {data.streak.current}
          </div>
          <div className="font-body text-sm text-black mt-1">
            Dias Consecutivos (Recorde: {data.streak.longest})
          </div>
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
                      <ProgressBar
                        value={Math.round((c.currentLevel / 5) * 100)}
                      />
                    </div>
                    <div
                      className={`text-xs font-data flex-shrink-0 ${behind ? 'text-warning' : 'text-success'}`}
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
