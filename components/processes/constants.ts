// components/processes/constants.ts
// Mapas de badge e helpers de formatação partilhados pelos componentes de
// apresentação do módulo de processos. Extraído verbatim de
// app/(platform)/processes/page.tsx. Cores mapeadas para os tokens
// semânticos da fundação de design (Fase A).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  DeadlineSituation,
  InstanceStatus,
  ProcessPriority,
  ProcessStatus,
  TaskState,
  RiskLevel,
  StepType,
  TabKey,
} from './types';

export function fmtDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export const PROCESS_STATUS_MAP: StatusBadgeMap<ProcessStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

// Gradação de risco — mesma convenção usada em components/audit/constants.ts
// (SEVERITY_CFG): neutro → info → warning → danger.
export const RISK_LEVEL_MAP: StatusBadgeMap<RiskLevel> = {
  LOW: { label: 'Baixo', cls: 'bg-surface-sunken text-ink-muted' },
  MEDIUM: { label: 'Médio', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alto', cls: 'bg-warning-subtle text-warning-ink' },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger-subtle text-danger-ink' },
};

export const INSTANCE_STATUS_MAP: StatusBadgeMap<InstanceStatus> = {
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-faint' },
  ON_HOLD: { label: 'Suspenso', cls: 'bg-warning-subtle text-warning-ink' },
};

export const STEP_TYPE_MAP: StatusBadgeMap<StepType> = {
  START: { label: 'Início', cls: 'bg-success-subtle text-success-ink' },
  END: { label: 'Fim', cls: 'bg-surface-sunken text-ink-muted' },
  TASK: { label: 'Tarefa', cls: 'bg-info-subtle text-info-ink' },
  DECISION: { label: 'Decisão', cls: 'bg-primary-subtle text-primary' },
  GATEWAY: { label: 'Gateway', cls: 'bg-warning-subtle text-warning-ink' },
  REVIEW: { label: 'Revisão', cls: 'bg-accent-subtle text-accent' },
};

// Abas do módulo (docs/Modulo_Processes.md §2). `ready` marca as já
// implementadas; as restantes mostram um estado vazio até à fase respectiva.
// `description` é dinâmica por aba — o título principal do módulo não muda
// (§21).
export const NAV: Array<{
  id: TabKey;
  label: string;
  description: string;
  ready: boolean;
}> = [
  { id: 'overview', label: 'Visão Geral', description: 'Indicadores, alertas e resumo dos processos.', ready: true },
  { id: 'all', label: 'Todos os Processos', description: 'Lista centralizada dos processos existentes.', ready: true },
  { id: 'templates', label: 'Modelos de Processos', description: 'Criação e gestão de modelos reutilizáveis.', ready: true },
  { id: 'tasks', label: 'Tarefas e Etapas', description: 'Execução, atribuição e acompanhamento das tarefas.', ready: true },
  { id: 'approvals', label: 'Aprovações', description: 'Pedidos pendentes de validação ou decisão.', ready: false },
  { id: 'workflows', label: 'Fluxos de Trabalho', description: 'Desenho das etapas, regras e transições.', ready: false },
  { id: 'automations', label: 'Automações', description: 'Regras automáticas, condições e ações.', ready: false },
  { id: 'calendar', label: 'Calendário e Prazos', description: 'Datas-limite, vencimentos e tarefas agendadas.', ready: false },
  { id: 'documents', label: 'Documentos', description: 'Documentos, formulários e anexos associados.', ready: false },
  { id: 'reports', label: 'Indicadores e Relatórios', description: 'Tempos, volumes, atrasos e níveis de cumprimento.', ready: false },
  { id: 'history', label: 'Histórico e Auditoria', description: 'Registo cronológico das alterações e decisões.', ready: false },
  { id: 'settings', label: 'Configurações', description: 'Permissões, prioridades, estados e regras gerais.', ready: false },
];

export const INSTANCE_STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Em execução',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  ON_HOLD: 'Suspenso',
};

export function fmtHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 48) return `${hours}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

export const PRIORITY_MAP: StatusBadgeMap<ProcessPriority> = {
  LOW: { label: 'Baixa', cls: 'bg-surface-sunken text-ink-muted' },
  NORMAL: { label: 'Normal', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alta', cls: 'bg-warning-subtle text-warning-ink' },
  URGENT: { label: 'Urgente', cls: 'bg-danger-subtle text-danger-ink' },
};

export const DEADLINE_MAP: StatusBadgeMap<DeadlineSituation> = {
  ON_TIME: { label: 'Dentro do prazo', cls: 'bg-success-subtle text-success-ink' },
  AT_RISK: { label: 'Em risco', cls: 'bg-warning-subtle text-warning-ink' },
  OVERDUE: { label: 'Atrasado', cls: 'bg-danger-subtle text-danger-ink' },
  NONE: { label: 'Sem prazo', cls: 'bg-surface-sunken text-ink-faint' },
};

export const TASK_STATE_MAP: StatusBadgeMap<TaskState> = {
  WAITING: { label: 'Em espera', cls: 'bg-surface-sunken text-ink-faint' },
  PENDING: { label: 'Pendente', cls: 'bg-info-subtle text-info-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-primary-subtle text-primary' },
  BLOCKED: { label: 'Bloqueada', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Rejeitada', cls: 'bg-danger-subtle text-danger-ink' },
  ESCALATED: { label: 'Escalada', cls: 'bg-danger-subtle text-danger-ink' },
  SKIPPED: { label: 'Ignorada', cls: 'bg-surface-sunken text-ink-muted' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-surface-sunken text-ink-faint' },
};

export function fmtElapsed(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return '<1h';
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
