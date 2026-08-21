'use client';
// src/app/(dashboard)/avatar-training/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix), a sessão de chat
// activa e o modal de resultado; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/avatar-training/
// (mesmo padrão que components/payslips/page.tsx usa para
// ListView/CompareView/AnnualView, e que app/(platform)/engagement/page.tsx
// usa para os seus próprios separadores). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { BarChart2, Bot, Clock, Play, Trophy } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AnalyticsTab } from '@/components/avatar-training/AnalyticsTab';
import { ChatSession } from '@/components/avatar-training/ChatSession';
import { HistoryTab } from '@/components/avatar-training/HistoryTab';
import { HomeTab } from '@/components/avatar-training/HomeTab';
import { LeaderboardTab } from '@/components/avatar-training/LeaderboardTab';
import { ResultsModal } from '@/components/avatar-training/ResultsModal';
import { ScenariosTab } from '@/components/avatar-training/ScenariosTab';
import type {
  ActiveSession,
  Scenario,
  SessionResult,
  StartSessionResponse,
} from '@/components/avatar-training/types';

const TABS = [
  { id: 'home', label: 'Início', icon: Bot },
  { id: 'scenarios', label: 'Cenários', icon: Play },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'leaderboard', label: 'Classificação', icon: Trophy },
  { id: 'analytics', label: 'Análises', icon: BarChart2 },
] as const;

export default function AvatarTrainingPage() {
  const notify = useToast();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(
    null,
  );
  const [lastScenario, setLastScenario] = useState<Scenario | null>(null);

  const handleStart = async (scenario: Scenario) => {
    setLastScenario(scenario);
    try {
      const r = await apiClient.post<StartSessionResponse>(
        '/avatar-training/sessions/start',
        {
          scenarioId: scenario.id,
        },
      );
      setActiveSession({
        id: r.session.id,
        scenarioId: scenario.id,
        conversationHistory: [
          {
            role: 'AVATAR',
            content: r.openingMessage,
            timestamp: new Date().toISOString(),
          },
        ],
        scenario: r.session.scenario,
        avatar: r.avatar,
      });
    } catch (e) {
      reportError(e, { source: 'AvatarTrainingPage.startSession' });
      notify({
        title: 'Erro ao iniciar sessão. Tenta novamente.',
        intent: 'danger',
      });
    }
  };

  const handleComplete = (result: SessionResult) => {
    setActiveSession(null);
    setSessionResult(result);
  };

  const handleRetry = async () => {
    setSessionResult(null);
    if (lastScenario) await handleStart(lastScenario);
  };

  const handleNext = async () => {
    setSessionResult(null);
    if (sessionResult?.nextScenario)
      await handleStart(sessionResult.nextScenario);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Active Session overlay */}
      {activeSession && (
        <ChatSession
          session={activeSession}
          onComplete={handleComplete}
          onClose={() => setActiveSession(null)}
        />
      )}

      {/* Results overlay */}
      {sessionResult && (
        <ResultsModal
          result={sessionResult}
          onClose={() => setSessionResult(null)}
          onRetry={handleRetry}
          onNext={sessionResult.nextScenario ? handleNext : undefined}
        />
      )}

      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-xl font-bold text-ink">
                Treino Com Avatar
              </h1>
            </div>
            <p className="font-body text-sm text-ink-faint"></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="home">
        <div className="bg-surface border-b border-border px-6">
          <TabsList className="max-w-7xl mx-auto overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <TabsContent value="home">
            <HomeTab onStartScenario={handleStart} />
          </TabsContent>
          <TabsContent value="scenarios">
            <ScenariosTab onStart={handleStart} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="leaderboard">
            <LeaderboardTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
