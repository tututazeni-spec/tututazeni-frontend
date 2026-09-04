// components/career-plans/AnalyticsTab.tsx
// Tab "Analytics": KPIs agregados de planos e promoções. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import type { CareerPlansAnalytics } from './types';

interface AnalyticsTabProps {
  analytics: CareerPlansAnalytics;
}

export function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Planos Activos"
          value={analytics.plans.active}
          intent="primary"
        />
        <KpiCard
          label="Concluídos"
          value={analytics.plans.completed}
          intent="success"
        />
        <KpiCard
          label="Promoções Aprovadas"
          value={analytics.promotions.approved}
          intent="accent"
        />
        <KpiCard
          label="Tempo Médio Promoção"
          value={`${analytics.avgPromotionDays}d`}
          intent="warning"
        />
      </div>
    </div>
  );
}
