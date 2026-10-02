// components/departments/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/departments/page.tsx (o `titles` original vivia como
// const local dentro do componente principal; hoisted para módulo,
// mesmo padrão de NAV/TITLES usado nos restantes módulos deste tipo).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { PosLevel, View } from './types';

export const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'list', label: 'Lista' },
  { id: 'structure', label: 'Estrutura Organizacional' },
  { id: 'tree', label: 'Organograma' },
  { id: 'heads', label: 'Responsáveis' },
  { id: 'employees', label: 'Colaboradores' },
  { id: 'positions', label: 'Cargos & Funções' },
  { id: 'hierarquia', label: 'Hierarquia' },
  { id: 'historico', label: 'Histórico' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'dashboard', label: 'Dashboard' },
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
