// components/trainings/DashboardView.tsx
// Separador "Dashboard (Admin)" — KPIs, participantes e top
// treinamentos. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from './StarRating';
import { TYPE_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.trainings.adminDashboard(),
    '/trainings/admin/dashboard',
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
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon={GraduationCap}
          label="Total treinamentos"
          value={data.trainings.total}
          intent="primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Publicados"
          value={data.trainings.published}
          intent="success"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Obrigatórios"
          value={data.trainings.mandatory}
          intent="danger"
        />
        <KpiCard
          icon={TrendingUp}
          label="Taxa de conclusão"
          value={`${data.completionRate}%`}
          intent="info"
        />
      </div>

      {/* Participantes */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mb-1 font-body text-xs text-ink-faint">
            Total inscrições
          </div>
          <div className="font-mono text-3xl font-bold text-ink">
            {data.participants.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 font-body text-xs text-ink-faint">
            Rating médio
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-3xl font-bold text-accent">
              {data.avgRating.toFixed(1)}
            </div>
            <StarRating value={data.avgRating} />
          </div>
        </Card>
      </div>

      {/* Top */}
      {data.topTrainings.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Mais populares
          </div>
          {data.topTrainings.map((t, idx) => (
            <div
              key={t.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-6 text-center font-mono text-lg font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {t.title}
                </div>
                <div className="flex items-center gap-2 font-body text-xs text-ink-faint">
                  <span className={`${TYPE_CFG[t.type].cls} rounded px-1.5`}>
                    {TYPE_CFG[t.type].icon}
                  </span>
                  <span>{t._count.participants} inscritos</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
