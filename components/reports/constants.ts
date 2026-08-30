// components/reports/constants.ts
// Configuração de categorias, caminhos de API por template e tabs
// do módulo de relatórios. Extraído de
// app/(platform)/reports/page.tsx.
//
// CAT_CONFIG usa os tokens semânticos da fundação de design (Fase A) —
// há 8 categorias mas só 6 intents semânticos disponíveis
// (primary/accent/success/warning/danger/info) + neutral, por isso
// OPERATIONAL e FINANCIAL partilham o token neutral (mesmo padrão de
// reutilização já usado em SurveysTab do engagement, onde DRAFT e
// ARCHIVED partilham o intent neutral).

import {
  Activity,
  BarChart2,
  Brain,
  BookOpen,
  Save,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  accent: { color: 'text-accent', bg: 'bg-accent-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

export const CAT_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  HR: { label: 'RH & Pessoas', icon: Users, ...TOKEN.primary },
  LEARNING: { label: 'Aprendizagem', icon: BookOpen, ...TOKEN.info },
  PERFORMANCE: { label: 'Performance', icon: Star, ...TOKEN.warning },
  TALENT: { label: 'Talento', icon: TrendingUp, ...TOKEN.success },
  ENGAGEMENT: { label: 'Envolvimento', icon: Activity, ...TOKEN.accent },
  COMPLIANCE: { label: 'Compliance', icon: Shield, ...TOKEN.danger },
  OPERATIONAL: { label: 'Operacional', icon: BarChart2, ...TOKEN.neutral },
  FINANCIAL: { label: 'Financeiro', icon: BarChart2, ...TOKEN.neutral },
};

export const REPORT_PATHS: Record<string, string> = {
  headcount: `/reports/hr/headcount`,
  turnover: `/reports/hr/turnover`,
  training: `/reports/learning/training`,
  'skill-gap': `/reports/learning/skill-gap`,
  performance: `/reports/performance`,
  talent: `/reports/talent`,
  engagement: `/reports/engagement`,
  compliance: `/reports/compliance`,
  usage: `/reports/operational/usage`,
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'hub', label: 'Central de Relatórios', icon: BarChart2 },
  { id: 'saved', label: 'Meus Relatórios', icon: Save },
  { id: 'insights', label: 'Análises de IA', icon: Brain },
];

// Templates base para o formulário "Criar Relatório" — espelha os 9
// templates built-in do backend (reports.service.ts#getBuiltInTemplates).
// Cada um traz o `reportKey` (rota em REPORT_PATHS) e a `category`
// (ReportCategory) para o POST /reports/saved.
export const REPORT_TEMPLATES: {
  reportKey: string;
  name: string;
  category: string;
}[] = [
  {
    reportKey: 'headcount',
    name: 'Relatório de Colaboradores',
    category: 'HR',
  },
  { reportKey: 'turnover', name: 'Análise da Rotatividade', category: 'HR' },
  {
    reportKey: 'training',
    name: 'Relatório de Formação',
    category: 'LEARNING',
  },
  {
    reportKey: 'skill-gap',
    name: 'Lacunas de Competências',
    category: 'LEARNING',
  },
  {
    reportKey: 'performance',
    name: 'Relatório de Desempenho',
    category: 'PERFORMANCE',
  },
  { reportKey: 'talent', name: 'Inteligência de Talentos', category: 'TALENT' },
  {
    reportKey: 'engagement',
    name: 'Envolvimento dos Colaboradores',
    category: 'ENGAGEMENT',
  },
  {
    reportKey: 'compliance',
    name: 'Relatório de Compliance',
    category: 'COMPLIANCE',
  },
  {
    reportKey: 'usage',
    name: 'Utilização da Plataforma',
    category: 'OPERATIONAL',
  },
];
