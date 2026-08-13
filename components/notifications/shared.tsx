// components/notifications/shared.tsx
// CATEGORY_CFG/Skeleton partilhados entre InboxView, PreferencesView e
// AdminView (as duas últimas continuam em notifications/page.tsx). Ver
// memory project_innova_component_separation_audit, item 3.6.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export const CATEGORY_CFG: Record<
  string,
  { icon: string; label: string; cls: string }
> = {
  LMS: { icon: '🎓', label: 'Aprendizagem', cls: 'bg-info-subtle text-info-ink' },
  PDI: { icon: '🎯', label: 'PDI', cls: 'bg-primary-subtle text-primary' },
  PERFORMANCE: {
    icon: '📊',
    label: 'Performance',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  HR: { icon: '👤', label: 'RH', cls: 'bg-success-subtle text-success-ink' },
  ENGAGEMENT: {
    icon: '💬',
    label: 'Engagement',
    cls: 'bg-danger-subtle text-danger-ink',
  },
  GAMIFICATION: {
    icon: '🏆',
    label: 'Gamificação',
    cls: 'bg-accent-subtle text-accent',
  },
  SYSTEM: { icon: '⚙️', label: 'Sistema', cls: 'bg-surface-sunken text-ink-muted' },
  ONBOARDING: {
    icon: '🚀',
    label: 'Onboarding',
    cls: 'bg-info-subtle text-info-ink',
  },
  KNOWLEDGE: {
    icon: '📚',
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
