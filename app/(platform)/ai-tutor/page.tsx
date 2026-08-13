// src/app/(dashboard)/ai-tutor/page.tsx
'use client';

import { useState } from 'react';
import { NAV, TITLES } from '@/components/ai-tutor/constants';
import { ChatView } from '@/components/ai-tutor/ChatView';
import { GenerateView } from '@/components/ai-tutor/GenerateView';
import { HistoryView } from '@/components/ai-tutor/HistoryView';
import { RecommendationsView } from '@/components/ai-tutor/RecommendationsView';
import type { View } from '@/components/ai-tutor/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function AiTutorPage() {
  const [view, setView] = useState<View>('chat');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="font-body text-sm text-ink-faint mt-0.5">
            INNOVA — Assistente de Aprendizagem Inteligente
          </p>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-6 w-fit">
          {NAV.map((n) => (
            <TabsTrigger key={n.id} value={n.id}>
              {n.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="chat">
          <ChatView />
        </TabsContent>
        <TabsContent value="generate">
          <GenerateView />
        </TabsContent>
        <TabsContent value="recommendations">
          <RecommendationsView />
        </TabsContent>
        <TabsContent value="history">
          <HistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
