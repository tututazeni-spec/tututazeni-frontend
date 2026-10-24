'use client';
// app/(platform)/api-integrations/page.tsx

import { useState } from 'react';
import { ApiKeysTab } from '@/components/api-integrations/ApiKeysTab';
import { IntegrationsTab } from '@/components/api-integrations/IntegrationsTab';
import { MonitoringTab } from '@/components/api-integrations/MonitoringTab';
import { WebhooksTab } from '@/components/api-integrations/WebhooksTab';
import { visibleTabs } from '@/components/api-integrations/tabs';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';

export default function ApiIntegrationsPage() {
  const [tab, setTab] = useState('integrations');
  const role = useCurrentRole();
  const tabs = visibleTabs(role);
  const allowed = new Set<string>(tabs.map((t) => t.id));
  // Separador ativo deixou de estar disponível (ex.: papel carregou) → volta ao primeiro.
  const current = allowed.has(tab) ? tab : (tabs[0]?.id ?? 'integrations');
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/integrações com sistemas externos.jpg"
          title="Integrações de API"
          hint={tabs.find((t) => t.id === current)?.hint}
        />
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs value={current} onValueChange={setTab}>
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList items={tabs} />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
          {allowed.has('webhooks') && (
            <TabsContent value="webhooks">
              <WebhooksTab />
            </TabsContent>
          )}
          {allowed.has('api-keys') && (
            <TabsContent value="api-keys">
              <ApiKeysTab />
            </TabsContent>
          )}
          <TabsContent value="monitoring">
            <MonitoringTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
