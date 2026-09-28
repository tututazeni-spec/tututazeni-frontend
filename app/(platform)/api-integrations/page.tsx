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

      {/* Tabs — formato de "cartão": cada trigger é um cartão independente
          (borda + fundo branco + rounded), sem underline no container.
          Alinhadas horizontal e verticalmente (justify-center +
          items-center no TabsList, flex items-center em cada TabsTrigger)
          com largura mínima uniforme. Estado activo usa data-[state=active]
          do Radix para aplicar destaque azul (borda/fundo/texto primary). */}
      <Tabs defaultValue="integrations">
        <div className="bg-surface px-6 py-3">
          <TabsList className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-x-auto bg-transparent p-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-center text-sm font-medium text-foreground shadow-none
                             data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
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