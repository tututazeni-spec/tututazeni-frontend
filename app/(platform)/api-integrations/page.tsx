'use client';
// src/app/(dashboard)/api-integrations/page.tsx

import { useState } from 'react';
import { Plug, Key, Zap, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApiKeysTab } from '@/components/api-integrations/ApiKeysTab';
import { IntegrationsTab } from '@/components/api-integrations/IntegrationsTab';
import { MonitoringTab } from '@/components/api-integrations/MonitoringTab';
import { WebhooksTab } from '@/components/api-integrations/WebhooksTab';
import type { Tab } from '@/components/api-integrations/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'webhooks', label: 'Webhooks', icon: Zap },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'monitoring', label: 'Monitoramento', icon: BarChart2 },
];

const PANELS: Record<Tab, JSX.Element> = {
  integrations: <IntegrationsTab />,
  webhooks: <WebhooksTab />,
  'api-keys': <ApiKeysTab />,
  monitoring: <MonitoringTab />,
};

export default function ApiIntegrationsPage() {
  const [tab, setTab] = useState<Tab>('integrations');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Plug size={18} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              API Integrations
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Integrações · Webhooks · API Keys · Monitoramento
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">{PANELS[tab]}</div>
    </div>
  );
}
