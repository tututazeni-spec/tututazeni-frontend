// components/audit/constants.ts
// Mapas de badges/rótulos e navegação do módulo de auditoria. Cores
// mapeadas para os tokens semânticos da fundação de design (Fase A).
// Extraído de app/(platform)/audit/page.tsx.

import {
  BarChart3,
  ClipboardCheck,
  Download,
  FileDiff,
  GitCommitHorizontal,
  LayoutDashboard,
  LogIn,
  Scale,
  ScrollText,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import {
  AUDIT_GLOBAL_ROLES,
  AUDIT_SCOPED_ROLES,
  EVAL_CYCLE_DELETE_ROLES,
  type Role,
} from '@/lib/roles';
import type { Severity, Status, View } from './types';

export const SEVERITY_CFG: Record<
  Severity,
  { label: string; cls: string; dot: string }
> = {
  LOW: { label: 'Baixa', cls: 'text-ink-faint', dot: 'bg-ink-faint' },
  MEDIUM: { label: 'Média', cls: 'text-info-ink', dot: 'bg-info' },
  HIGH: { label: 'Alta', cls: 'text-warning-ink', dot: 'bg-warning' },
  CRITICAL: { label: 'Crítica', cls: 'text-danger-ink', dot: 'bg-danger' },
};

export const STATUS_CFG: StatusBadgeMap<Status> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
  DENIED: { label: 'Negado', cls: 'bg-warning-subtle text-warning-ink' },
};

// Rótulos PT das acções de auditoria (sem ícones).
export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Eliminar',
  LOGIN: 'Início de sessão',
  LOGOUT: 'Fim de sessão',
  FAILED: 'Falhou',
  EXPORT: 'Exportar',
  SEND: 'Enviar',
  READ: 'Leitura',
  APPROVE: 'Aprovar',
  REJECT: 'Rejeitar',
  DENIED: 'Negado',
  PUBLISH: 'Publicar',
  CALIBRATE: 'Calibrar',
  CALIBRATE2: 'Calibrar',
  SUBMIT: 'Submeter',
  SUBMIT2: 'Submeter',
  SAVE_DRAFT: 'Guardar rascunho',
  RESTORE: 'Restaurar',
};

/** Rótulo PT de uma acção, com fallback legível para acções não mapeadas. */
export function actionLabel(action: string): string {
  if (!action) return '—';
  const key = action.toUpperCase().replace(/[\s-]+/g, '_');
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];
  const pretty = key.replace(/_/g, ' ').toLowerCase();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

// Rótulos PT das entidades auditadas.
export const ENTITY_LABELS: Record<string, string> = {
  User: 'Utilizador',
  EvaluationResponse: 'Resposta de avaliação',
  EvaluationResult: 'Resultado de avaliação',
  EvaluationCycle: 'Ciclo de avaliação',
  Competency: 'Competência',
  EvaluationQuestion: 'Pergunta de avaliação',
  Beneficiary: 'Beneficiário',
  Funder: 'Financiador',
  Partner: 'Parceiro',
};

/** Rótulo PT de uma entidade, com fallback para o nome original. */
export function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}

// `roles` espelha exactamente quem o backend deixa entrar em cada separador —
// as abas 01-09 vêm de AuditController (@Roles(ADMIN, RH) a nível de classe);
// 'deleted' vem de GET /evaluation360/cycles/deleted (@Roles(ADMIN, DIRECTOR)
// — EVAL_CYCLE_DELETE_ROLES). DIRECTOR só vê "Apagados": não ganha acesso aos
// logs gerais de auditoria só por poder eliminar/restaurar ciclos.
// Ordem e nomes seguem docs/modulo_audit.md §2 (abas 01-09); "Linha de
// Tempo" e "Apagados" são extras anteriores ao spec e ficam no fim.
// §16: RH/GESTOR só vêem os separadores de consulta (âmbito limitado no backend).
export const NAV: Array<{
  id: View;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  roles: readonly Role[];
}> = [
  {
    id: 'overview',
    hint: 'Resumo de auditoria',
    icon: LayoutDashboard,
    label: 'Visão Geral',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'logs',
    hint: 'Todos os eventos',
    icon: ScrollText,
    label: 'Registos de Auditoria',
    roles: [...AUDIT_GLOBAL_ROLES, ...AUDIT_SCOPED_ROLES],
  },
  {
    id: 'access',
    hint: 'Logins e sessões',
    icon: LogIn,
    label: 'Acessos e Sessões',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'changes',
    hint: 'Antes e depois',
    icon: FileDiff,
    label: 'Alterações de Dados',
    roles: [...AUDIT_GLOBAL_ROLES, ...AUDIT_SCOPED_ROLES],
  },
  {
    id: 'security',
    hint: 'Ameaças e alertas',
    icon: ShieldAlert,
    label: 'Segurança e Incidentes',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'audits',
    hint: 'Inspeções formais',
    icon: ClipboardCheck,
    label: 'Auditorias e Inspeções',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'reports',
    hint: 'Relatórios',
    icon: BarChart3,
    label: 'Relatórios',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'exports',
    hint: 'Evidências',
    icon: Download,
    label: 'Exportações e Evidências',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'policies',
    hint: 'Retenção de dados',
    icon: Scale,
    label: 'Políticas e Retenção',
    roles: AUDIT_GLOBAL_ROLES,
  },
  {
    id: 'timeline',
    hint: 'Cronologia',
    icon: GitCommitHorizontal,
    label: 'Linha de Tempo',
    roles: [...AUDIT_GLOBAL_ROLES, ...AUDIT_SCOPED_ROLES],
  },
  {
    id: 'deleted',
    hint: 'Registos removidos',
    icon: Trash2,
    label: 'Apagados',
    roles: EVAL_CYCLE_DELETE_ROLES,
  },
];

export const TITLES: Record<View, string> = {
  overview: 'Auditoria e Rastreabilidade',
  logs: 'Registos de Auditoria',
  access: 'Acessos e Sessões',
  changes: 'Alterações de Dados',
  security: 'Segurança e Incidentes',
  audits: 'Auditorias e Inspeções',
  reports: 'Relatórios de Auditoria',
  exports: 'Exportações e Evidências',
  policies: 'Políticas e Retenção',
  timeline: 'Linha de Tempo por Recurso',
  deleted: 'Apagados',
};
