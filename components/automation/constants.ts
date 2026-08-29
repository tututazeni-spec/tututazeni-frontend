// components/automation/constants.ts
// Constantes de domínio partilhadas pelos separadores do módulo automation.
// Migradas de atoms.tsx: CATEGORY_COLOR (classes Tailwind cruas por
// categoria) passa a CATEGORY_INTENT (intent do Badge da fundação de
// design, @/components/ui/Badge) — TRIGGER_LABEL não muda.

import type { BadgeProps } from '@/components/ui/Badge';

export const CATEGORY_INTENT: Record<string, BadgeProps['intent']> = {
  HR: 'info',
  LMS: 'info',
  PERFORMANCE: 'warning',
  ENGAGEMENT: 'success',
  GAMIFICATION: 'warning',
  OPERATIONAL: 'neutral',
  CUSTOM: 'neutral',
};

export const TRIGGER_LABEL: Record<string, string> = {
  'employee.created': '👤 Novo Colaborador',
  'employee.deactivated': ' Colaborador Desactivado',
  'course.completed': ' Curso Concluído',
  'pdi.approved': ' PDI Aprovado',
  'evaluation.submitted': ' Avaliação Submetida',
  'badge.awarded': ' Badge Atribuído',
  'cron.daily': ' Diário',
  'cron.weekly': ' Semanal',
  'cron.monthly': ' Mensal',
  BIRTHDAY_TODAY: ' Aniversário',
  ENROLLMENT_EXPIRING: ' Formação Pendente',
  PAYSLIP_DUE: ' Recibos Pendentes',
  manual: '▶ Manual',
};
