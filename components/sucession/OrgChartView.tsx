// components/sucession/OrgChartView.tsx
// Vista "Mapa de Sucessão": lista de cargos críticos ordenada por
// risco, com pipeline expansível. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, MatchScore, ReadinessBadge, Skeleton } from './atoms';
import { COVERAGE_CFG, READINESS_CFG, RISK_CFG } from './constants';
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
            <div
              key={node.id}
              onClick={() =>
                setSelected(selected?.id === node.id ? null : node)
              }
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                selected?.id === node.id
                  ? 'border-blue-400 shadow-md'
                  : 'border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Cargo info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {node.position.name}
                    </span>
                    {node.keyPersonRisk && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                        🔑 Key Person
                      </span>
                    )}
                    <StatusBadge value={node.exitRisk} map={RISK_CFG} />
                    <StatusBadge
                      value={node.coverageStatus}
                      map={COVERAGE_CFG}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {node.position.department?.name ?? '—'}
                    {node.position.level ? ` · ${node.position.level}` : ''}
                  </div>

                  {/* Titular */}
                  {node.position.users[0] && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar
                        name={node.position.users[0].fullName}
                        avatarUrl={node.position.users[0].avatarUrl}
                        size="sm"
                      />
                      <span className="text-xs text-gray-600">
                        {node.position.users[0].fullName}
                      </span>
                      {node.daysUntilExit !== null && (
                        <span
                          className={`text-xs font-mono ml-auto ${node.daysUntilExit <= 90 ? 'text-red-600 font-bold' : 'text-gray-400'}`}
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
                        className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"
                      >
                        <Avatar
                          name={s.fullName}
                          avatarUrl={s.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <div className="text-xs font-medium text-gray-800">
                            {s.fullName.split(' ')[0]}
                          </div>
                          <div
                            className={`text-xs ${READINESS_CFG[s.readinessLevel].cls.split(' ')[1]}`}
                          >
                            {READINESS_CFG[s.readinessLevel].label}
                          </div>
                        </div>
                      </div>
                    ))}
                    {node.successors.length === 0 && (
                      <span className="text-xs text-red-500 font-medium">
                        ⚠ Sem sucessores
                      </span>
                    )}
                  </div>
                </div>

                {/* Gauges */}
                <div className="flex-shrink-0 text-center">
                  <div className="text-2xl font-bold font-mono text-gray-700">
                    {node.successors.length}
                  </div>
                  <div className="text-xs text-gray-400">sucessores</div>
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === node.id && node.successors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Pipeline de sucessão
                  </div>
                  {node.successors.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <Avatar
                        name={s.fullName}
                        avatarUrl={s.avatarUrl}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">
                          {s.fullName}
                        </div>
                      </div>
                      <ReadinessBadge level={s.readinessLevel} />
                      <MatchScore score={s.matchScore} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        {nodes.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Nenhum cargo crítico definido
          </div>
        )}
      </div>
    </div>
  );
}
