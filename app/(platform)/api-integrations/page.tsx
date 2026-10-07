'use client';
// app/(platform)/api-integrations/page.tsx

import { Plug, Key, Zap, BarChart2 } from 'lucide-react';
import { ApiKeysTab } from '@/components/api-integrations/ApiKeysTab';
import { IntegrationsTab } from '@/components/api-integrations/IntegrationsTab';
import { MonitoringTab } from '@/components/api-integrations/MonitoringTab';
import { WebhooksTab } from '@/components/api-integrations/WebhooksTab';
import type { Tab } from '@/components/api-integrations/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';

const TABS: Array<PillTabItem & { id: Tab }> = [
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

export default function ApiIntegrationsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-xl font-bold text-ink">
            Integrações de API
          </h1>
        </div>
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs defaultValue="integrations">
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={TABS} className="mx-auto max-w-7xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
          <TabsContent value="webhooks">
            <WebhooksTab />
          </TabsContent>
          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
