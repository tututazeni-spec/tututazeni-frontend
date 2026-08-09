// components/notifications/shared.tsx
// CATEGORY_CFG/Skeleton partilhados entre InboxView, PreferencesView e
// AdminView (as duas últimas continuam em notifications/page.tsx). Ver
// memory project_innova_component_separation_audit, item 3.6.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export const CATEGORY_CFG: Record<
  string,
  { icon: string; label: string; cls: string }
> = {
  LMS: { icon: '🎓', label: 'Aprendizagem', cls: 'bg-blue-50 text-blue-700' },
  PDI: { icon: '🎯', label: 'PDI', cls: 'bg-purple-50 text-purple-700' },
  PERFORMANCE: {
    icon: '📊',
    label: 'Performance',
    cls: 'bg-amber-50 text-amber-700',
  },
  HR: { icon: '👤', label: 'RH', cls: 'bg-emerald-50 text-emerald-700' },
  ENGAGEMENT: {
    icon: '💬',
    label: 'Engagement',
    cls: 'bg-pink-50 text-pink-700',
  },
  GAMIFICATION: {
    icon: '🏆',
    label: 'Gamificação',
    cls: 'bg-yellow-50 text-yellow-700',
  },
  SYSTEM: { icon: '⚙️', label: 'Sistema', cls: 'bg-gray-100 text-gray-600' },
  ONBOARDING: {
    icon: '🚀',
    label: 'Onboarding',
    cls: 'bg-teal-50 text-teal-700',
  },
  KNOWLEDGE: {
    icon: '📚',
    label: 'Conhecimento',
    cls: 'bg-indigo-50 text-indigo-700',
  },
};

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-16 bg-gray-100 rounded-xl"
    />
  );
}
