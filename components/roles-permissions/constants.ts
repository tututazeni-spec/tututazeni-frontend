// components/roles-permissions/constants.ts
// Navegação de tabs do módulo de roles & permissions. Extraído de
// app/(platform)/roles-permissions/page.tsx.

import { Activity, Key, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'roles', label: 'Funções', icon: Shield },
  { id: 'matrix', label: 'Matriz', icon: Key },
  { id: 'governance', label: 'Governança', icon: Activity },
];
