// components/history/constants.ts
// Configuração visual de categorias e navegação de tabs do módulo
// de histórico. Extraído de app/(platform)/history/page.tsx.
//
// CATEGORY_COLOR migrado para os tokens semânticos da fundação de design
// (Fase A) — 8 categorias de domínio para 6 tokens semânticos + neutral,
// por isso ATTENDANCE/FINANCIAL (ambas verdes no original: teal/emerald)
// partilham 'success', mesmo padrão de reaproveitamento usado em
// components/automation/constants.ts (CATEGORY_INTENT).

import {
  Activity,
  BarChart3,
  Building2,
  FileText,
  History,
  LayoutDashboard,
  Repeat,
  User,
} from 'lucide-react';
import type { PillTabItem } from '@/components/ui/PillTabs';
import type { PeriodPreset, Tab } from './types';

export const CATEGORY_COLOR: Record<
  string,
  { color: string; bg: string; fill: string }
> = {
  LEARNING: { color: 'text-info-ink', bg: 'bg-info-subtle', fill: 'bg-info' },
  PERFORMANCE: {
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle',
    fill: 'bg-warning',
  },
  CAREER: {
    color: 'text-primary',
    bg: 'bg-primary-subtle',
    fill: 'bg-primary',
  },
  ENGAGEMENT: {
    color: 'text-accent',
    bg: 'bg-accent-subtle',
    fill: 'bg-accent',
  },
  SYSTEM: {
    color: 'text-ink-muted',
    bg: 'bg-surface-sunken',
    fill: 'bg-ink-faint',
  },
  COMPLIANCE: {
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle',
    fill: 'bg-danger',
  },
  ATTENDANCE: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
  FINANCIAL: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
};

// Rótulos PT das categorias de domínio (as chaves permanecem em inglês
// porque são o valor enviado ao backend como filtro).
export const CATEGORY_LABEL: Record<string, string> = {
  LEARNING: 'Aprendizagem',
  PERFORMANCE: 'Desempenho',
  CAREER: 'Carreira',
  ENGAGEMENT: 'Envolvimento',
  SYSTEM: 'Sistema',
  COMPLIANCE: 'Conformidade',
  ATTENDANCE: 'Assiduidade',
  FINANCIAL: 'Financeiro',
};

export const TABS: Array<PillTabItem & { id: Tab }> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo transversal',
    icon: LayoutDashboard,
  },
  { id: 'history', label: 'Histórico', hint: 'Feed de eventos', icon: History },
  {
    id: 'employee',
    label: 'Histórico do Colaborador',
    hint: 'Percurso individual',
    icon: User,
  },
  {
    id: 'movements',
    label: 'Movimentos',
    hint: 'Transferências e promoções',
    icon: Repeat,
  },
  {
    id: 'org',
    label: 'Alterações Organizacionais',
    hint: 'Estrutura da empresa',
    icon: Building2,
  },
  {
    id: 'documents',
    label: 'Documentos & Registos',
    hint: 'Ficheiros e registos',
    icon: FileText,
  },
  {
    id: 'activities',
    label: 'Actividades',
    hint: 'Acções recentes',
    icon: Activity,
  },
  { id: 'reports', label: 'Relatórios', hint: 'Exportações', icon: BarChart3 },
];

export const MODULE_LABEL: Record<string, string> = {
  LMS: 'Formação (LMS)',
  PERFORMANCE: 'Desempenho',
  HR: 'Recursos Humanos',
  ENGAGEMENT: 'Envolvimento',
  TALENT: 'Talento',
  AVATAR: 'Avatar Training',
  DOCUMENTS: 'Documentos',
  SYSTEM: 'Sistema',
  PAYROLL: 'Salários',
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  CREATED: 'Criado',
  UPDATED: 'Actualizado',
  DELETED: 'Eliminado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  TRANSFERRED: 'Transferido',
  PROMOTED: 'Promovido',
  CHANGED: 'Alterado',
  ASSIGNED: 'Atribuído',
  DEACTIVATED: 'Desactivado',
  REACTIVATED: 'Reactivado',
  SUBMITTED: 'Submetido',
  ARCHIVED: 'Arquivado',
};

export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  ADMISSION: 'Admissão',
  TRANSFER: 'Transferência',
  PROMOTION: 'Promoção',
  POSITION_CHANGE: 'Alteração de cargo',
  DEPARTMENT_CHANGE: 'Alteração de departamento',
  MANAGER_CHANGE: 'Mudança de responsável',
  RESTRUCTURE: 'Reestruturação',
  EXIT: 'Saída',
  REACTIVATION: 'Reactivação',
};

export const AUDIT_STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Sucesso',
  FAILED: 'Falhou',
  DENIED: 'Negado',
};

export const DOC_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  EM_REVISAO: 'Em revisão',
  PENDENTE_APROVACAO: 'Pendente de aprovação',
  APROVADO: 'Aprovado',
  ACTIVE: 'Activo',
  SUSPENSO: 'Suspenso',
  EXPIRED: 'Expirado',
  SUBSTITUIDO: 'Substituído',
  ARCHIVED: 'Arquivado',
  DELETED: 'Eliminado',
};

export const PERIOD_PRESET_LABEL: Record<PeriodPreset, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  month: 'Este mês',
  lastMonth: 'Último mês',
  year: 'Este ano',
  all: 'Todo o período',
  custom: 'Intervalo personalizado',
};

export const REPORT_CATALOG: { id: string; label: string }[] = [
  { id: 'employee-history', label: 'Histórico de colaboradores' },
  { id: 'movements', label: 'Movimentos de colaboradores' },
  { id: 'admissions', label: 'Admissões' },
  { id: 'exits', label: 'Saídas' },
  { id: 'transfers', label: 'Transferências' },
  { id: 'promotions', label: 'Promoções' },
  { id: 'position-changes', label: 'Alterações de cargos' },
  { id: 'department-changes', label: 'Alterações de departamentos' },
  { id: 'org-changes', label: 'Alterações organizacionais' },
  { id: 'activities-by-module', label: 'Actividades por módulo' },
  { id: 'activities-by-user', label: 'Actividades por utilizador' },
  { id: 'changes-by-period', label: 'Alterações por período' },
];
