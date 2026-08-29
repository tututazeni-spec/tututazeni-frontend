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

// Rótulos em português para as categorias devolvidas pela API (em inglês).
export const CATEGORY_LABEL: Record<string, string> = {
  HR: 'RH',
  LMS: 'LMS',
  PERFORMANCE: 'Desempenho',
  ENGAGEMENT: 'Envolvimento',
  GAMIFICATION: 'Gamificação',
  OPERATIONAL: 'Operacional',
  AUTOMATION: 'Automação',
  CUSTOM: 'Personalizado',
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
