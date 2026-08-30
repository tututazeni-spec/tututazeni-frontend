// components/settings/styles.ts
// Metadados de navegação do módulo de definições (dados, não estilos).
// Migrado para componentes/tokens em Fase B.

import type { Tab } from './types';

export const NAV: Array<{ key: Tab; label: string }> = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'seguranca', label: 'Segurança' },
  { key: 'permissoes', label: 'Permissões' },
];
