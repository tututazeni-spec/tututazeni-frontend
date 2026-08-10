// components/history/constants.ts
// Configuração visual de categorias e navegação de tabs do módulo
// de histórico. Extraído de app/(platform)/history/page.tsx.

import { Activity, Award, Clock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
  LEARNING: { color: 'text-blue-700', bg: 'bg-blue-100' },
  PERFORMANCE: { color: 'text-amber-700', bg: 'bg-amber-100' },
  CAREER: { color: 'text-violet-700', bg: 'bg-violet-100' },
  ENGAGEMENT: { color: 'text-pink-700', bg: 'bg-pink-100' },
  SYSTEM: { color: 'text-slate-600', bg: 'bg-slate-100' },
  COMPLIANCE: { color: 'text-red-700', bg: 'bg-red-100' },
  ATTENDANCE: { color: 'text-teal-700', bg: 'bg-teal-100' },
  FINANCIAL: { color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'milestones', label: 'Marcos', icon: Award },
  { id: 'stats', label: 'Actividade', icon: Activity },
  { id: 'audit', label: 'Auditoria', icon: Shield },
];
