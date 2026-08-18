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
  { key: 'completed', label: 'Cursos Concluídos', color: 'text-success' },
  { key: 'inProgress', label: 'Em Progresso', color: 'text-info' },
  {
    key: 'totalHours',
    label: 'Horas De Aprendizagem',
    color: 'text-accent',
    suffix: 'h',
  },
  { key: 'totalXp', label: 'Pontos de Experiência', color: 'text-warning' },
];

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
            <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
            <div className={`font-data text-2xl font-bold ${color}`}>
              {stats[key]}
              {suffix ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* Streak + Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-card bg-gradient-to-r from-accent to-accent-hover p-5 text-canvas">
          <div className="font-body text-sm text-canvas/80 mb-1">
            Sequência de Aprendizagem
          </div>
          <div className="font-display text-4xl font-bold">
            {data.streak.current}
          </div>
          <div className="font-body text-sm text-canvas/80 mt-1">
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
                        ⚠ {p.overdueActions} atrasadas
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
