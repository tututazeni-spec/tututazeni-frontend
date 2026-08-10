// components/automation/atoms.tsx

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-16"
    />
  );
}

export const CATEGORY_COLOR: Record<string, string> = {
  HR: 'bg-violet-100 text-violet-700',
  LMS: 'bg-blue-100 text-blue-700',
  PERFORMANCE: 'bg-amber-100 text-amber-700',
  ENGAGEMENT: 'bg-pink-100 text-pink-700',
  GAMIFICATION: 'bg-yellow-100 text-yellow-700',
  OPERATIONAL: 'bg-slate-100 text-slate-600',
  CUSTOM: 'bg-teal-100 text-teal-700',
};

export const TRIGGER_LABEL: Record<string, string> = {
  'employee.created': '👤 Novo Colaborador',
  'employee.deactivated': '🚪 Colaborador Desactivado',
  'course.completed': '📚 Curso Concluído',
  'pdi.approved': '✅ PDI Aprovado',
  'evaluation.submitted': '⭐ Avaliação Submetida',
  'badge.awarded': '🏅 Badge Atribuído',
  'cron.daily': '🗓️ Diário',
  'cron.weekly': '📅 Semanal',
  'cron.monthly': '📆 Mensal',
  BIRTHDAY_TODAY: '🎂 Aniversário',
  ENROLLMENT_EXPIRING: '⏰ Formação Pendente',
  PAYSLIP_DUE: '💰 Recibos Pendentes',
  manual: '▶️ Manual',
};
