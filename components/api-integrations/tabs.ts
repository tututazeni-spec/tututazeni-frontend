// components/api-integrations/tabs.ts
// Separadores da página "Integrações de API" e quais o papel pode ver.
import { Plug, Key, Zap, BarChart2 } from 'lucide-react';
import type { PillTabItem } from '@/components/ui/PillTabs';
import type { Role } from '@/lib/roles';
import type { Tab } from './types';

export type ApiIntegrationTabItem = PillTabItem & { id: Tab };

const TABS: ApiIntegrationTabItem[] = [
  {
    id: 'integrations',
    label: 'Integrações',
    hint: 'Sistemas ligados',
    icon: Plug,
  },
  { id: 'webhooks', label: 'Webhooks', hint: 'Eventos de saída', icon: Zap },
  {
    id: 'api-keys',
    label: 'Chaves de API',
    hint: 'Acesso programático',
    icon: Key,
  },
  {
    id: 'monitoring',
    label: 'Monitoramento',
    hint: 'Estado e consumo',
    icon: BarChart2,
  },
];

// Credenciais de longa duração e canais de saída de dados: o backend só deixa ADMIN gerir
// (src/api-integration/api-integration.controller.ts), por isso só ADMIN os vê.
const ADMIN_ONLY_TABS: ReadonlySet<Tab> = new Set<Tab>([
  'webhooks',
  'api-keys',
]);

export function visibleTabs(role: Role | undefined): ApiIntegrationTabItem[] {
  return TABS.filter((t) => !ADMIN_ONLY_TABS.has(t.id) || role === 'ADMIN');
}
