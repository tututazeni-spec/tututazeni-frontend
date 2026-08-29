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

      <Tabs defaultValue="timeline">
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
