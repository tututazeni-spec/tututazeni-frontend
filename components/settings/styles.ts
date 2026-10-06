// components/settings/styles.ts
// Metadados de navegação do módulo de definições (dados, não estilos).
// `adminOnly`: separadores de configuração da organização (ROLE ADMIN no
// docs/modulo_settings.md) — escondidos para os restantes utilizadores.

import type { Tab } from './types';

export const NAV: Array<{ key: Tab; label: string; adminOnly?: boolean }> = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'visao-geral', label: 'Visão Geral', adminOnly: true },
  { key: 'permissoes', label: 'Permissões' },
  { key: 'utilizadores', label: 'Utilizadores', adminOnly: true },
  { key: 'seguranca', label: 'Segurança' },
];
