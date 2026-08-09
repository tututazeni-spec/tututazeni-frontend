'use client';
// src/app/(dashboard)/avatar-training/page.tsx
//
// Container: gere o separador activo, a sessão de chat activa e o modal de
// resultado; delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/avatar-training/ (mesmo padrão que
// components/payslips/page.tsx usa para ListView/CompareView/AnnualView).
// Ver memory project_innova_component_separation_audit.

import { useState } from 'react';
import { BarChart2, Bot, Clock, Play, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
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
  Tab,
} from '@/components/avatar-training/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', icon: Bot },
  { id: 'scenarios', label: 'Cenários', icon: Play },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'leaderboard', label: 'Ranking', icon: Trophy },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function AvatarTrainingPage() {
  const [tab, setTab] = useState<Tab>('home');
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
      alert('Erro ao iniciar sessão. Tenta novamente.');
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

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    home: <HomeTab onStartScenario={handleStart} />,
    scenarios: <ScenariosTab onStart={handleStart} />,
    history: <HistoryTab />,
    leaderboard: <LeaderboardTab />,
    analytics: <AnalyticsTab />,
    session: <div />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Bot size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Avatar Training
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Simulações imersivas · Roleplay com IA · Feedback comportamental
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">{TAB_COMPONENTS[tab]}</div>
    </div>
  );
}
