// components/talent-development/SkillGapsTab.tsx
// Separador "Skill Gaps" — necessidades de formação + heatmap de skills
// por departamento. Dados próprios (useApiQuery) + apresentação. Extraído
// de app/(platform)/talent-development/page.tsx.
//
// Heatmap: EXCEÇÃO DOCUMENTADA à migração de paleta crua (ver nota
// "módulos com visualização de dados" no plano de rollout, Task 0). A cor
// de cada célula codifica o nível médio de skill (1–4) por departamento —
// é codificação sequencial de magnitude de dados (heatmap), não estado
// decorativo. Fica fora do escopo deste rollout.
//
// A barra de progresso da lista "Necessidades de Formação" cumpre a regra
// "ProgressBar é mono-cor" (nota 5 da recipe): o significado da cor
// (severidade do gap) já estava replicado no número "-{avgGap}" ao lado —
// esse número passa a usar o token semântico correspondente em vez da
// barra colorida.

'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SkillHeatmapRow, TrainingNeed } from './types';

function gapIntent(avgGap: number): string {
  if (avgGap >= 3) return 'text-danger-ink';
  if (avgGap >= 2) return 'text-warning-ink';
  return 'text-success-ink';
}

function heatmapCellClass(level: number | null): string {
  if (level === null) return 'bg-surface-sunken';
  if (level >= 4) return 'bg-success-subtle text-success-ink';
  if (level >= 3) return 'bg-info-subtle text-info-ink';
  if (level >= 2) return 'bg-warning-subtle text-warning-ink';
  return 'bg-danger-subtle text-danger-ink';
}

export function SkillGapsTab() {
  const [view, setView] = useState<'needs' | 'heatmap'>('needs');

  const needsQuery = useApiQuery<TrainingNeed[]>(
    queryKeys.talentDevelopment.trainingNeeds(),
    '/talent/training-needs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<SkillHeatmapRow[]>(
    queryKeys.talentDevelopment.skillHeatmap(),
    '/talent/skill-heatmap',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const needs = needsQuery.data ?? [];
  const heatmap = heatmapQuery.data ?? [];

  if (needsQuery.isLoading || heatmapQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  const depts = Array.from(
    new Set(heatmap.flatMap((h) => h.departments.map((d) => d.department))),
  );

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        {(['needs', 'heatmap'] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            intent={view === v ? 'primary' : 'secondary'}
            onClick={() => setView(v)}
          >
            {v === 'needs'
              ? 'Necessidades de Formação'
              : 'Mapa de Calor de Competências'}
          </Button>
        ))}
      </div>

      {view === 'needs' && (
        <Card>
          <CardHeader>
            <h3 className="font-display font-semibold text-ink">
              Top Habilidades Com Maior Lacunas
            </h3>
            <p className="mt-0.5 font-body text-xs text-ink-faint">
              Ordenado por Média de Lacunas— colaboradores vs nível alvo
            </p>
          </CardHeader>
          <div className="divide-y divide-border">
            {needs.slice(0, 15).map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="w-5 font-body text-xs font-bold text-ink-faint">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {item.skill?.name ?? item.competency?.name}
                  </p>
                  <p className="font-body text-xs text-ink-faint">
                    {item.category} · {item.count} colaboradores
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar value={100 - (item.avgGap / 5) * 100} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`font-display text-lg font-bold ${gapIntent(item.avgGap)}`}
                  >
                    -{item.avgGap}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    gap médio
                  </p>
                </div>
              </div>
            ))}
            {needs.length === 0 && (
              <EmptyState
                title="Sem lacunas de habilidades registadas"
                description="Ainda não há avaliações de habilidades suficientes para calcular lacunas."
                className="border-none"
              />
            )}
          </div>
        </Card>
      )}

      {view === 'heatmap' && (
        <Card className="overflow-x-auto">
          <CardHeader>
            <h3 className="font-display font-semibold text-ink">
              Mapa de calor de habilidades por Departamento
            </h3>
          </CardHeader>
          <table className="min-w-full font-body text-xs">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-ink-muted">
                  Habilidade
                </th>
                {depts.map((dept) => (
                  <th
                    key={dept}
                    className="whitespace-nowrap px-3 py-2 text-center font-medium text-ink-muted"
                  >
                    {dept}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {heatmap.map((row, i) => (
                <tr key={i} className="hover:bg-surface-sunken">
                  <td className="px-4 py-2 font-medium text-ink">
                    {row.skill}
                  </td>
                  {depts.map((dept) => {
                    const d = row.departments.find(
                      (x) => x.department === dept,
                    );
                    const lvl = d?.avgLevel ?? null;
                    return (
                      <td
                        key={dept}
                        className={`px-3 py-2 text-center font-semibold ${heatmapCellClass(lvl)}`}
                      >
                        {lvl !== null ? lvl.toFixed(1) : '–'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {heatmap.length === 0 && (
            <p className="py-12 text-center font-body text-sm text-ink-faint">
              Sem dados de habilidades avaliadas
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
