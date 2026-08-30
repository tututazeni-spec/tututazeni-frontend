// components/notifications/shared.tsx
// CATEGORY_CFG/Skeleton partilhados entre InboxView, PreferencesView e
// AdminView (as duas últimas continuam em notifications/page.tsx). Ver
// memory project_innova_component_separation_audit, item 3.6.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export const CATEGORY_CFG: Record<string, { label: string; cls: string }> = {
  LMS: { label: 'Aprendizagem', cls: 'bg-info-subtle text-info-ink' },
  PDI: { label: 'PDI', cls: 'bg-primary-subtle text-primary' },
  PERFORMANCE: {
    label: 'Performance',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  HR: { label: 'RH', cls: 'bg-success-subtle text-success-ink' },
  ENGAGEMENT: {
    label: 'Engajamento',
    cls: 'bg-danger-subtle text-danger-ink',
  },
  GAMIFICATION: {
    label: 'Gamificação',
    cls: 'bg-accent-subtle text-accent',
  },
  SYSTEM: { label: 'Sistema', cls: 'bg-surface-sunken text-ink-muted' },
  ONBOARDING: {
    label: 'Integração',
    cls: 'bg-info-subtle text-info-ink',
  },
  KNOWLEDGE: {
    label: 'Conhecimento',
    cls: 'bg-primary-subtle text-primary',
  },
};

export interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-16 bg-surface-sunken rounded-card"
    />
  );
}
