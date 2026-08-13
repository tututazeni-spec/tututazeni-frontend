'use client';
// app/(platform)/automation/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados +
// apresentação de cada separador aos componentes auto-contidos em
// components/automation/ (mesmo padrão que components/engagement/page.tsx
// usa). Ver memory project_innova_component_separation_audit.

import { Activity, BarChart2, BookOpen, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExecutionsTab } from '@/components/automation/ExecutionsTab';
import { RulesTab } from '@/components/automation/RulesTab';
import { StatsTab } from '@/components/automation/StatsTab';
import { TemplatesTab } from '@/components/automation/TemplatesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'rules', label: 'Automações', icon: Zap },
  { id: 'executions', label: 'Execuções', icon: Activity },
  { id: 'templates', label: 'Templates', icon: BookOpen },
  { id: 'stats', label: 'Analytics', icon: BarChart2 },
];

export default function AutomationPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="mb-1 flex items-center gap-2">
            <div className="rounded-control bg-accent-subtle p-1.5">
              <Zap size={18} strokeWidth={1.75} className="text-accent" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink">Automation</h1>
          </div>
          <p className="font-body text-sm text-ink-faint">
            Regras · Triggers · Execuções · Templates · Analytics
          </p>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap">
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="rules">
            <RulesTab />
          </TabsContent>
          <TabsContent value="executions">
            <ExecutionsTab />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
