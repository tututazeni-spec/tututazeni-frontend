'use client';
// app/(platform)/api-integrations/page.tsx

import { useState } from 'react';
import { Plug, Key, Zap, BarChart2 } from 'lucide-react';
import { ApiKeysTab } from '@/components/api-integrations/ApiKeysTab';
import { IntegrationsTab } from '@/components/api-integrations/IntegrationsTab';
import { MonitoringTab } from '@/components/api-integrations/MonitoringTab';
import { WebhooksTab } from '@/components/api-integrations/WebhooksTab';
import type { Tab } from '@/components/api-integrations/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';

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
  const [tab, setTab] = useState('integrations');
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/integrações com sistemas externos.jpg"
          title="Integrações de API"
          hint={TABS.find((t) => t.id === tab)?.hint}
        />
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList items={TABS} />
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
