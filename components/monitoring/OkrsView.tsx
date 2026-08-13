// components/monitoring/OkrsView.tsx

import { ClipboardList, Target } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { ErrorBanner, ListSkeleton } from './shared';
import { OKR_STATUS_INTENT } from './types';
import type { Cycle, Objective } from './types';

interface OkrsViewProps {
  cycles: Cycle[];
  selectedCycle: string;
  setSelectedCycle: (id: string) => void;
  objectives: Objective[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function OkrsView({
  cycles,
  selectedCycle,
  setSelectedCycle,
  objectives,
  loading,
  error,
  onRetry,
}: OkrsViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          OKRs — Objectivos e Resultados-Chave
        </h1>
        <div className="flex gap-2">
          <a
            href="/monitoring/indicators"
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            Indicadores
          </a>
          <a
            href="/monitoring/evaluations"
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            Avaliações
          </a>
        </div>
      </div>

      {cycles.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhum ciclo OKR criado"
          description="Cria um ciclo para começares a definir objectivos."
        />
      ) : (
        <>
          <Select
            items={cycles.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCycle}
            onValueChange={setSelectedCycle}
          />

          {objectives.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum objectivo neste ciclo"
              description="Ainda não há objectivos definidos para este ciclo."
            />
          ) : (
            <div className="space-y-4">
              {objectives.map((obj) => (
                <Card key={obj.id} className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-body text-xs uppercase text-ink-faint">
                        {obj.type}
                      </span>
                      <h3 className="font-display font-semibold text-ink">{obj.title}</h3>
                      <p className="font-body text-sm text-ink-muted">{obj.owner?.fullName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-primary">
                        {Math.round(obj.progress)}%
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={obj.progress} className="mb-4 h-2" />

                  <div className="space-y-2">
                    {obj.keyResults?.map((kr) => (
                      <div
                        key={kr.id}
                        className="flex justify-between items-center rounded-control bg-surface-sunken p-3"
                      >
                        <div className="flex-1">
                          <p className="font-body text-sm font-medium text-ink">{kr.title}</p>
                          <p className="font-body text-xs text-ink-faint">
                            {kr.currentValue} / {kr.targetValue} {kr.unit || ''}
                          </p>
                        </div>
                        <Badge intent={OKR_STATUS_INTENT[kr.status] ?? 'neutral'}>
                          {Math.round(kr.progress)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
