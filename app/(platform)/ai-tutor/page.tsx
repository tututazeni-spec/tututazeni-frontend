// src/app/(dashboard)/ai-tutor/page.tsx
'use client';

import { useState } from 'react';
import { EMPLOYEE_NAV, ADMIN_NAV, TITLES } from '@/components/ai-tutor/constants';
import { ChatView } from '@/components/ai-tutor/ChatView';
import { OverviewView } from '@/components/ai-tutor/OverviewView';
import { KnowledgeBaseView } from '@/components/ai-tutor/KnowledgeBaseView';
import { SessionsView } from '@/components/ai-tutor/SessionsView';
import { ExercisesView } from '@/components/ai-tutor/ExercisesView';
import { RecommendationsView } from '@/components/ai-tutor/RecommendationsView';
import { AnalyticsView } from '@/components/ai-tutor/AnalyticsView';
import { SettingsView } from '@/components/ai-tutor/SettingsView';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import type { View } from '@/components/ai-tutor/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const PRIVILEGED_ROLES = new Set(['ADMIN', 'RH']);

export default function AiTutorPage() {
  const role = useCurrentRole();
  const isPrivileged = !!role && PRIVILEGED_ROLES.has(role);
  const nav = isPrivileged ? ADMIN_NAV : EMPLOYEE_NAV;
  const [view, setView] = useState<View>('overview');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">{TITLES[view]}</h1>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-6 w-fit">
          {nav.map((n) => (
            <TabsTrigger key={n.id} value={n.id}>
              {n.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewView />
        </TabsContent>
        <TabsContent value="chat">
          <ChatView />
        </TabsContent>
        <TabsContent value="knowledge">
          <KnowledgeBaseView />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsView />
        </TabsContent>
        <TabsContent value="exercises">
          <ExercisesView />
        </TabsContent>
        <TabsContent value="recommendations">
          <RecommendationsView />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsView />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
