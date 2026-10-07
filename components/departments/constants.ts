// components/departments/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/departments/page.tsx (o `titles` original vivia como
// const local dentro do componente principal; hoisted para módulo,
// mesmo padrão de NAV/TITLES usado nos restantes módulos deste tipo).

import {
  Briefcase,
  FileBarChart,
  GitBranch,
  History,
  Layers,
  LayoutDashboard,
  List,
  Network,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { PosLevel, View } from './types';

export const NAV: Array<{
  id: Exclude<View, 'detail'>;
  label: string;
  hint?: string;
  icon?: LucideIcon;
}> = [
  { id: 'list', hint: 'Todos os departamentos', icon: List, label: 'Lista' },
  {
    id: 'structure',
    hint: 'Estrutura organizacional',
    icon: Network,
    label: 'Estrutura Organizacional',
  },
  {
    id: 'tree',
    hint: 'Árvore da empresa',
    icon: GitBranch,
    label: 'Organograma',
  },
  { id: 'heads', hint: 'Chefias', icon: UserCog, label: 'Responsáveis' },
  {
    id: 'employees',
    hint: 'Equipa por departamento',
    icon: Users,
    label: 'Colaboradores',
  },
  {
    id: 'positions',
    hint: 'Cargos e funções',
    icon: Briefcase,
    label: 'Cargos & Funções',
  },
  {
    id: 'hierarquia',
    hint: 'Níveis hierárquicos',
    icon: Layers,
    label: 'Hierarquia',
  },
  {
    id: 'historico',
    hint: 'Alterações passadas',
    icon: History,
    label: 'Histórico',
  },
  {
    id: 'relatorios',
    hint: 'Exportações',
    icon: FileBarChart,
    label: 'Relatórios',
  },
  {
    id: 'dashboard',
    hint: 'Indicadores',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
];

export const TITLES: Record<View, string> = {
  list: 'Departamentos',
  structure: 'Estrutura Organizacional',
  tree: 'Organograma',
  heads: 'Responsáveis',
  employees: 'Colaboradores',
  positions: 'Cargos & Funções',
  hierarquia: 'Hierarquia',
  historico: 'Histórico',
  relatorios: 'Relatórios',
  detail: 'Detalhe do Departamento',
  dashboard: 'Dashboard Organizacional',
};

// 8 níveis de cargo sem correspondência semântica directa — cor de
// nível/profundidade tratada como decorativa, usa os 6 tokens de intent
// como paleta categórica estável (INTERN neutro; DIRECTOR/EXECUTIVE danger).
export const LEVEL_CFG: StatusBadgeMap<PosLevel> = {
  INTERN: { label: 'Estagiário', cls: 'bg-surface-sunken text-ink-muted' },
  JUNIOR: { label: 'Júnior', cls: 'bg-success-subtle text-success-ink' },
  MID: { label: 'Pleno', cls: 'bg-info-subtle text-info-ink' },
  SENIOR: { label: 'Sénior', cls: 'bg-primary-subtle text-primary' },
  LEAD: { label: 'Lead', cls: 'bg-accent-subtle text-accent' },
  MANAGER: { label: 'Gestor', cls: 'bg-warning-subtle text-warning-ink' },
  DIRECTOR: { label: 'Director', cls: 'bg-danger-subtle text-danger-ink' },
  EXECUTIVE: { label: 'Executivo', cls: 'bg-danger-subtle text-danger-ink' },
};
