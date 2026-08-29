'use client';
// app/(platform)/api-integrations/page.tsx

import { Plug, Key, Zap, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApiKeysTab } from '@/components/api-integrations/ApiKeysTab';
import { IntegrationsTab } from '@/components/api-integrations/IntegrationsTab';
import { MonitoringTab } from '@/components/api-integrations/MonitoringTab';
import { WebhooksTab } from '@/components/api-integrations/WebhooksTab';
import type { Tab } from '@/components/api-integrations/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'webhooks', label: 'Webhooks', icon: Zap },
  { id: 'api-keys', label: 'Chaves de API', icon: Key },
  { id: 'monitoring', label: 'Monitoramento', icon: BarChart2 },
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

      <Tabs defaultValue="integrations">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={
                    i < TABS.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
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
