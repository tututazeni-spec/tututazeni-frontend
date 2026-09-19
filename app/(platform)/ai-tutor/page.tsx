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
import { ComingSoonView } from '@/components/ai-tutor/ComingSoonView';
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
          <ComingSoonView
            title="Analytics detalhado — em construção"
            description="Métricas aprofundadas de utilização do AI Tutor para a Academia/RH, para além dos indicadores já disponíveis em Visão Geral."
            planned={[
              'Perguntas por curso',
              'Taxa de utilização',
              'Tempo médio por sessão',
              'Exercícios realizados',
              'Recomendações aceites',
              'Perguntas sem resposta',
            ]}
          />
        </TabsContent>
        <TabsContent value="settings">
          <ComingSoonView
            title="Configurações — em construção"
            description="Gestão do modelo de IA, prompts, fontes autorizadas, limites de utilização e privacidade do AI Tutor."
            planned={[
              'Modelo de IA',
              'Fontes autorizadas',
              'Limites de utilização',
              'Idiomas',
              'Privacidade e segurança',
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
