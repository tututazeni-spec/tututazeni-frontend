// components/evaluation/CyclesTab.tsx
// Separador "Ciclos" — grelha de ciclos de avaliação + acções de
// publicar/activar. Dados próprios (useApiQuery) + apresentação. Extraído
// de app/(platform)/evaluation/page.tsx.

'use client';

import { Calendar } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MODEL_LABEL, STATUS_MAP } from './constants';
import type { Cycle } from './types';

export function CyclesTab() {
  const notify = useToast();
  const role = useCurrentRole();
  // Publicar/Activar espelham @Roles(ADMIN, RH) de POST
  // /evaluations/cycles/:id/publish e /activate (evaluation.controller.ts) —
  // um COLABORADOR pode ver este separador (participa nas suas avaliações),
  // mas não gere o ciclo. Sem isto os botões apareciam para todos e
  // rebentavam com 403 ao clicar.
  const canManageCycle = !!role && ADMIN_ROLES.includes(role);
  const { data, isLoading: loading } = useApiQuery<{
    data: Cycle[];
    meta: { total: number };
  }>(queryKeys.evaluation.cycles(), '/evaluations/cycles', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-ink">
          Ciclos de Avaliação
        </h3>
        <span className="text-xs text-ink-faint">
          {data?.meta.total ?? 0} ciclos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((cycle) => (
          <Card key={cycle.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <StatusBadge
                  value={cycle.status}
                  map={STATUS_MAP}
                  variant="pill"
                />
                <span className="text-xs text-ink-faint">
                  {MODEL_LABEL[cycle.model] ?? cycle.model}
                </span>
              </div>

              <h4 className="font-semibold text-ink mb-3">{cycle.name}</h4>

              {/* Participation */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-muted">Participação</span>
                  <span
                    className={cn(
                      'font-semibold',
                      cycle.participation.rate >= 75
                        ? 'text-success-ink'
                        : 'text-primary',
                    )}
                  >
                    {cycle.participation.rate}%
                  </span>
                </div>
                <ProgressBar value={cycle.participation.rate} />
                <p className="text-[10px] text-ink-faint mt-1">
                  {cycle.participation.completed}/{cycle.participation.total}{' '}
                  avaliações
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-faint">
                <span>
                  <Calendar
                    size={12}
                    strokeWidth={1.75}
                    className="inline align-[-2px]"
                  />{' '}
                  {new Date(cycle.startDate).toLocaleDateString('pt')}
                </span>
                <span>→</span>
                <span>{new Date(cycle.endDate).toLocaleDateString('pt')}</span>
              </div>

              {/* Actions */}
              {canManageCycle && cycle.status === 'DRAFT' && (
                <Button
                  size="sm"
                  intent="secondary"
                  className="mt-3 w-full"
                  onClick={() =>
                    apiClient
                      .post(`/evaluations/cycles/${cycle.id}/publish`, {})
                      .then(() => window.location.reload())
                      .catch((e) => {
                        reportError(e, { source: 'CyclesTab.publish' });
                        notify({
                          title: e instanceof Error ? e.message : String(e),
                          intent: 'danger',
                        });
                      })
                  }
                >
                  Publicar
                </Button>
              )}
              {canManageCycle && cycle.status === 'PUBLISHED' && (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    apiClient
                      .post(`/evaluations/cycles/${cycle.id}/activate`, {})
                      .then(() => window.location.reload())
                      .catch((e) => {
                        reportError(e, { source: 'CyclesTab.activate' });
                        notify({
                          title: e instanceof Error ? e.message : String(e),
                          intent: 'danger',
                        });
                      })
                  }
                >
                  Activar
                </Button>
              )}
            </CardBody>
          </Card>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <EmptyState
            title="Nenhum ciclo criado ainda"
            description="Cria o primeiro ciclo de avaliação para começar."
            className="col-span-1 md:col-span-2 xl:col-span-3"
          />
        )}
      </div>
    </div>
  );
}
