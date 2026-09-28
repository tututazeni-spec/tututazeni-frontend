'use client';
// src/app/(dashboard)/history/page.tsx

import { AuditTab } from '@/components/history/AuditTab';
import { TABS } from '@/components/history/constants';
import { MilestonesTab } from '@/components/history/MilestonesTab';
import { StatsTab } from '@/components/history/StatsTab';
import { TimelineTab } from '@/components/history/TimelineTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-xl font-bold text-ink">
              Histórico & Linha do Tempo
            </h1>
          </div>
          <p className="font-body text-sm text-ink-faint"></p>
        </div>
      </div>

      {/* Tabs — formato de "cartão": cada trigger é um cartão independente
          (borda + fundo branco + rounded), sem underline no container.
          Alinhadas horizontal e verticalmente (justify-center +
          items-center no TabsList, flex items-center em cada TabsTrigger)
          com largura mínima uniforme. Estado activo usa data-[state=active]
          do Radix para aplicar destaque azul (borda/fundo/texto primary). */}
      <Tabs defaultValue="timeline">
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

        <div className="max-w-7xl mx-auto px-6 py-6">
          <TabsContent value="timeline">
            <TimelineTab />
          </TabsContent>
          <TabsContent value="milestones">
            <MilestonesTab />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}