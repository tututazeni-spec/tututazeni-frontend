// components/competency-map/TeamTab.tsx
// Separador "Equipa" — prontidão e principais lacunas de cada subordinado
// directo do utilizador actual. Consome GET /competency-map/team
// (ADMIN/RH/GESTOR); o separador já está escondido a COLABORADOR.

'use client';

import { Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { READINESS_CONFIG, READINESS_INTENT_CLASSES } from './constants';
import type { TeamMap } from './types';

export function TeamTab() {
  const { data, isLoading } = useApiQuery<TeamMap>(
    queryKeys.competencyMap.team(),
    '/competency-map/team',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={3} />;

  if (!data || data.members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sem membros na equipa"
        description="Não tens colaboradores directos atribuídos."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Membros da equipa"
          value={data.teamSize}
        />
        <NavyStatCard
          icon={Users}
          tone="green"
          label="Prontidão média"
          value={`${data.avgReadiness}%`}
        />
      </div>

      {data.members.map((m) => {
        const rcfg = READINESS_CONFIG[m.readinessLevel];
        const intentCls = READINESS_INTENT_CLASSES[rcfg.intent];
        return (
          <Card key={m.user.id} className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">
                {m.user.fullName}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${intentCls.text}`}
              >
                <rcfg.icon size={11} strokeWidth={1.75} className={rcfg.dot} />
                {rcfg.label} · {m.readinessScore}%
              </span>
            </div>
            <ProgressBar value={m.readinessScore} />
            <div className="mt-3 text-xs text-ink-faint">
              {m.employeeSkills.length} skills avaliadas
            </div>
            {m.topGaps.length > 0 && (
              <ul className="mt-2 space-y-1">
                {m.topGaps.map((g) => (
                  <li
                    key={g.skillId}
                    className="flex justify-between text-xs text-ink-muted"
                  >
                    <span>{g.skillName}</span>
                    <span>
                      {g.currentLevel}→{g.requiredLevel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
