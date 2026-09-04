// components/evaluation/PendingTab.tsx
// Separador "Pendentes" — lista de avaliações por preencher. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.

'use client';

import { ClipboardList, AlertTriangle, AlarmClock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EVAL_TYPE_MAP } from './constants';
import type { EvalRequest } from './types';

export function PendingTab() {
  const { data: pending = [], isLoading: loading } = useApiQuery<EvalRequest[]>(
    queryKeys.evaluation.pending(),
    '/evaluations/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">
          Avaliações Pendentes
        </h3>
        <Badge intent={pending.length > 0 ? 'warning' : 'success'}>
          {pending.length} pendentes
        </Badge>
      </div>

      <div className="space-y-3">
        {pending.map((r) => {
          const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
          return (
            <Card
              key={r.id}
              className={
                isOverdue ? 'border-danger bg-danger-subtle' : undefined
              }
            >
              <CardBody>
                <div className="flex items-center gap-4">
                  <Avatar
                    name={r.evaluated.fullName}
                    url={r.evaluated.avatarUrl}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-ink">
                        {r.evaluated.fullName}
                      </p>
                      <StatusBadge
                        value={r.type}
                        map={EVAL_TYPE_MAP}
                        variant="pill"
                      />
                      {isOverdue && <Badge intent="danger">ATRASADO</Badge>}
                    </div>
                    <p className="text-xs text-ink-faint">
                      {r.evaluated.position?.name} ·{' '}
                      {r.evaluated.department?.name}
                    </p>
                    {r.cycle && (
                      <p className="text-xs text-ink-faint">
                        <ClipboardList
                          size={13}
                          strokeWidth={1.75}
                          className="inline align-[-2px]"
                        />{' '}
                        {r.cycle.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {r.dueDate && (
                      <p
                        className={cn(
                          'text-xs font-medium',
                          isOverdue ? 'text-danger-ink' : 'text-ink-muted',
                        )}
                      >
                        {isOverdue ? (
                          <AlertTriangle
                            size={13}
                            strokeWidth={1.75}
                            className="inline"
                          />
                        ) : (
                          <AlarmClock
                            size={13}
                            strokeWidth={1.75}
                            className="inline"
                          />
                        )}{' '}
                        {new Date(r.dueDate).toLocaleDateString('pt')}
                      </p>
                    )}
                    <Button size="sm" className="mt-2">
                      Avaliar →
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {pending.length === 0 && (
          <EmptyState
            title="Sem avaliações pendentes"
            description="Não tens avaliações à espera de resposta."
          />
        )}
      </div>
    </div>
  );
}
