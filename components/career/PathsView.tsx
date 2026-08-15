// components/career/PathsView.tsx
// Separador "Trilhas" — lista + detalhe (passos/cargos) de uma trilha
// de carreira. Dados próprios + apresentação. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { Map } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CAREER_PATH_TYPE } from './constants';
import type { CareerPath } from './types';

export function PathsView() {
  const [selected, setSelected] = useState<CareerPath | null>(null);
  const { data: paths = [], isLoading: loading } = useApiQuery<CareerPath[]>(
    queryKeys.career.paths(),
    '/career/paths',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5">
      {/* Lista */}
      <div className="space-y-2">
        {paths.map((path) => (
          <Card
            key={path.id}
            onClick={() => setSelected(path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(path);
              }
            }}
            className={cn(
              'cursor-pointer p-4 transition-shadow duration-150 hover:shadow-hover',
              selected?.id === path.id && 'border-primary bg-primary-subtle',
            )}
          >
            <div className="font-body text-sm font-semibold text-ink">
              {path.name}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-body text-xs text-ink-faint">
                {CAREER_PATH_TYPE[path.type] ?? path.type}
              </span>
              <span className="font-body text-xs text-ink-faint">
                {path.steps?.length ?? 0} cargos
              </span>
            </div>
          </Card>
        ))}
        {paths.length === 0 && (
          <EmptyState
            icon={Map}
            title="Sem trilhas de carreira"
            description="Ainda não há trilhas de carreira configuradas."
          />
        )}
      </div>

      {/* Detalhe */}
      <div>
        {!selected ? (
          <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
            Selecciona uma trilha
          </div>
        ) : (
          <Card className="p-5">
            <div className="mb-1 font-display text-lg font-bold text-ink">
              {selected.name}
            </div>
            <div className="mb-4 flex gap-2">
              <Badge intent="info">
                {CAREER_PATH_TYPE[selected.type] ?? selected.type}
              </Badge>
              <Badge intent="neutral">{selected.steps.length} passos</Badge>
            </div>
            {selected.description && (
              <p className="mb-4 font-body text-sm text-ink-muted">
                {selected.description}
              </p>
            )}

            {/* Passos / Cargos */}
            <div className="space-y-3">
              {selected.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-canvas">
                      {step.order}
                    </div>
                    {idx < selected.steps.length - 1 && (
                      <div className="mt-1 h-6 w-0.5 bg-border-strong" />
                    )}
                  </div>
                  <div className="flex-1 rounded-card bg-surface-sunken p-3">
                    <div className="font-body text-sm font-semibold text-ink">
                      {step.position?.name}
                    </div>
                    <div className="mt-1 flex gap-3 font-body text-xs text-ink-faint">
                      {step.minMonthsRequired && (
                        <span>⏱ {step.minMonthsRequired}m mínimos</span>
                      )}
                      {step.minPerformanceScore && (
                        <span>⭐ Score ≥{step.minPerformanceScore}</span>
                      )}
                      {(step.requiredCourseIds?.length ?? 0) > 0 && (
                        <span>
                          📚 {step.requiredCourseIds?.length} cursos
                          obrigatórios
                        </span>
                      )}
                    </div>
                    {(step.position?.competencies?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.position?.competencies?.slice(0, 4).map((pc) => (
                          <span
                            key={pc.competency.id}
                            className="rounded bg-info-subtle px-1.5 py-0.5 font-body text-xs text-info-ink"
                          >
                            {pc.competency.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
