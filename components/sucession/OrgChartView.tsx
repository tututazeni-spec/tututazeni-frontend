// components/sucession/OrgChartView.tsx
// Vista "Mapa de Sucessão": lista de cargos críticos ordenada por
// risco, com pipeline expansível. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COVERAGE_CFG, READINESS_CFG, RISK_CFG } from './constants';
import { MatchScore } from './MatchScore';
import type { OrgChartNode, RiskLevel } from './types';

export function OrgChartView() {
  const [selected, setSelected] = useState<OrgChartNode | null>(null);
  const { data: nodes = [], isLoading: loading } = useApiQuery<OrgChartNode[]>(
    queryKeys.succession.orgChart(),
    '/succession/org-chart',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={4} />;

  const riskOrder: Record<RiskLevel, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return (
    <div className="flex gap-5">
      {/* Cards list */}
      <div className="flex-1 space-y-3">
        {[...nodes]
          .sort((a, b) => riskOrder[b.exitRisk] - riskOrder[a.exitRisk])
          .map((node) => (
            <Card
              key={node.id}
              onClick={() =>
                setSelected(selected?.id === node.id ? null : node)
              }
              className={`cursor-pointer p-4 transition-all ${
                selected?.id === node.id
                  ? 'border-primary shadow-hover'
                  : 'hover:shadow-hover'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Cargo info */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-body text-sm font-semibold text-ink">
                      {node.position.name}
                    </span>
                    {node.keyPersonRisk && (
                      <span className="rounded bg-accent-subtle px-1.5 py-0.5 font-body text-xs text-accent">
                         Pessoa Chave
                      </span>
                    )}
                    <StatusBadge value={node.exitRisk} map={RISK_CFG} />
                    <StatusBadge
                      value={node.coverageStatus}
                      map={COVERAGE_CFG}
                    />
                  </div>
                  <div className="mb-2 font-body text-xs text-ink-faint">
                    {node.position.department?.name ?? '—'}
                    {node.position.level ? ` · ${node.position.level}` : ''}
                  </div>

                  {/* Titular */}
                  {node.position.users[0] && (
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar
                        name={node.position.users[0].fullName}
                        url={node.position.users[0].avatarUrl ?? undefined}
                        size="sm"
                      />
                      <span className="font-body text-xs text-ink-muted">
                        {node.position.users[0].fullName}
                      </span>
                      {node.daysUntilExit !== null && (
                        <span
                          className={`ml-auto font-mono text-xs ${node.daysUntilExit <= 90 ? 'font-bold text-danger-ink' : 'text-ink-faint'}`}
                        >
                          Saída: {node.daysUntilExit}d
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sucessores preview */}
                  <div className="flex items-center gap-2">
                    {node.successors.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-1 rounded-control bg-surface-sunken px-2 py-1"
                      >
                        <Avatar
                          name={s.fullName}
                          url={s.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div>
                          <div className="font-body text-xs font-medium text-ink">
                            {s.fullName.split(' ')[0]}
                          </div>
                          <div
                            className={`font-body text-xs ${READINESS_CFG[s.readinessLevel].textCls}`}
                          >
                            {READINESS_CFG[s.readinessLevel].label}
                          </div>
                        </div>
                      </div>
                    ))}
                    {node.successors.length === 0 && (
                      <span className="font-body text-xs font-medium text-danger">
                        Sem sucessores
                      </span>
                    )}
                  </div>
                </div>

                {/* Gauges */}
                <div className="flex-shrink-0 text-center">
                  <div className="font-mono text-2xl font-bold text-ink-muted">
                    {node.successors.length}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    sucessores
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === node.id && node.successors.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Plano de sucessão
                  </div>
                  {node.successors.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
                    >
                      <Avatar
                        name={s.fullName}
                        url={s.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="font-body text-xs font-medium text-ink">
                          {s.fullName}
                        </div>
                      </div>
                      <StatusBadge
                        value={s.readinessLevel}
                        map={READINESS_CFG}
                        variant="dot"
                      />
                      <MatchScore score={s.matchScore} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

        {nodes.length === 0 && (
          <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
            Nenhum cargo crítico definido
          </div>
        )}
      </div>
    </div>
  );
}
