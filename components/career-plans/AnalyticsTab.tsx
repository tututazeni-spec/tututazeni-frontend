// components/career-plans/AnalyticsTab.tsx
// Tab "Analytics": KPIs agregados de planos e promoções. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';
import { KpiCard } from './atoms';
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
          icon={Target}
          color="blue"
        />
        <KpiCard
          label="Concluídos"
          value={analytics.plans.completed}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          label="Promoções Aprovadas"
          value={analytics.promotions.approved}
          icon={TrendingUp}
          color="violet"
        />
        <KpiCard
          label="Tempo Médio Promoção"
          value={`${analytics.avgPromotionDays}d`}
          icon={Clock}
          color="amber"
        />
      </div>
    </div>
  );
}
