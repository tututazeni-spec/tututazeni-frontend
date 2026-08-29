// components/learning-paths/DashboardView.tsx
// Separador "Dashboard (Admin)" — métricas globais e top trilhas. Dados
// próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: métricas passam a KpiCard, skeleton local (atoms.tsx) passa a
// Skeleton da fundação, lista "top trilhas" passa a Card (mesmo padrão
// de components/trainings/DashboardView.tsx).

'use client';

import { CheckCircle2, Route, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LP_STATUS_MAP, LP_TYPE_MAP } from './constants';
import type { AdminDashboard } from './types';

interface DashboardViewProps {
  onSelect: (id: number) => void;
}

export function DashboardView({ onSelect }: DashboardViewProps) {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.learningPaths.adminDashboard(),
    '/learning-paths/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Total de trilhas"
          value={data.paths.total}
          intent="primary"
        />
        <KpiCard
          label="Publicadas"
          value={data.paths.published}
          intent="success"
        />
        <KpiCard
          label="Matrículas"
          value={data.enrollments.total}
          intent="accent"
        />
        <KpiCard
          label="Taxa conclusão"
          value={`${data.completionRate}%`}
          intent="info"
        />
      </div>

      {/* Top trilhas */}
      {data.topPaths.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Trilhas mais populares
          </div>
          {data.topPaths.map((p, idx) => (
            <div
              key={p.id}
              className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
              onClick={() => onSelect(p.id)}
            >
              <span className="w-6 text-center font-mono text-lg font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {p.title}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  <StatusBadge value={p.pathType} map={LP_TYPE_MAP} />
                </div>
              </div>
              <div className="font-body text-sm text-ink-muted">
                {p._count.enrollments} matrículas
              </div>
              <StatusBadge value={p.status} map={LP_STATUS_MAP} variant="dot" />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
