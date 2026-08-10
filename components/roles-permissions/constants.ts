// components/roles-permissions/constants.ts
// Navegação de tabs do módulo de roles & permissions. Extraído de
// app/(platform)/roles-permissions/page.tsx.

import { Activity, Brain, Key, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'matrix', label: 'Matriz', icon: Key },
  { id: 'simulator', label: 'Simulador', icon: Brain },
  { id: 'governance', label: 'Governança', icon: Activity },
];
