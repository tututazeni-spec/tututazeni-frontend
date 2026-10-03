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
  'employee.created': 'Novo Colaborador',
  'employee.updated': 'Colaborador Actualizado',
  'employee.deactivated': 'Colaborador Desactivado',
  'role.changed': 'Alteração de Cargo',
  'department.changed': 'Alteração de Departamento',
  'course.completed': 'Curso Concluído',
  'course.not_completed': 'Curso Não Concluído',
  'course.enrolled': 'Inscrição em Curso',
  'avatar_training.session_completed': 'Sessão com Avatar Concluída',
  'avatar_training.session_failed': 'Sessão com Avatar Não Aprovada',
  'pdi.created': 'PDI Criado',
  'pdi.approved': 'PDI Aprovado',
  'pdi.at_risk': 'PDI Em Risco',
  'pdi.completed': 'PDI Concluído',
  'evaluation.submitted': 'Avaliação Submetida',
  'badge.awarded': 'Badge Atribuído',
  'certification.expiring': 'Certificação a Expirar',
  'leave.approved': 'Férias Aprovadas',
  'absence.registered': 'Ausência Registada',
  'hire_date.reached': 'Data de Admissão',
  'deadline.reached': 'Prazo Atingido',
  'competency.below_expected': 'Competência Abaixo do Esperado',
  'objective.overdue': 'Objectivo em Atraso',
  'cron.daily': 'Diário',
  'cron.weekly': 'Semanal',
  'cron.monthly': 'Mensal',
  BIRTHDAY_TODAY: ' Aniversário',
  ENROLLMENT_EXPIRING: ' Formação Pendente',
  PAYSLIP_DUE: ' Recibos Pendentes',
  manual: '▶ Manual',
  other: 'Outro',
};

// ── Construtor de Fluxos (§4) — espelham ActionType / ConditionOperator /
// CommunicationChannel em src/automation/automation.dto.ts.
export const ACTION_ITEMS: { value: string; label: string }[] = [
  { value: 'send_notification', label: 'Enviar notificação interna' },
  { value: 'send_email', label: 'Enviar e-mail' },
  { value: 'send_sms', label: 'Enviar SMS' },
  { value: 'send_whatsapp', label: 'Enviar WhatsApp' },
  { value: 'create_task', label: 'Criar tarefa' },
  { value: 'request_approval', label: 'Solicitar aprovação' },
  { value: 'assign_course', label: 'Atribuir curso' },
  { value: 'enroll_training', label: 'Inscrever em formação' },
  { value: 'create_pdi', label: 'Criar PDI' },
  { value: 'update_status', label: 'Alterar estado' },
  { value: 'assign_owner', label: 'Atribuir responsável' },
  { value: 'create_alert', label: 'Criar alerta' },
  { value: 'generate_report', label: 'Gerar documento ou relatório' },
  { value: 'http_request', label: 'Invocar endpoint de API' },
  { value: 'webhook', label: 'Executar webhook' },
  { value: 'run_automation', label: 'Executar outra automação' },
  { value: 'log', label: 'Registar no histórico' },
];

export const OPERATOR_ITEMS: { value: string; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
];
export const VALUELESS_OPERATORS = new Set(['is_empty', 'is_not_empty']);

export const CHANNEL_ITEMS: { value: string; label: string }[] = [
  { value: 'internal', label: 'Notificação interna' },
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];
