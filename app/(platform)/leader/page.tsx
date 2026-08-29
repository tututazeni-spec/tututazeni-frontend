'use client';
// src/app/(dashboard)/leader/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/leader/ — mesmo padrão de app/(platform)/engagement/page.tsx
// (piloto da fundação de design).

import { RefreshCw, Users } from 'lucide-react';
import { DashboardTab } from '@/components/leader/DashboardTab';
import { PerformanceTab } from '@/components/leader/PerformanceTab';
import { PlansTab } from '@/components/leader/PlansTab';
import { TABS } from '@/components/leader/constants';
import { TalentPipelineTab } from '@/components/leader/TalentPipelineTab';
import { TeamTab } from '@/components/leader/TeamTab';
import { IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function LeaderPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5"></div>
              <h1 className="font-display text-xl font-bold text-ink">
                Centro de Liderança
              </h1>
            </div>
            <p className="font-body text-sm text-ink-faint"></p>
          </div>
          <IconButton
            icon={RefreshCw}
            label="Actualizar"
            intent="secondary"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>

      <Tabs defaultValue="dashboard">
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
                  <Icon size={15} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="team">
            <TeamTab />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="pipeline">
            <TalentPipelineTab />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
